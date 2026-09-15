/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.previewer.ui');

/**
 * @class Grommunio.common.previewer.ui.ViewerPanel
 * @extends Ext.BoxComponent
 * @xtype grommunio.viewerpanel
 *
 * The document previewer itself: an iframe holding either the bundled pdf.js
 * viewer or the viewer page, which renders everything else. It takes a record
 * that can hand out an inline URL and a file name, so both mail attachments
 * and files of the Files context can be shown by it.
 */
Grommunio.common.previewer.ui.ViewerPanel = Ext.extend(Ext.BoxComponent, {

	/**
	 * @cfg {String} viewerjsPath Path to the viewer page, relative to the
	 * grommunio Web root.
	 */
	viewerjsPath: 'client/filepreviewer/ViewerJS/index.html',

	/**
	 * @cfg {String} pdfjsPath Path to the pdf.js viewer, relative to the
	 * grommunio Web root.
	 */
	pdfjsPath: 'client/filepreviewer/pdfjs/web/viewer.html',

	/**
	 * @cfg {Ext.data.Record} record The record to preview. It must provide
	 * getInlineImageUrl() and carry a 'name' or 'filename' property.
	 */
	record: undefined,

	/**
	 * @cfg {String} src The frame source, for a previewer that is not driven
	 * by a {@link #record}.
	 */
	src: '',

	/**
	 * @property {String} documentTitle The file name of the previewed document.
	 */
	documentTitle: '',

	/**
	 * @property {String} tag The element the document is shown in: an iframe,
	 * or a webview in DeskApp, which keeps the document out of the
	 * application's own context.
	 */
	tag: 'iframe',

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		var src = config.src;
		if (Ext.isDefined(config.record)) {
			this.documentTitle = this.getDocumentTitle(config.record);
			src = this.getViewerUrl(config.record);
		} else {
			this.documentTitle = config.title || '';
		}

		this.tag = Grommunio.isDeskApp ? 'webview' : 'iframe';
		if (this.tag === 'webview') {
			// Load a blank page first, the document follows once the
			// credentials have been injected into the webview.
			this.viewerSrc = src;
			src = Ext.SSL_SECURE_URL;
		}

		Ext.applyIf(config, {
			xtype: 'grommunio.viewerpanel',
			autoEl: {
				tag: this.tag,
				src: src,
				style: {
					width: '100%',
					height: '100%'
				},
				frameborder: 0,
				allowfullscreen: true
			}
		});

		Grommunio.common.previewer.ui.ViewerPanel.superclass.constructor.call(this, config);
	},

	/**
	 * The file name of a record, whichever property it keeps it in.
	 *
	 * @param {Ext.data.Record} record The record to preview
	 * @return {String} The file name
	 */
	getDocumentTitle: function (record)
	{
		return record.get('name') || record.get('filename') || '';
	},

	/**
	 * Show another document in this previewer.
	 *
	 * @param {Ext.data.Record} record The record to preview
	 */
	setRecord: function (record)
	{
		this.record = record;
		this.documentTitle = this.getDocumentTitle(record);

		var src = this.getViewerUrl(record);
		if (this.tag === 'webview' && !this.credentialsInjected) {
			// The webview is still waiting for its cookies; onLoadWebview
			// picks up the document from here once they are in.
			this.viewerSrc = src;
			return;
		}

		if (this.rendered) {
			this.getEl().dom.src = src;
		} else {
			this.autoEl.src = src;
		}
	},

	/**
	 * The URL of the viewer that can show the record: the pdf.js viewer for a
	 * PDF, the viewer page for everything else. The renderer is named in the
	 * URL so that the viewer does not have to work out the format a second
	 * time, and the version is carried along because the viewer pages are
	 * cached by the browser until an upgrade.
	 *
	 * @param {Ext.data.Record} record The record to preview
	 * @return {String} The URL to load into the frame
	 */
	getViewerUrl: function (record)
	{
		var formats = Grommunio.common.previewer.data.Formats;
		var name = this.getDocumentTitle(record);
		var extension = formats.getExtension(name);
		var renderer = formats.getRenderer(name);
		var settings = container.getSettingsModel();
		var root = container.getBasePath();
		var url = record.getInlineImageUrl();
		var language = settings.get('grommunio/v1/main/language').split('.')[0].replace('_', '-');

		if (renderer === 'pdf') {
			// pdf.js takes the file name from the URL when the document is
			// downloaded from the viewer. A hash would truncate it there.
			url += '&filename=' + name.replace('#', '-');

			return root + this.pdfjsPath + '?file=' + encodeURIComponent(url) +
				'&version=' + container.getVersion().getWebApp() +
				'&theme=' + this.getTheme() +
				'&locale=' + language +
				'#zoom=' + settings.get('grommunio/v1/main/file_previewer/pdf_zoom');
		}

		var options = '?version=' + container.getVersion().getWebApp() +
			'&locale=' + language +
			'&type=' + extension +
			// The viewer cannot see the stylesheet of grommunio Web.
			'&theme=' + this.getTheme() +
			'&accent=' + this.getAccentColour();

		if (renderer) {
			options += '&plugin=' + renderer;
		}

		// Images are fitted to the width of the frame; the zoom levels apply
		// to documents that have a page size of their own.
		var fitsFrame = renderer === 'image' || renderer === 'media';
		options += '&zoom=' + (fitsFrame ? 'auto' : settings.get('grommunio/v1/main/file_previewer/odf_zoom'));

		return root + this.viewerjsPath + options + '#' + url;
	},

	/**
	 * Whether grommunio Web is being shown light or dark at the moment.
	 *
	 * @return {String} 'dark' or 'light'
	 */
	getTheme: function ()
	{
		return Grommunio.core.DarkMode && Grommunio.core.DarkMode.isDark() ? 'dark' : 'light';
	},

	/**
	 * The accent colour of the theme the user is running, as six hexadecimal
	 * digits, so the viewer can highlight with the same colour.
	 *
	 * @return {String} The colour, without its leading hash
	 */
	getAccentColour: function ()
	{
		var value = window.getComputedStyle(document.body)
			.getPropertyValue('--theme-primary-color').trim();
		var match = (/^#([0-9a-f]{6})$/i).exec(value);

		return match ? match[1] : '1976d2';
	},

	/**
	 * Called after the component has been rendered, registers the handlers
	 * that reach into the previewer frame.
	 * @protected
	 */
	afterRender: function ()
	{
		Grommunio.common.previewer.ui.ViewerPanel.superclass.afterRender.apply(this, arguments);

		var el = this.getEl();
		el.on('load', this.onLoadFrame, this);

		if (this.tag === 'webview') {
			el.on('contentload', this.onLoadWebview, this, {single: true});
			el.dom.addEventListener('permissionrequest', this.handlePermissionRequests);
			el.dom.addEventListener('dialog', this.handleDialogRequests, this);
			el.dom.addEventListener('loadstop', this.onWebViewLoadstop, el.dom);
			el.dom.addEventListener('newwindow', this.newWindowHandler);
		}
	},

	/**
	 * Handler for the 'loadstop' event of a WEBVIEW, fired after its content
	 * has been loaded. Injects a script into the WEBVIEW context that opens
	 * the links of a PDF in a new tab.
	 * @private
	 */
	onWebViewLoadstop: function ()
	{
		// The script tag is appended after all other scripts so that it sees
		// the globals they export, and removed again to keep the DOM clean.
		this.executeScript({ code: "var script = document.createElement('script');" +
				"script.textContent = '(' + function() " +
				"{if(window.PDFJS) {window.PDFJS.externalLinkTarget = window.PDFJS.LinkTarget.BLANK;}}" +
				" + ')();';" +
				"(document.head||document.documentElement).appendChild(script);" +
				"script.remove();"
		});
	},

	/**
	 * Handler for the 'load' event of the frame. Passes the Escape key on to
	 * the surrounding window so a preview can be closed from inside the frame,
	 * opens the links of a PDF in a new tab, and lets the download button of
	 * the viewer skip the download requester.
	 * @private
	 */
	onLoadFrame: function ()
	{
		var dom = this.getEl().dom;
		var frameDom = dom.contentDocument;

		if (!frameDom) {
			return;
		}

		// The pdf.js viewer settles itself; this runs on the load event of the
		// frame, long after it has started.
		frameDom.addEventListener('keydown', function (origEvent) {
			if (origEvent.keyCode === 27) {
				dom.dispatchEvent(new KeyboardEvent(origEvent.type, origEvent));
			}
		});

		// The pdf.js viewer download button is 'downloadButton' (pdf.js >= 4);
		// fall back to the legacy 'download' id for older viewer builds.
		var download = frameDom.getElementById('downloadButton') || frameDom.getElementById('download');
		if (download) {
			Ext.get(download).on('click', function () {
				Grommunio.core.Util.skipRequester = true;
			});
		}
	},

	/**
	 * Handler for the contentload event of the webview. Injects the grommunio
	 * Web cookies into the webview, so documents can be loaded.
	 * @private
	 */
	onLoadWebview: function ()
	{
		var dom = this.getEl().dom;
		var iframeCookieStoreId = dom.getCookieStoreId();
		var cookieCounter = 0;
		window.chrome.cookies.getAll({url: location.href}, function (cookies) {
			cookies.forEach(function (c) {
				var cookie = {
					url: location.href,
					name: c.name,
					value: c.value,
					path: c.path,
					secure: c.secure,
					httpOnly: c.httpOnly,
					sameSite: c.sameSite,
					storeId: iframeCookieStoreId
				};
				window.chrome.cookies.set(cookie, function () {
					if (++cookieCounter === cookies.length) {
						this.credentialsInjected = true;
						dom.src = this.viewerSrc;
					}
				}.bind(this));
			}.bind(this));
		}.bind(this));
	},

	/**
	 * Handler of the newwindow event of a WEBVIEW element. Chrome blocks new
	 * windows from a WEBVIEW, so the request is carried out here.
	 *
	 * @param {Event} event The newwindow event
	 * @private
	 */
	newWindowHandler: function (event)
	{
		switch (event.windowOpenDisposition) {
			case 'new_window':
			case 'new_background_tab':
			case 'new_foreground_tab':
			case 'new_popup':
				var newWindow = window.open(event.targetUrl, '_blank');
				if (newWindow) {
					newWindow.focus();
				}
				return;
			// Ignore other cases like "save_to_disk", "current_tab", "ignore" for the request of new window.
			default: return;
		}
	},

	/**
	 * Handler for the dialog event of WEBVIEW elements. Will handle alert, prompt,
	 * and confirm dialogs
	 * @param {Event} e The dialog event
	 * @private
	 */
	handleDialogRequests: function (e)
	{
		switch (e.messageType) {
			case "alert":
				window.alert(e.messageText); // eslint-disable-line no-alert
			break;
			case "confirm":
				var confirmation = window.confirm(e.messageText); // eslint-disable-line no-alert
				if (confirmation === true) {
					e.dialog.ok();
				} else {
					e.dialog.cancel();
				}
			break;
			case "prompt":
				var wprompt = window.prompt(e.messageText); // eslint-disable-line no-alert
				if (wprompt !== null) {
					e.dialog.ok(wprompt);
				} else {
					e.dialog.cancel();
				}
			break;
		}
	},

	/**
	 * Handler for the permissionrequest event of WEBVIEW elements. Will handle the request
	 * by its type.
	 * Possible types are media, geolocation, pointerLock, download, loadplugin and fullscreen.
	 * For now we deny geolocation, fullscreen and pointerLock requests.
	 * @param {Event} e The permissionrequest event
	 * @private
	 */
	handlePermissionRequests: function (e)
	{
		e.preventDefault();
		switch (e.permission) {
			// Allow
			case 'download':
			case 'media':
			case 'loadplugin':
			case 'fullscreen':
				e.request.allow();
			break;
			// Deny
			case 'pointerLock':
			case 'geolocation':
				e.request.deny();
			break;
			// also deny all other, not yet known, requests
			default:
				e.request.deny();
			break;
		}
	}
});

Ext.reg('grommunio.viewerpanel', Grommunio.common.previewer.ui.ViewerPanel);
