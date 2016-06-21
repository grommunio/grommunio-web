(function() {
	/**
	 * @class Ext
	 * Overridden to add checks for identifying Internet Explorer and it's latest versions
	 * @singleton
	 */
	var userAgentString = navigator.userAgent.toLowerCase();
	var isIE = !Ext.isOpera && (((/msie/).test(userAgentString)) || ((/trident/).test(userAgentString)));
	var orig_getDom = Ext.getDom;

	// The following code is there to handle the JScript DontEnum Bug (appears in IE<9)
	// See https://developer.mozilla.org/en/docs/ECMAScript_DontEnum_attribute for more information
	var enumerables = true;
	var enumerablesTest = {toString: 1};
	for (var i in enumerablesTest) {
		enumerables = null;
	}
	if (enumerables) {
		enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable',
						'toLocaleString', 'toString', 'constructor'];
	}

	Ext.apply(Ext, {
		/**
		 * True if the detected browser is Internet Explorer.
		 * @type Boolean
		 * @property
		 */
		isIE : isIE,

		/**
		 * True if the detected browser is Internet Explorer 10.
		 * @type Boolean
		 * @property
		 */
		isIE10 : isIE && ((/msie 10/).test(userAgentString)),

		/**
		 * True if the detected browser is Internet Explorer 11.
		 * @type Boolean
		 * @property
		 */
		isIE11 : isIE && ((/rv:11/).test(userAgentString)),

		/**
		 * True if the detected browser is Microsoft Edge.
		 * @type Boolean
		 * @property
		 */
		isEdge : (/Edge\/\d./i).test(navigator.userAgent),

		/**
		 * Clone almost any type of variable including array, object, DOM nodes and Date without keeping the old reference
		 * @param {Mixed} item The variable to clone
		 * @return {Mixed} clone
		 */
		clone: function(item) {
			if (item === null || item === undefined) {
				return item;
			}

			// DOM nodes
			// TODO proxy this to Ext.Element.clone to handle automatic id attribute changing
			// recursively
			if (item.nodeType && item.cloneNode) {
				return item.cloneNode(true);
			}

			var type = Object.prototype.toString.call(item);

			// Date
			if (type === '[object Date]') {
				return new Date(item.getTime());
			}

			var i, j, k, clone, key;

			// Array
			if (type === '[object Array]') {
				i = item.length;

				clone = [];

				while (i--) {
					clone[i] = Ext.clone(item[i]);
				}
			}
			// Object
			else if (type === '[object Object]' && item.constructor === Object) {
				clone = {};

				for (key in item) {
					clone[key] = Ext.clone(item[key]);
				}

				if (enumerables) {
					for (j = enumerables.length; j--;) {
						k = enumerables[j];
						if (item.hasOwnProperty(k)) {
							clone[k] = item[k];
						}
					}
				}
			}
			return clone || item;
		},

		/*
		 * Override getDom to consider separate window as well while getting HTMLElement of provided id.
		 * 
		 * @param {Mixed} el The id string or DOM element
		 * @return {HTMLElement} HTMLElement
		 */
		getDom : function(el) {
			var getDomResult = null;
			var activeBrowserWindow = Zarafa.core.BrowserWindowMgr.getActive();

			// First, search for the element in active window only if browser window manager has active window available
			// and is not the main webapp window.
			if(Ext.isDefined(activeBrowserWindow) && activeBrowserWindow.name !== 'mainBrowserWindow' && typeof el === 'string') {
				getDomResult = activeBrowserWindow.document.getElementById(el);
			}

			// The element not found in active window which is not the main webapp window.
			// Try to search the element in main webapp window.
			if(getDomResult === null) {
				getDomResult = orig_getDom.apply(this, arguments);
			}

			// Check if the result of original getDom method is empty/null.
			// If the element is not found in 'webapp main window DOM' and 'active window' then the element must belongs to
			// other separately created window, try to look there as well.
			if(getDomResult === null && typeof el === 'string') {
				var browserWindows = Zarafa.core.BrowserWindowMgr.browserWindows;
				if(Ext.isDefined(browserWindows)) {
					browserWindows.each(function(browserWindow) {
						var elementResult = browserWindow.document.getElementById(el);
						if(browserWindow.name !== 'mainBrowserWindow' && browserWindow !== activeBrowserWindow && !(elementResult === null)) {
							getDomResult = elementResult;
							return;
						}
					});
				}
			}

			return getDomResult;
		},

		/*
		 * Override getBody to return the body element of currently active browser
		 * window from all the available browser windows.
		 * @return {Ext.Element} The document body of the currently active browser window.
		 */
		getBody : function(){
			var activeBrowserWindow = Zarafa.core.BrowserWindowMgr.getActive();
			var documentObject = Ext.isDefined(activeBrowserWindow) ? activeBrowserWindow.document : document;
			return Ext.get(documentObject.body || documentObject.documentElement);
		},

		/**
		 * Returns the current HTML document object as an {@link Ext.Element} which belongs to the active browser window.
		 * @return Ext.Element The document object wrapped as (@link Ext.Element}
		 */
		getDoc : function(){
			var activeBrowserWindow = Zarafa.core.BrowserWindowMgr.getActive();
			var documentObject = Ext.isDefined(activeBrowserWindow) ? activeBrowserWindow.document : document;
			return Ext.get(documentObject);
		}
	});
})();
