// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.common.printer.renderers');

/**
 * @class Zarafa.common.printer.renderers.BaseRenderer
 * @extends Object
 * Abstract base renderer class. Don't use this directly, use a subclass instead.
 */
Zarafa.common.printer.renderers.BaseRenderer = Ext.extend(Object, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * Prints the component
	 * @param {Ext.Component} component The component to print
	 */
	print: function(component) {
		// The WebKit browsers (Chrome, Safari, and Edge (which is also recognized as WebKit))
		// show a print preview, so we can use an hidden iframe to create our print.
		// IE and FireFox don't have a print preview when printing from an iframe, so
		// we will open a new window in which we will create our print. This window will
		// also function as a print preview
		if ( Ext.isWebKit ) {
			// Needed for popouts
			var activeWindow = Zarafa.core.BrowserWindowMgr.getActive();
			var activeDocument = activeWindow.document;
			var printFrame = activeDocument.createElement('iframe');
			printFrame.style.cssText = "height: 0px; width: 0px; position: absolute;";
			activeDocument.body.appendChild(printFrame);
			printFrame.onload = function () {
				// Remove the iframe after printing.
				printFrame.contentWindow.onafterprint = function() {
					activeDocument.body.removeChild(printFrame);
				};

				// Focus needed for IE
				printFrame.contentWindow.focus();
				printFrame.contentWindow.print();
			};
			var printDocument = printFrame.contentDocument;
			printDocument.write(this.generateHTML(component));
			printDocument.close();
			this.postRender(activeWindow, printDocument, component);
		} else {
			var win = window.open('', 'name'+(new Date().getTime()));
			if (win) {
				win.document.write(this.generateHTML(component));
				win.document.close();
				this.postRender(window.document, win.document, component);

				// Show print dialog when window has loaded all resources.
				win.onload = function() {
					win.print();
					win.close();
				};
			}
		}
	},

	/**
	 * Generates the HTML Markup which wraps whatever this.generateBodyTemplate produces
	 * @param {Ext.Component} component The component to generate HTML for
	 * @return {String} An HTML fragment to be placed inside the print window
	 */
	generateHTML: function(component) {
		return new Ext.XTemplate(
			this.cleanTemplate(
				// no doctype, quicks mode works better for printing, especially in chrome.
				'<html>\n' +
				'<head>\n' +
					'<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />\n' +
					this.generateHeadTemplate(component) +
					'<title>' + _('Kopano WebApp print') + '</title>\n' +
				'</head>\n' +
				'<body>\n' +
					'<div id="pagemargin">\n' +
						this.generateBodyTemplate(component) +
					'</div>\n' +
				'</body>\n' +
				'</html>'
			)
		).apply(this.prepareData(component));
	},

	/**
	 * Clean the template string by removing all illegal characters
	 * @param {String} template The template string to clean
	 * @return {String} The clean template
	 * @private
	 */
	cleanTemplate : function(template)
	{
		// Conversions:
		// - \r is an illegal character which cannot be present in a string
		// - \ is a valid character, but shouldn't be escaped in an HTML text.
		return template.replace(/\r/g, '').replace(/\\/g, '\\\\');
	},

	/**
	 * Returns the HTML that will be placed into the <head> part of the print window.
	 * @param {Ext.Component} component The component to render
	 * @return {String} The HTML fragment to place inside the print window's <head> element
	 */
	generateHeadTemplate: function(record) {
		if (!Ext.isEmpty(this.customStylesheetPath)) {
			if (Array.isArray(this.customStylesheetPath)) {
				var all = '';
				for (var i=0, l=this.customStylesheetPath.length; i<l; i++) {
					all += '<link href="' + this.customStylesheetPath[i] + '?' + new Date().getTime() + '" rel="stylesheet" type="text/css" media="screen,print" />\n';
				}
				return all;
			} else {
				return '<link href="' + this.customStylesheetPath + '?' + new Date().getTime() + '" rel="stylesheet" type="text/css" media="screen,print" />';
			}
		}
		return '';
	},

	/**
	 * Returns the HTML that will be placed into the <body> part of the print window.
	 * @param {Ext.Component} component The component to render
	 * @return {String} The HTML fragment to place inside the print window's <body> element
	 */
	generateBodyTemplate: Ext.emptyFn,

	/**
	 * Prepares data suitable for use in an XTemplate from the component
	 * @param {Ext.Component} component The component to acquire data from
	 * @return {Array} An empty array (override this to prepare your own data)
	 */
	prepareData: function(record) {
		// copy all properties
		var data = Ext.apply({}, record.data);
		data['fullname'] = container.getUser().getDisplayName();

		// HTML Escape all data
		for (var key in data) {
			if(Ext.isString(data[key])) {
				data[key] = Ext.util.Format.htmlEncode(data[key]);
			}
		}
		return data;
	},

	/**
	 * Passes the newly created DOM tree to add more rendering of Ext components in.
	 * @param {Document} webappDOM original webapp DOM
	 * @param {Document} printDOM DOM containing processed print template
	 * @param {Object} obj the object for the renderer
	 */
	postRender: Ext.emptyFn
});
