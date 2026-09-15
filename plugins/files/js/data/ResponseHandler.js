/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.ResponseHandler
 * @extends Grommunio.core.data.AbstractResponseHandler
 * @xtype filesplugin.responsehandler
 *
 * Files plugin specific response handler.
 */
Grommunio.plugins.files.data.ResponseHandler = Ext.extend(Grommunio.core.data.IPMResponseHandler, {

	/**
	 * @cfg {String} nodeId The ID of the opened node in the file tree received from Files.
	 */
	nodeId: undefined,

	/**
	 * @cfg {Function} successCallback The function which
	 * will be called after success request.
	 */
	successCallback: null,

	/**
	 * @cfg {Function} failureCallback The function which
	 * will be called after a failed request.
	 */
	failureCallback: null,

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doGetquota: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doGetbackends: function (response) {

		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doGetversion: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doGetfilestree: function (response) {
		this.successCallback(response.items, response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doCheckifexists: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doDownloadtotmp: function (response) {
		this.successCallback(response.items, response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doCreatedir: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doUploadtobackend: function (response) {
		this.successCallback(response);
	},

	/**
	 * In case exception happened on server, server will return
	 * exception response with the code of exception.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doError: function (response) {
		container.getNotifier().notify('error.files', _('Error'), Ext.util.Format.htmlEncode(response.info.original_message));
	}
});

Ext.reg('filesplugin.responsehandler', Grommunio.plugins.files.data.ResponseHandler);
