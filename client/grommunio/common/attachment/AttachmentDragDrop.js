/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.attachment');

/**
 * @class Grommunio.common.attachment.AttachmentDragDrop
 * Reads the payload that {@link Grommunio.common.ui.messagepanel.AttachmentLinks}
 * puts on a drag, so an attachment dragged out of a message can be dropped back
 * into grommunio-web in another browser tab or window.
 * @singleton
 */
Grommunio.common.attachment.AttachmentDragDrop = {
	/**
	 * The MIME type under which a dragged attachment carries its bytes.
	 * @property
	 * @type String
	 */
	payloadType: 'application/x-grommunio-attachment',

	/**
	 * The MIME type applied when the payload names none, or names an invalid one.
	 * @property
	 * @type String
	 */
	defaultMimeType: 'application/octet-stream',

	/**
	 * @param {DataTransfer} dataTransfer The dataTransfer of a drag event
	 * @return {Boolean} True if the drag advertises an attachment payload
	 */
	hasPayload: function(dataTransfer)
	{
		if (!dataTransfer || !dataTransfer.types) {
			return false;
		}

		return Array.prototype.indexOf.call(dataTransfer.types, this.payloadType) >= 0;
	},

	/**
	 * Builds a {@link FileList} from the attachment payload of a drag.
	 *
	 * The list is built with the constructors of targetWindow because
	 * {@link Grommunio.core.data.IPMAttachmentStore#uploadFiles} accepts a FileList
	 * only when it is an instance of the one belonging to the window it runs in.
	 *
	 * @param {DataTransfer} dataTransfer The dataTransfer of a drag event
	 * @param {Object} targetWindow The browser window the files are uploaded from
	 * @return {FileList} The dragged files, or undefined when there are none
	 */
	getFileList: function(dataTransfer, targetWindow)
	{
		if (!this.hasPayload(dataTransfer)) {
			return undefined;
		}

		var payloads = this.parsePayload(dataTransfer);
		if (Ext.isEmpty(payloads)) {
			return undefined;
		}

		var win = targetWindow || window;
		if (!Ext.isFunction(win.File) || !Ext.isFunction(win.DataTransfer)) {
			return undefined;
		}

		var maxSize = this.getMaxSize();
		var builder = new win.DataTransfer();
		var count = 0;

		for (var i = 0, len = payloads.length; i < len; i++) {
			var file = this.buildFile(payloads[i], win, maxSize);
			if (file) {
				builder.items.add(file);
				count++;
			}
		}

		return count > 0 ? builder.files : undefined;
	},

	/**
	 * @param {DataTransfer} dataTransfer The dataTransfer of a drag event
	 * @return {Array} The payload entries, empty when the drag carries none
	 * @private
	 */
	parsePayload: function(dataTransfer)
	{
		var raw;
		try {
			raw = dataTransfer.getData(this.payloadType);
		} catch (e) {
			return [];
		}

		if (Ext.isEmpty(raw)) {
			return [];
		}

		var payloads;
		try {
			payloads = JSON.parse(raw);
		} catch (e) {
			return [];
		}

		return Ext.isArray(payloads) ? payloads : [payloads];
	},

	/**
	 * Turns one payload entry into a {@link File} of the given window. The
	 * payload reaches us through the drag and is not trusted: the name is
	 * reduced to its basename, the MIME type must be well formed, and the
	 * decoded size is held to the server's embed limit.
	 *
	 * @param {Object} payload One payload entry, holding name, type and base64 data
	 * @param {Object} win The browser window whose File constructor is used
	 * @param {Number} maxSize The largest accepted size in bytes, 0 for no limit
	 * @return {File} The file, or undefined when the entry is unusable
	 * @private
	 */
	buildFile: function(payload, win, maxSize)
	{
		if (!payload || Ext.isEmpty(payload.name) || !Ext.isString(payload.data)) {
			return undefined;
		}

		var name = String(payload.name).replace(/[\r\n]+/g, ' ').replace(/^.*[\\/]/, '');
		if (Ext.isEmpty(name)) {
			return undefined;
		}

		var mimeType = String(payload.type || '').split(';')[0].trim();
		if (!(/^[\w.+-]+\/[\w.+-]+$/).test(mimeType)) {
			mimeType = this.defaultMimeType;
		}

		// Check the encoded length before decoding: the payload arrives over a
		// drag, so an oversized one must not be turned into bytes first.
		if (maxSize > 0 && this.decodedLength(payload.data) > maxSize) {
			return undefined;
		}

		var bytes = this.decodeBase64(payload.data, win);
		if (!bytes || (maxSize > 0 && bytes.length > maxSize)) {
			return undefined;
		}

		try {
			return new win.File([bytes], name, { type: mimeType });
		} catch (e) {
			return undefined;
		}
	},

	/**
	 * The number of bytes a base64 string decodes to, computed from its length
	 * so an oversized payload can be rejected before it is decoded.
	 * @param {String} base64 The base64 encoded file content
	 * @return {Number} The decoded length in bytes
	 * @private
	 */
	decodedLength: function(base64)
	{
		var text = String(base64).replace(/[\r\n\s]+/g, '');
		var padding = 0;
		if (text.charAt(text.length - 1) === '=') {
			padding = text.charAt(text.length - 2) === '=' ? 2 : 1;
		}

		return Math.max(0, Math.floor(text.length / 4) * 3 - padding);
	},

	/**
	 * @param {String} base64 The base64 encoded file content
	 * @param {Object} win The browser window whose Uint8Array is used
	 * @return {Uint8Array} The decoded bytes, or undefined when undecodable
	 * @private
	 */
	decodeBase64: function(base64, win)
	{
		try {
			var binary = win.atob(String(base64));
			var bytes = new win.Uint8Array(binary.length);
			for (var i = 0, len = binary.length; i < len; i++) {
				bytes[i] = binary.charCodeAt(i);
			}

			return bytes;
		} catch (e) {
			return undefined;
		}
	},

	/**
	 * @return {Number} The largest accepted payload size in bytes, 0 for no limit
	 * @private
	 */
	getMaxSize: function()
	{
		var serverConfig = container.getServerConfig();
		if (serverConfig && Ext.isFunction(serverConfig.getAttachmentDragOutMaxSize)) {
			return serverConfig.getAttachmentDragOutMaxSize();
		}

		return 0;
	}
};
