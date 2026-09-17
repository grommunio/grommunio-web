/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.ui.messagepanel');

/**
 * @class Grommunio.common.ui.messagepanel.MessageBody
 * @extends Ext.Container
 * @xtype grommunio.messagebody
 */
Grommunio.common.ui.messagepanel.MessageBody = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Ext.Template/String} plaintextTemplate The {@link Ext.Template} or String which must be used
	 * for the contents of the {@link #iframe} when the record has been opened, and it contains a plain-text
	 * body. The data passed to this template will be the 'body' field which must be loaded as body.
	 */
	plaintextTemplate: '<!DOCTYPE html><html><body><pre>{body}</pre></body></html>',

	/**
	 * The {RegExp} of emailPattern, this regular expression finds mailto links or email address
	 * inside string.
	 */
	emailPattern: /((mailto:)[\w-@,;.?=&%:///+ ]+)|([\w-._+%]+@(?:[\w-]+\.)+[\w]*)/gi,

	/**
	 * The {RegExp} of linkPattern, this regular expression finds urls inside string.
	 * Urls like http, https, ftp or www.
	 */
	linkPattern: /((?:http|ftp)s?:\/\/|www.)([\w.-]+)\.(\w{2,6})([\w/\-_+.,?=&!:;%#|]+)*/gi,

	/**
	 * The entryid of the message whose body is in the iframe right now, which
	 * is not the record being set while a message is still being opened.
	 * @property
	 * @type {String}
	 */
	renderedEntryId: null,

	/**
	 * The scroll position each message was left at, keyed by entryid. Kept in
	 * memory for as long as the folder is open, so stepping back and forth
	 * through a list of messages returns to where the reader was.
	 * @property
	 * @type {Object}
	 */
	scrollPositions: null,

	/**
	 * The entryids in {@link #scrollPositions}, oldest first.
	 * @property
	 * @type {Array}
	 */
	scrollOrder: null,

	/**
	 * The position this component last scrolled the message to itself, which
	 * tells its own scrolling apart from the reader's.
	 * @property
	 * @type {Number}
	 */
	restoredTo: undefined,

	/**
	 * @cfg {Number} maxScrollPositions The number of messages to remember a
	 * scroll position for. Older entries are dropped.
	 */
	maxScrollPositions: 100,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'grommunio.messagebody',
			autoScroll:true,
			anchor: '100%',
			layout: 'fit',
			autoEl: {
				tag: 'iframe',
				cls: 'preview-iframe',
				frameborder: 0,
				src: Ext.SSL_SECURE_URL
			},
			border: false,
			listeners: {
				scope: this,
				render: this.onRenderMessageBody,
				afterrender: this.onAfterRender
			}
		});

		Grommunio.common.ui.messagepanel.MessageBody.superclass.constructor.call(this, config);

		if (Ext.isString(this.plaintextTemplate)) {
			this.plaintextTemplate = new Ext.Template(this.plaintextTemplate, {
				compiled: true
			});
		}

		/**
		 * Remember the last rendered record and format so we can avoid replacing HTML
		 * bodies with plain text while asynchronous loading is still in progress.
		 * @type {Object}
		 * @private
		 */
		this.currentRenderInfo = {
			entryId: null,
			renderedHtml: false
		};

		this.scrollPositions = {};
		this.scrollOrder = [];
	},

	/**
	 * Event handler for the {@link Ext.Component.render} event. Will add listener to the
	 * {@link Grommunio.core.ui.MainContentTabPanel.beforetabchange} event if the MessageBody
	 * is rendered inside a tab panel of the {@link Grommunio.core.ui.MainContentTabPanel}.
	 */
	onRenderMessageBody: function()
	{
		// Make sure we are inside the Grommunio.core.ui.MainContentTabPanel before
		// we set the listener.
		var tabPanel = this.findParentByType('tabpanel');
		if ( tabPanel ){
			this.mon(tabPanel, 'beforetabchange', this.onBeforeTabChange, this);
		}

		// The remembered scroll positions belong to the folder that is open.
		var previewPanel = this.findParentByType('grommunio.previewpanel');
		if (previewPanel && previewPanel.model) {
			this.mon(previewPanel.model, 'folderchange', this.forgetScrollPositions, this);
		}
	},

	/**
	 * Drops every remembered scroll position, leaving each message to open at
	 * its top again.
	 */
	forgetScrollPositions: function()
	{
		this.scrollPositions = {};
		this.scrollOrder = [];
	},

	/**
	 * Follows the reader through the message, so the position is known without
	 * having to catch the moment the message is replaced.
	 * @private
	 */
	setScrollListener: function()
	{
		var iframeWindow = this.getEl().dom.contentWindow;

		if (!iframeWindow || !iframeWindow.addEventListener) {
			return;
		}

		iframeWindow.addEventListener('scroll', this.onBodyScroll.createDelegate(this), { passive: true });
	},

	/**
	 * Event handler for a scroll of the message body.
	 * @private
	 */
	onBodyScroll: function()
	{
		// A hidden iframe reports 0, and a scroll this component made itself is
		// already where the message is meant to be.
		if (!this.isVisible() || Math.round(this.getEl().dom.contentWindow.pageYOffset) === this.restoredTo) {
			return;
		}

		this.rememberScrollPosition();
	},

	/**
	 * Remembers where the message that is currently in the iframe was scrolled to.
	 * @private
	 */
	rememberScrollPosition: function()
	{
		var entryId = this.renderedEntryId;
		if (!entryId || !this.rendered || !this.getEl().dom) {
			return;
		}

		var iframeWindow = this.getEl().dom.contentWindow;
		if (!iframeWindow) {
			return;
		}

		if (!this.scrollPositions[entryId]) {
			this.scrollOrder.push(entryId);
			while (this.scrollOrder.length > this.maxScrollPositions) {
				delete this.scrollPositions[this.scrollOrder.shift()];
			}
		}

		this.scrollPositions[entryId] = {
			x: iframeWindow.pageXOffset,
			y: iframeWindow.pageYOffset
		};
	},

	/**
	 * Scrolls the iframe back to where this message was left. Replacing the
	 * document puts it at the top, so this always scrolls, if only to 0.
	 * @param {String} entryId The entryid of the message in the iframe
	 * @param {Boolean} retry True when the document has grown since the first
	 * attempt, which is the only reason to scroll a second time
	 * @private
	 */
	restoreScrollPosition: function(entryId, retry)
	{
		if (retry && (this.renderedEntryId !== entryId || !this.rendered || !this.getEl().dom)) {
			return;
		}

		var iframeWindow = this.getEl().dom.contentWindow;
		var pos = this.scrollPositions[entryId];

		if (!pos || (!pos.x && !pos.y)) {
			if (!retry) {
				iframeWindow.scrollTo(0, 0);
				this.restoredTo = 0;
			}
			return;
		}

		// The first attempt runs before the images have given the document its
		// height, so it can fall short. Only take a second one while the reader
		// has not scrolled away from where that left them.
		if (retry && Math.round(iframeWindow.pageYOffset) !== this.restoredTo) {
			return;
		}

		if (!retry) {
			// Chrome needs a reset to work properly
			iframeWindow.scrollTo(0, 0);
		}
		iframeWindow.scrollTo(pos.x, pos.y);
		this.restoredTo = Math.round(iframeWindow.pageYOffset);
	},

	/**
	 * Event handler for the {@link Ext.Component.afterrender} event. Will add listener to the
	 * {@link Grommunio.core.ui.MainContentTabPanel.beforetabchange} event if the MessageBody
	 * is rendered inside a tab panel of the {@link Grommunio.core.ui.MainContentTabPanel}.
	 */
	onAfterRender: function()
	{
		// In Firefox, the frame's content seems to not be recognized when no
		// initial content has been set.
		if (Ext.isGecko) {
			var iframeWindow = this.getEl().dom.contentWindow;
			var iframeDocument = iframeWindow.document;
			iframeDocument.open();
			iframeDocument.write('<!DOCTYPE html><html><body><p>&nbsp;</p></body></html>');
			iframeDocument.close();
		}
	},

	/**
	 * Event handler for the {@link Ext.TabPanel.beforetabchange} of the
	 * {@link Grommunio.core.ui.MainContentTabPanel}
	 *
	 * @param {Grommunio.core.ui.MainContentTabPanel} mainContentTabPanel The main
	 * tab panel of grommunio Web
	 * @param {Ext.Panel} newTab The tab (panel) that will be activated
	 * @param {Ext.Panel} currentTab The tab (panel) that is currently active
	 */
	onBeforeTabChange: function(mainContentTabPanel, newTab, currentTab)
	{
		// Store the scroll position of the iframe that holds the message body
		if ( currentTab === this.ownerCt.ownerCt ){
			this.rememberScrollPosition();
		}
	},

	/**
	 * Set event listeners on the iframe that will relay the
	 * event when the user performs click within iframe.
	 * @private
	 */
	setRelayEventListeners: function()
	{
		var iframeWindow = this.getEl().dom.contentWindow;
		var iframeDocument = iframeWindow.document;
		var eventsToRelay = ['mousedown'];
		if (Grommunio.isDeskApp) {
			eventsToRelay.push('wheel', 'keydown');
		}

		// mousedown needs to be relayed to hide contextmenu.
		// keydown and wheel needs to be relayed to perform zoom functionality in DeskApp.
		this.relayIframeEvent(iframeDocument, eventsToRelay);
	},

	/**
	 * Helper function to add event listeners to the given iframe element for given
	 * events with common handler.
	 * @param {HTMLElement} iframeElement The iframe node to which given events needs
	 * to be listened.
	 * @param {Array} events The set of events for which listeners should be attached
	 * to given iframe.
	 */
	relayIframeEvent: function(iframeElement, events)
	{
		events.forEach(function(event){
			var options = true;

			// Let wheel listeners be passive to avoid scroll-blocking warnings.
			if (event === 'wheel') {
				options = {
					capture: true,
					passive: true
				};
			}

			try {
				iframeElement.addEventListener(event, this.relayEventHandlers.createDelegate(this), options);
			} catch (ex) {
				iframeElement.addEventListener(event, this.relayEventHandlers.createDelegate(this), true);
			}
		}, this);
	},

	/**
	 * Function is called when specified events performed in the iframe.
	 * Basically this function relay those events to document element
	 * belongs to grommunio Web window.
	 * @param {Object} event The event object
	 */
	relayEventHandlers: function(event)
	{
		Ext.getDoc().fireEvent(event.type, event);
	},

	/**
	 * Set event listeners on the iframe that will reset the
	 * {@link Grommunio#idleTime idle time} when the user performs
	 * an action in the iframe (i.e. click, mousemove, keydown)
	 * @private
	 */
	setIdleTimeEventListeners: function()
	{
		var iframeWindow = this.getEl().dom.contentWindow;
		var iframeDocument = iframeWindow.document;

		if ( !iframeDocument.addEventListener ) {
			// User is using a browser that does not support addEventListener.
			// Probably IE<9 which we don't support.
			// However there is no reason to create errors for IE<9
			// Client timeout will still be handled by the backend though,
			// but the message will only be shown to the user when he tries to
			// connect to the backend after the session has timed out.
			return;
		}

		var clickHandler = function(){
			Grommunio.idleTime = 0;
		};
		var moveHandler = function(){
			Grommunio.idleTime = 0;
		};

		try {
			iframeDocument.addEventListener('click', clickHandler, { capture: true, passive: true });
			iframeDocument.addEventListener('mousemove', moveHandler, { capture: true, passive: true });
		} catch (ex) {
			iframeDocument.addEventListener('click', clickHandler, true);
			iframeDocument.addEventListener('mousemove', moveHandler, true);
		}

		iframeDocument.addEventListener('keydown', function(){
			Grommunio.idleTime = 0;
		}, true);
	},

	/**
	 * Remove document-level tags which are irrelevant in preview and can trigger
	 * browser parser warnings (e.g. malformed/obsolete viewport directives).
	 *
	 * @param {String} html The HTML markup to clean.
	 * @return {String} HTML safe for iframe body injection.
	 */
	sanitizePreviewMarkup: function(html)
	{
		if (Ext.isEmpty(html)) {
			return html;
		}

		var markup = String(html);

		try {
			var doc;
			if (window.DOMParser) {
				doc = new DOMParser().parseFromString('<!doctype html><html><body>' + markup + '</body></html>', 'text/html');
			} else {
				doc = document.implementation.createHTMLDocument('');
				doc.body.innerHTML = markup;
			}

			Ext.each(doc.body.querySelectorAll('meta, base'), function(node) {
				if (node && node.parentNode) {
					node.parentNode.removeChild(node);
				}
			});

			// The HTML parser hoists <style> elements from an email's <head>
			// into the document head. Preserve them by moving them into the
			// body so they still apply when we later write body.innerHTML
			// into the preview iframe (which drops head content).
			var headStyles = doc.head ? doc.head.querySelectorAll('style') : [];
			Ext.each(headStyles, function(node) {
				doc.body.insertBefore(node, doc.body.firstChild);
			});

			return doc.body.innerHTML;
		} catch (ex) {
			// Fallback for malformed markup/parser failures.
			return markup
				.replace(/<meta\b[^>]*>(?:\s*<\/meta>)?/gi, '')
				.replace(/<base\b[^>]*>(?:\s*<\/base>)?/gi, '');
		}
	},

	/**
	 * Updates the container by loading data from the record data into the {@link #template}
	 *
	 * @param {Grommunio.core.data.IPMRecord} record The record to update the header panel with
	 */
	update: function(record)
	{
		if ( !this.getEl().dom ) {
			return;
		}

		var iframeWindow = this.getEl().dom.contentWindow;
		var iframeDocument = iframeWindow.document;
		var iframeDocumentElement = new Ext.Element(iframeDocument);
		var body = '';
		var html;
		var entryId = Ext.isDefined(record) ? record.get('entryid') : null;
		var sameRecordAsBefore = this.currentRenderInfo && this.currentRenderInfo.entryId === entryId;
		var recordIsOpened = Ext.isDefined(record) && Ext.isFunction(record.isOpened) && record.isOpened();

		if (!Ext.isEmpty(iframeDocument.body)) {
			// Remove and disable old keymaps that are registered on the document element.
			Grommunio.core.KeyMapMgr.deactivate(iframeDocumentElement);
		}

		if (Ext.isDefined(record) && !recordIsOpened) {
			// Avoid rendering speculative plain-text body before the full message body is loaded.
			// This prevents text-to-HTML flicker when the opened record later provides HTML content.
			if (!sameRecordAsBefore || record.get('pgp')) {
				var pendingHtmlBody = iframeDocument.getElementsByTagName('body')[0];
				if (pendingHtmlBody) {
					pendingHtmlBody.innerHTML = '';
				}
				this.renderedEntryId = null;

				this.currentRenderInfo = {
					entryId: entryId,
					renderedHtml: false
				};
			}

			return;
		}


		if (Ext.isDefined(record)) {
			// Display a 'loading' message. Prefer cached sanitized HTML when available so we can render
			// immediately, otherwise fall back to sanitizing or the plain-text representation.
			// During fast record switches, 'isHTML' can temporarily lag behind while
			// the opened payload is being applied to the shadow record.
			// If html_body is present, prefer rendering HTML to avoid incorrect
			// fallback to plain text for HTML messages.
			var hasHtmlBody = !Ext.isEmpty(record.get('html_body'));
			var preferHtml = (record.get('isHTML') === true) || hasHtmlBody;
			var sanitizedBody = null;

			// getSanitizedHtmlBody() internally relies on getBody(true), which in turn
			// depends on isHTML. If isHTML is stale/false while html_body is already
			// available, that path can incorrectly sanitize/render plain text.
			// Therefore only use cached/sanitized helper when record explicitly marks
			// itself as HTML.
			if (record.get('isHTML') === true && Ext.isFunction(record.getSanitizedHtmlBody) && !record.checkBlockStatus()) {
				// Use a cached sanitized body when possible to avoid redundant DOMPurify work.
				if (!Ext.isEmpty(record.sanitizedHTMLBody)) {
					sanitizedBody = record.sanitizedHTMLBody;
				} else if (preferHtml === true) {
					sanitizedBody = record.getSanitizedHtmlBody();
				}
			}

			if (sanitizedBody) {
				sanitizedBody = this.sanitizePreviewMarkup(sanitizedBody);
				html = true;
				body = "<!DOCTYPE html>" + sanitizedBody;
			} else if (preferHtml === true) {
				html = true;

				// Prefer html_body directly to avoid races on isHTML while switching mails.
				var rawHtmlBody = hasHtmlBody ? (record.get('html_body') || '') : (record.getBody(true) || '');
				if (hasHtmlBody && Ext.isFunction(record.inlineImgOutlookToGrommunio)) {
					rawHtmlBody = record.inlineImgOutlookToGrommunio(rawHtmlBody);
				}
				rawHtmlBody = this.sanitizePreviewMarkup(rawHtmlBody);
				if (hasHtmlBody &&
					Ext.isFunction(record.shouldBlockExternalContent) &&
					record.shouldBlockExternalContent() &&
					Ext.isDefined(Grommunio.core) &&
					Ext.isDefined(Grommunio.core.HTMLParser) &&
					Ext.isFunction(Grommunio.core.HTMLParser.blockExternalContent)) {
					rawHtmlBody = Grommunio.core.HTMLParser.blockExternalContent(rawHtmlBody);
				}

				if (container.getServerConfig().getDOMPurifyEnabled()) {
					rawHtmlBody = DOMPurify.sanitize(rawHtmlBody);
				}

				body = "<!DOCTYPE html>" + record.cleanupOutlookStyles(rawHtmlBody);
			} else {
				var plainBody = record.getBody(false) || '';
				if (Ext.isEmpty(plainBody)) {
					body = '';
				} else {
					body = this.plaintextTemplate.applyTemplate({ body: Ext.util.Format.htmlEncode(plainBody) });
				}
			}

			if (html && body) {
				// Defer loading of inline images so the text can be shown immediately.
				body = body.replace(/<img([^>]+?)src="([^"]*download_attachment.php[^"]*)"([^>]*?)>/gi,
					function(match, pre, src, post){
						return '<img' + pre + 'src="' + Ext.BLANK_IMAGE_URL + '" data-src="' + src + '"' + post + '>';
					});
			}

			if (html !== true && sameRecordAsBefore && this.currentRenderInfo.renderedHtml === true && !record.get('pgp')) {
				// Keep the previously rendered HTML instead of flashing the plain-text fallback
				// while the HTML body is still loading. Protected browser views are
				// updated atomically: retaining their old HTML would leave decrypted
				// content visible after a private-key lock or a failed verification.
				return;
			}

			this.currentRenderInfo = {
				entryId: entryId,
				renderedHtml: html === true
			};
		} else {
			this.currentRenderInfo = {
				entryId: null,
				renderedHtml: false
			};
		}

		if (!body) {
			body = '';
		}

		var htmlBody = iframeDocument.getElementsByTagName('body')[0];
		htmlBody.innerHTML = body;
		this.renderedEntryId = entryId;
		this.normalizeHostnameLinks(iframeDocument);
		this.setFragmentLinkClickHandler(iframeDocument);

		// Lazy load inline images after the text has been rendered
		var inlineImgs = htmlBody.querySelectorAll('img[data-src]');
		Ext.defer(function(){
			Ext.each(inlineImgs, function(img){
				img.setAttribute('src', img.getAttribute('data-src'));
				img.removeAttribute('data-src');
			});

			// The images give the document its final height, which is what a
			// scroll position further down the message needs.
			this.restoreScrollPosition(entryId, true);
		}, 100, this);

		// Disable drag and drop
		Ext.EventManager.on(iframeWindow, 'dragover', Grommunio.onWindowDragDrop);
		Ext.EventManager.on(iframeWindow, 'drop', Grommunio.onWindowDragDrop);

		// Add CSS document to the previewbody
		// so the text can be styled.
		this.addCSSText(iframeDocument);

		// Replacing the document leaves it at the top, so every message is put
		// back where it was read to - or at 0 when it was not read before.
		this.restoreScrollPosition(entryId);

		// Add listener to enlarge image
		this.setImageClickHandler(iframeDocument);

		// Defer heavy DOM scanning to keep initial render responsive.
		this.deferLinkification(iframeDocument, iframeDocumentElement);

		var rootContainer = this.recordComponentUpdaterPlugin.rootContainer;
		if(rootContainer) {
			// Here we are passing rootContainer i.e. previewpanel as a component and editor's document
			// as element, so that when key events are fired on the element it will pass dialog
			// rootContainer as an argument in callback function.
			Grommunio.core.KeyMapMgr.activate(rootContainer, 'global', iframeDocumentElement);
			Grommunio.core.KeyMapMgr.activate(rootContainer, 'contentpanel.record.message.showmail', iframeDocumentElement);
		}
	},


	/**
	 * Schedule linkification of the message body when the browser is idle.
	 * This avoids blocking the UI with expensive DOM operations during the
	 * initial rendering of large messages.
	 * @param {Document} doc The iframe document to scan
	 * @param {Ext.Element} docEl The Ext.Element wrapper for the document
	 * @private
	 */
	deferLinkification: function(doc, docEl)
	{
		var fn = function(){
			this.scanDOMForLinks(doc);
			this.handleMailToLinks(docEl);
		}.createDelegate(this);

		if (window.requestIdleCallback) {
			window.requestIdleCallback(fn);
		} else {
			Ext.defer(fn, 0);
		}
	},

	/**
	 * Function recursively scans dom to get text nodes which contain email addresses or URLs so we can
	 * replace them with an anchor tag.
	 * @param {HTMLElement} node The parent node that will be examined to find the child text nodes
	 * @private
	 */
	scanDOMForLinks: function(node)
	{
		for(var i = 0; i < node.childNodes.length; i++) {
			var cnode = node.childNodes[i];
			if(cnode.nodeType == 1) { // Tag-node
				if(cnode.nodeName != 'A') { // Ignore anchor nodes as they are already linkified
					this.scanDOMForLinks(cnode);
				}
			} else if(cnode.nodeType == 3) { // Text-node
				if(cnode.nodeValue.trim().length > 0) {
					// check if this text node is HTML link or email address
					if(cnode.nodeValue.search(this.emailPattern) != -1 || cnode.nodeValue.search(this.linkPattern) != -1) {
						this.linkifyDOMNode(cnode, node);
					}
				}
			}
		}
	},

	/**
	 * Function will replace text nodes with element nodes which contains anchor tag.
	 * @param {HTMLElement} node The node that has to be examined for links or emails
	 * @param {HTMLElement} parentNode The parent of the passed node
	 * @private
	 */
	linkifyDOMNode: function(node, parentNode)
	{
		var str = node.nodeValue;

		// Split the strings up in pieces that are normal text and pieces that contain an URL
		// We do this before checking for email addresses as an ftp-URL with username/password within will otherwise be seen as an email address
		var lookupParts = Grommunio.core.Util.splitStringByPattern(str, this.linkPattern);
		var parts = [];
		// Now loop through all the pieces split them up based on whether they contain an email address
		for(var i=0; i<lookupParts.length; i++){
			// Do not examine the piece that already contains a link
			if(lookupParts[i].search(this.linkPattern) == -1){
				// Split the pieces up based on whether they contain a link
				var tmpParts = Grommunio.core.Util.splitStringByPattern(lookupParts[i], this.emailPattern);
				parts.push.apply(parts, tmpParts);
			} else {
				parts.push(lookupParts[i]);
			}
		}

		// Create a container node to append all the textnodes and anchor nodes to
		var containerNode = Ext.DomHelper.createDom({
			tag: 'span'
		});
		for(var i=0; i<parts.length; i++){
			// Create the node for a normal link
			if(parts[i].search(this.linkPattern) != -1){
				// Create a new anchor-node for making url clickable.
				var anchorNode = Ext.DomHelper.append(containerNode, {tag: 'a', html: parts[i]});
				var link = parts[i];
				if(link.search(/(http|ftp)(s)?:\/\//gi) !== 0) {
					// Link has url in the pattern of www.something.com
					link = 'http://' + link;
				}
				anchorNode.setAttribute('href', link);
				anchorNode.setAttribute('target', '_blank');
			} else if(parts[i].search(this.emailPattern) != -1){
				// Create a new anchor-node for making an email address clickable.
				var anchorNode = Ext.DomHelper.append(containerNode, {tag: 'a', html: parts[i]});
				var link = parts[i];
				if(link.indexOf('mailto:') !== 0){
					link = 'mailto:' + link;
				}
				anchorNode.setAttribute('href', link);
			} else {
				Ext.DomHelper.append(containerNode, Ext.util.Format.htmlEncode(parts[i]));
			}
		}

		// Replace the original text node under the parent with the new anchor nodes and split up text nodes.
		for(var i=0, count=containerNode.childNodes.length; i<count; i++){
			// We remove the childNode from the parent by using this line so every loop we can add the first as the list shrinks
			parentNode.insertBefore(containerNode.childNodes.item(0), node);
		}

		// Remove the original node
		parentNode.removeChild(node);
	},

	/**
	 * Function registers handler on mailto links in {@link Grommunio.common.ui.messagepanel.MessageBody}
	 * @param {Ext.Element} iframeDocumentElement The document element of iframe
	 * @private
	 */
	handleMailToLinks: function(iframeDocumentElement)
	{
		var mailtoElements = iframeDocumentElement.query('a[href^="mailto:"]');

		if(!Ext.isEmpty(mailtoElements)){
			for (var i=0; i<mailtoElements.length; i++)
			{
				Ext.EventManager.on(mailtoElements[i], 'click', this.onMailtoClick);
			}
		}
	},

	/**
	 * Called when any mailto links in {@link Grommunio.common.ui.messagepanel.MessageBody} is clocked
	 * This will pass url of the mailto link to URLActionMgr and it will handle the URL.
	 * @param {Ext.EventObject} event The event object
	 * @param {HTMLElement} element The element which was focussed
	 * @private
	 */
	onMailtoClick: function(event, element)
	{
		// Prevent the browsers default handling of the event.
		// i.e. opening mailto handler for the link
		event.preventDefault();

		var href = this.href || element.href;
		Grommunio.core.URLActionMgr.execute({mailto: href});
	},

	/**
	 * Turn hostname-style href values into absolute HTTPS URLs. Otherwise the
	 * browser resolves values such as "www.example.com/path" relative to the
	 * web client's URL because the preview iframe inherits its fallback base URL.
	 *
	 * Links with a scheme, protocol-relative links, fragments and application
	 * relative paths are intentionally left unchanged.
	 *
	 * @param {Document} iframeDocument The document containing the message body
	 * @private
	 */
	normalizeHostnameLinks: function(iframeDocument)
	{
		var hostnamePattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?::\d+)?(?:[\/?#]|$)/i;
		var links = iframeDocument.querySelectorAll('a[href]');

		for (var i = 0; i < links.length; i++) {
			var href = links[i].getAttribute('href');
			if (!href) {
				continue;
			}

			href = href.replace(/^\s+|\s+$/g, '');
			if (hostnamePattern.test(href)) {
				links[i].setAttribute('href', 'https://' + href);
			}
		}
	},

	/**
	 * Keep fragment-only links inside the message preview. The preview document is
	 * loaded from about:blank, whose fallback base URL is inherited from the web
	 * client. Without handling these links explicitly, a href such as "#section"
	 * is resolved to the web client's URL and replaces the preview document.
	 *
	 * @param {Document} iframeDocument The document containing the message body
	 * @private
	 */
	setFragmentLinkClickHandler: function(iframeDocument)
	{
		iframeDocument.removeEventListener('click', this.onFragmentLinkClick);
		iframeDocument.addEventListener('click', this.onFragmentLinkClick);
	},

	/**
	 * Scroll to an id or legacy named anchor referenced by a fragment-only link.
	 *
	 * @param {Event} event The click event from the message preview document
	 * @private
	 */
	onFragmentLinkClick: function(event)
	{
		var document = event.currentTarget;
		var anchor = event.target;

		while (anchor && anchor !== document && anchor.nodeName !== 'A') {
			anchor = anchor.parentNode;
		}

		if (!anchor || anchor === document) {
			return;
		}

		var href = anchor.getAttribute('href');
		if (!href || href.charAt(0) !== '#') {
			return;
		}

		event.preventDefault();

		var fragment = href.substring(1);
		if (!fragment) {
			document.defaultView.scrollTo(0, 0);
			return;
		}

		try {
			fragment = decodeURIComponent(fragment);
		} catch (ex) {
			// Keep the literal fragment when it contains invalid URL encoding.
		}

		var destination = document.getElementById(fragment);
		if (!destination) {
			var namedAnchors = document.querySelectorAll('a[name]');
			for (var i = 0; i < namedAnchors.length; i++) {
				if (namedAnchors[i].getAttribute('name') === fragment) {
					destination = namedAnchors[i];
					break;
				}
			}
		}

		if (destination) {
			destination.scrollIntoView();
		}
	},

	/**
	 * Adds a <style> element into the <head> tag of the given document,
	 * this will contain the special stylesheet which can be used to apply
	 * to styling to the previewpanel.
	 * @param {Document} doc The document to which the link should be added
	 * @private
	 */
	addCSSText: function(doc)
	{
		var head = doc.getElementsByTagName('head')[0];
		var css = doc.getElementById('grommunio-preview-body-css');
		if (!css) {
			css = doc.createElement('style');
			css.setAttribute('id', 'grommunio-preview-body-css');
			css.setAttribute('type', 'text/css');
			head.appendChild(css);
		}

		// Apply a fallback font for when a HTML message does not
		// specify anything else. Plain-text bodies keep on using the
		// monospace declared for <pre>. Only a plain unquoted font
		// list is accepted: this stylesheet lives in the iframe with
		// the message, and a stray quote from a hand-edited setting
		// would swallow every rule after it.
		var fontFamily = container.getSettingsModel().get('grommunio/v1/main/default_font');
		var bodyFont = '';
		if (Ext.isString(fontFamily) && (/^[\w ,-]+$/).test(fontFamily)) {
			bodyFont = 'font-family: ' + fontFamily + '; ';
		}

		css.textContent = ('body { margin: 0; padding: 9px; ' + bodyFont + '} ' +
			// Make the blockquote element not use the default right margin of 40px
			'blockquote { margin-right: 0px; }' +
			// Make text in pre tags wrapped if too long for a line
			// The font is registered under 'fira mono' as well,
			// because that is the family name the default-font
			// setting uses.
			"@font-face { font-family: firamono; font-style: normal; font-weight: 400; src: url(" + window.location.pathname + "/client/resources/fonts/FiraMono-Regular.woff2) format('woff2'); }" +
			"@font-face { font-family: fira mono; font-style: normal; font-weight: 400; src: url(" + window.location.pathname + "/client/resources/fonts/FiraMono-Regular.woff2) format('woff2'); }" +
			"pre { white-space: pre-wrap; overflow-wrap: anywhere; word-wrap: break-word; margin: 0; font-family: firamono, monospace; }" +

			// Scale images
			'p > span > img, div > img, p > img { max-width: 100%; height: auto !important; }' +
			'@media screen and (max-width: 250px) { p > span > img, div > img, p > img { max-width: 250px; } }' +
			// Modern scrollbar
			'* { scrollbar-color: #1f1f1f transparent; } *::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; } *::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #c0c0c0; border-radius: 20px; min-height: 100px; }' +

			// Elements that should not have the max-width style
			// k-original: class that we set on img click
			// table img: all images in tables. Often used in newsletters
			'.k-original, table img { max-width: none !important; }'
		);
	},

	/**
	 * Sets an event listener for img clicks inside an iframe
	 * @param {Document} iframeDocument The iframe document in which the event listeners are added
	 */
	setImageClickHandler: function(iframeDocument)
	{
		var images = iframeDocument.body.querySelectorAll('img');
		for (let i=0; i < images.length; i++) {
			images[i].removeEventListener('click', this.onImageClick);
			images[i].addEventListener('click', this.onImageClick);
		}
	},

	/**
	 * Toggle the k-original class when an image is clicked in an iframe
	 * @param {Event} event The click event
	 */
	onImageClick: function(event)
	{
		event.target.classList.toggle('k-original');
	},

	/**
	 * Called when this component is being rendered into a container.
	 * This will create a {@link #wrap} element around the iframe for
	 * better organize the scrolling.
	 * It will also check if a client timeout has been set, and if so call
	 * {@link #setIdleTimeEventListeners} once the iframe has been loaded.
	 *
	 * @param {Ext.Container} ct The container into which this component is being rendered
	 * @param {Number} position The position inside the container where this component is being rendered
	 * @private
	 */
	onRender: function(ct, position)
	{
		Grommunio.common.ui.messagepanel.MessageBody.superclass.onRender.call(this, ct, position);

		// Check if a client timeout has been defined
		var server = container.getServerConfig();
		var clientTimeout = server.getClientTimeout();
		if (clientTimeout){
			// Wait for the iframe to load before calling setIdleTimeEventListeners()
			this.getEl().on('load', this.setIdleTimeEventListeners, this);
		}

		// Wait for the iframe to load before calling setRelayEventListeners()
		this.getEl().on('load', this.setRelayEventListeners, this);
		this.getEl().on('load', this.setScrollListener, this);

		this.wrap = this.el.wrap({cls: 'preview-body'});
		this.resizeEl = this.positionEl = this.wrap;
	}
});

Ext.reg('grommunio.messagebody', Grommunio.common.ui.messagepanel.MessageBody);
