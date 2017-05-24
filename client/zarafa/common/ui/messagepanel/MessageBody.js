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
	plaintextTemplate : '<html><body><pre>{body}</pre></body></html>',

	/**
	 * The {RegExp} of emailPattern, this regular expression finds mailto links or email address
	 * inside string.
	 */
	emailPattern : /((mailto:)[\w@,;.?=&%:///+ ]+)|([\w-\._\+%]+@(?:[\w-]+\.)+[\w]*)/gi,

	/**
	 * The {RegExp} of linkPattern, this regular expression finds urls inside string.
	 * Urls like http, https, ftp or www.
	 */
	linkPattern : /((?:http|ftp)s?:\/\/|www.)([\w\.\-]+)\.(\w{2,6})([\w\/\-\_\+\.\,\?\=\&\!\:\;\%\#\|]+)*/gi,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.messagebody',
			autoScroll:true,
			anchor : '100%',
			layout: 'fit',
			autoEl : {
				tag: 'iframe',
				cls: 'preview-iframe',
				frameborder: 0,
				src: Ext.SSL_SECURE_URL
			},
			border : false
		});

		Zarafa.common.ui.messagepanel.MessageBody.superclass.constructor.call(this, config);

		if (Ext.isString(this.plaintextTemplate)) {
			this.plaintextTemplate = new Ext.Template(this.plaintextTemplate, {
				compiled: true
			});
		}
	},

	/**
	 * Set event listeners on the iframe that will relay the
	 * event when the user performs click within iframe.
	 * @private
	 */
	setRelayEventListeners : function()
	{
		var iframeWindow = this.getEl().dom.contentWindow;
		var iframeDocument = iframeWindow.document;

		iframeDocument.addEventListener('mousedown', this.onMouseDown.createDelegate(this), true);
	},

	/**
	 * Function is called when mouse is clicked in the editor.
	 * iframe mousedown event needs to be relayed for the document element of WebApp page,
	 * to hide the context-menu.
	 */
	onMouseDown : function()
	{
		Ext.getDoc().fireEvent('mousedown');
	},

	/**
	 * Set event listeners on the iframe that will reset the
	 * {@link Zarafa#idleTime idle time} when the user performs
	 * an action in the iframe (i.e. click, mousemove, keydown)
	 * @private
	 */
	setIdleTimeEventListeners : function()
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
			body = record.getBody(html);

			if (!body) {
				body = '';
			} else  if (html === false) {
				body = this.plaintextTemplate.applyTemplate({ body: Ext.util.Format.htmlEncode(body) });
			}
		}

		// the open method clears the document if it has contents
		iframeDocument.open();
		iframeDocument.write('<!DOCTYPE html><html><body>');
		iframeDocument.write(body);
		iframeDocument.write('</body></html>');
		iframeDocument.close();

		// Disable drag and drop
		Ext.EventManager.on(iframeWindow, 'dragover', Zarafa.onWindowDragDrop);
		Ext.EventManager.on(iframeWindow, 'drop', Zarafa.onWindowDragDrop);

		// Add CSS document to the previewbody
		// so the text can be styled.
		this.addCSSText(iframeDocument);

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
	 * Funtion recursively scans dom to get text nodes which contain email addresses or URLs so we can
	 * replace them with an anchor tag.
	 * @param {HTMLElement} node The parent node that will be examined to find the child text nodes
	 * @private
	 */
	scanDOMForLinks : function(node)
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
	 * @parem {HTMLElement} parentNode The parent of the passed node
	 * @private
	 */
	linkifyDOMNode : function(node, parentNode)
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
			}else{
				parts.push(lookupParts[i]);
			}
		}

		// Create a container node to append all the textnodes and anchor nodes to
		var containerNode = Ext.DomHelper.createDom({
			tag : 'span'
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
			}else if(parts[i].search(this.emailPattern) != -1){
				// Create a new anchor-node for making an e-mail address clickable.
				var anchorNode = Ext.DomHelper.append(containerNode, {tag: 'a', html: parts[i]});
				var link = parts[i];
				if(link.indexOf('mailto:') !== 0){
					link = 'mailto:' + link;
				}
				anchorNode.setAttribute('href', link);
			}else{
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
	handleMailToLinks : function(iframeDocumentElement)
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
	onMailtoClick : function(event, element)
	{
		// Prevent the browsers default handling of the event.
		// i.e. opening mailto handler for the link
		event.preventDefault();

		var href = this.href || element.href;
		Zarafa.core.URLActionMgr.execute({mailto : href});
	},

	/**
	 * Adds a <style> element into the <head> tag of the given document,
	 * this will contain the special stylesheet which can be used to apply
	 * to styling to the previewpanel.
	 * @param {Document} doc The document to which the link should be added
	 * @private
	 */
	addCSSText : function(doc)
	{
		var head = doc.getElementsByTagName('head')[0];
		var css = doc.createElement('style');
		css.setAttribute('type', 'text/css');
		css.appendChild(document.createTextNode('body { margin: 0; padding: 9px; } ' +
			// Make the blockquote element not use the default right margin of 40px
			'blockquote { margin-right: 0px; }' +
			// Make text in pre tags wrapped if too long for a line
			'pre { white-space: pre-wrap; margin: 0; font-family:monospace; }'
		));

		// Add a wingdings compatible font (only the smilies)
		// for systems that don't have wingdings installed, and
		// always for firefox because that browser doesn't support
		// rendering with system installed symbol fonts.
		if ( (Ext.isGecko && !Ext.isIE && !Ext.isEdge) || !Zarafa.wingdingsInstalled ){
			var baseUrl = container.getServerConfig().getBaseUrl();
			css.appendChild(document.createTextNode(
				"@font-face {" +
					"font-family: 'Wingdings';" +
					"src: url('"+baseUrl+"client/resources/fonts/kopanowebappdings.eot');" +
					"src: url('"+baseUrl+"client/resources/fonts/kopanowebappdings.eot?#iefix') format('embedded-opentype')," +
						"url('"+baseUrl+"client/resources/fonts/kopanowebappdings.woff2') format('woff2')," +
						"url('"+baseUrl+"client/resources/fonts/kopanowebappdings.woff') format('woff')," +
						"url('"+baseUrl+"client/resources/fonts/kopanowebappdings.ttf') format('truetype');" +
					"font-weight: normal;" +
					"font-style: normal;" +
				"}"
			));
		}

		head.appendChild(css);
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
	onRender : function(ct, position)
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
