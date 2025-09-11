Ext.namespace('Zarafa.common.ui.messagepanel');

/**
 * @class Zarafa.common.ui.messagepanel.MessageBody
 * @extends Ext.Container
 * @xtype zarafa.messagebody
 */
Zarafa.common.ui.messagepanel.MessageBody = Ext.extend(Ext.Container, {
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
	emailPattern: /((mailto:)[\w-@,;.?=&%:///+ ]+)|([\w-\._\+%]+@(?:[\w-]+\.)+[\w]*)/gi,

	/**
	 * The {RegExp} of linkPattern, this regular expression finds urls inside string.
	 * Urls like http, https, ftp or www.
	 */
	linkPattern: /((?:http|ftp)s?:\/\/|www.)([\w\.\-]+)\.(\w{2,6})([\w\/\-\_\+\.\,\?\=\&\!\:\;\%\#\|]+)*/gi,

	/**
	 * The scroll position of the document in the iframe that holds the message body
	 * when the message body is inside a tab in the {@link Zarafa.core.ui.MainContentTabPanel}
	 * and the tab is deactivated.
	 * @property
	 * @type {Object}
	 */
	scrollPos: null,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.messagebody',
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
				render: this.onRenderMessageBody
			}
		});

		Zarafa.common.ui.messagepanel.MessageBody.superclass.constructor.call(this, config);

		if (Ext.isString(this.plaintextTemplate)) {
			this.plaintextTemplate = new Ext.Template(this.plaintextTemplate, {
				compiled: true
			});
		}
	},

	/**
	 * Event handler for the {@link Ext.Component.render} event. Will add listener to the
	 * {@link Zarafa.core.ui.MainContentTabPanel.beforetabchange} event if the MessageBody
	 * is rendered inside a tab panel of the {@link Zarafa.core.ui.MainContentTabPanel}.
	 */
	onRenderMessageBody: function()
	{
		// Make sure we are inside the Zarafa.core.ui.MainContentTabPanel before
		// we set the listener.
		var tabPanel = this.findParentByType('tabpanel');
		if ( tabPanel ){
			this.mon(tabPanel, 'beforetabchange', this.onBeforeTabChange, this);
		}
	},

	/**
	 * Event handler for the {@link Ext.TabPanel.beforetabchange} of the
	 * {@link Zarafa.core.ui.MainContentTabPanel}
	 *
	 * @param {Zarafa.core.ui.MainContentTabPanel} mainContentTabPanel The main
	 * tab panel of grommunio Web
	 * @param {Ext.Panel} newTab The tab (panel) that will be activated
	 * @param {Ext.Panel} currentTab The tab (panel) that is currently active
	 */
	onBeforeTabChange: function(mainContentTabPanel, newTab, currentTab)
	{
		// Store the scroll position of the iframe that holds the message body
		if ( currentTab === this.ownerCt.ownerCt ){
			var iframeWindow = this.getEl().dom.contentWindow;
			this.scrollPos = {
				x: iframeWindow.pageXOffset,
				y: iframeWindow.pageYOffset
			};
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
		if (Zarafa.isDeskApp) {
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
			iframeElement.addEventListener(event, this.relayEventHandlers.createDelegate(this), true);
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
	 * {@link Zarafa#idleTime idle time} when the user performs
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

		iframeDocument.addEventListener('click', function(){
			Zarafa.idleTime = 0;
		}, true);
		iframeDocument.addEventListener('mousemove', function(){
			Zarafa.idleTime = 0;
		}, true);
		iframeDocument.addEventListener('keydown', function(){
			Zarafa.idleTime = 0;
		}, true);
	},

	/**
	 * Updates the container by loading data from the record data into the {@link #template}
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the header panel with
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

		if (!Ext.isEmpty(iframeDocument.body)) {
			// Remove and disable old keymaps that are registered on the document element.
			Zarafa.core.KeyMapMgr.deactivate(iframeDocumentElement);
		}

		if (Ext.isDefined(record)) {
			// Display a 'loading' message. If the message is in HTML we can directly render it,
			// otherwise we have to surround it with HTML tags for displaying plain-text.
			html = record.get('isHTML');
			if (html) {
				body = "<!DOCTYPE html>" + record.getSanitizedHtmlBody();
			} else {
				body = record.getBody(html);
				if (!body) {
					body = '';
				} else {
					body = this.plaintextTemplate.applyTemplate({ body: Ext.util.Format.htmlEncode(body) });
				}
			}
		}

		var htmlBody = iframeDocument.getElementsByTagName('body')[0];
		htmlBody.innerHTML = body;

		// Restore the scroll position if the tab panel was deactivated
		if ( this.scrollPos ){
			// Chrome needs a reset to work properly
			iframeWindow.scrollTo(0, 0);

			iframeWindow.scrollTo(this.scrollPos.x, this.scrollPos.y);
			this.scrollPos = null;
		}

		// Disable drag and drop
		Ext.EventManager.on(iframeWindow, 'dragover', Zarafa.onWindowDragDrop);
		Ext.EventManager.on(iframeWindow, 'drop', Zarafa.onWindowDragDrop);

		// Add CSS document to the previewbody
		// so the text can be styled.
		this.addCSSText(iframeDocument);

		// Add listener to enlarge image
		this.setImageClickHandler(iframeDocument);

		this.scanDOMForLinks(iframeDocument);
		this.handleMailToLinks(iframeDocumentElement);

		var rootContainer = this.recordComponentUpdaterPlugin.rootContainer;
		if(rootContainer) {
			// Here we are passing rootContainer i.e. previewpanel as a component and editor's document
			// as element, so that when key events are fired on the element it will pass dialog
			// rootContainer as an argument in callback function.
			Zarafa.core.KeyMapMgr.activate(rootContainer, 'global', iframeDocumentElement);
			Zarafa.core.KeyMapMgr.activate(rootContainer, 'contentpanel.record.message.showmail', iframeDocumentElement);
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
				if(cnode.nodeName != 'A') { // Igonre Anchor-node as they are already linified
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
		var lookupParts = Zarafa.core.Util.splitStringByPattern(str, this.linkPattern);
		var parts = [];
		// Now loop through all the pieces split them up based on whether they contain an email address
		for(var i=0;i<lookupParts.length;i++){
			// Do not examine the piece that already contains a link
			if(lookupParts[i].search(this.linkPattern) == -1){
				// Split the pieces up based on whether they contain a link
				var tmpParts = Zarafa.core.Util.splitStringByPattern(lookupParts[i], this.emailPattern);
				parts.push.apply(parts, tmpParts);
			} else {
				parts.push(lookupParts[i]);
			}
		}

		// Create a container node to append all the textnodes and anchor nodes to
		var containerNode = Ext.DomHelper.createDom({
			tag: 'span'
		});
		for(var i=0;i<parts.length;i++){
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
		for(var i=0, count=containerNode.childNodes.length;i<count;i++){
			// We remove the childNode from the parent by using this line so every loop we can add the first as the list shrinks
			parentNode.insertBefore(containerNode.childNodes.item(0), node);
		}

		// Remove the original node
		parentNode.removeChild(node);
	},

	/**
	 * Function registers handler on mailto links in {@link Zarafa.common.ui.messagepanel.MessageBody}
	 * @param {Ext.Element} iframeDocumentElement The document element of iframe
	 * @private
	 */
	handleMailToLinks: function(iframeDocumentElement)
	{
		var mailtoElements = iframeDocumentElement.query('a[href^="mailto:"]');

		if(!Ext.isEmpty(mailtoElements)){
			for (var i=0; i<mailtoElements.length ; i++)
			{
				Ext.EventManager.on(mailtoElements[i], 'click', this.onMailtoClick);
			}
		}
	},

	/**
	 * Called when any mailto links in {@link Zarafa.common.ui.messagepanel.MessageBody} is clocked
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
		Zarafa.core.URLActionMgr.execute({mailto: href});
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
		if (head.childElementCount != 0) {
			return;
		}

		var css = doc.createElement('style');
		css.setAttribute('type', 'text/css');
		css.appendChild(document.createTextNode('body { margin: 0; padding: 9px; } ' +
			// Make the blockquote element not use the default right margin of 40px
			'blockquote { margin-right: 0px; }' +
			// Make text in pre tags wrapped if too long for a line
			"@font-face { font-family: firamono; font-style: normal; font-weight: 400; src: url(" + window.location.pathname + "/client/resources/fonts/FiraMono-Regular.woff2) format('woff2'); }" +
			"pre { white-space: pre-wrap; margin: 0; font-family: firamono, monospace; }" +

			// Scale images
			'p > span > img, div > img, p > img { max-width: 100%; height: auto !important; }' +
			'@media screen and (max-width: 250px) { p > span > img, div > img, p > img { max-width: 250px; } }' +
			// Modern scrollbar
			'* { scrollbar-color: #1f1f1f transparent; } *::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; } *::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #c0c0c0; border-radius: 20px; min-height: 100px; }' +

			// Elements that should not have the max-width style
			// k-original: class that we set on img click
			// table img: all images in tables. Often used in newsletters
			'.k-original, table img { max-width: none !important; }'
		));

		head.appendChild(css);
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
		Zarafa.common.ui.messagepanel.MessageBody.superclass.onRender.call(this, ct, position);

		// Check if a client timeout has been defined
		var server = container.getServerConfig();
		var clientTimeout = server.getClientTimeout();
		if (clientTimeout){
			// Wait for the iframe to load before calling setIdleTimeEventListeners()
			this.getEl().on('load', this.setIdleTimeEventListeners, this);
		}

		// Wait for the iframe to load before calling setRelayEventListeners()
		this.getEl().on('load', this.setRelayEventListeners, this);

		this.wrap = this.el.wrap({cls: 'preview-body'});
		this.resizeEl = this.positionEl = this.wrap;
	}
});

Ext.reg('zarafa.messagebody', Zarafa.common.ui.messagepanel.MessageBody);
