(function() {
	/**
	 * @class Ext
	 * Overridden to add checks for identifying Internet Explorer and it's latest versions
	 * @singleton
	 */
	var userAgentString = navigator.userAgent.toLowerCase();
	var isIE = !Ext.isOpera && (((/msie/).test(userAgentString)) || ((/trident/).test(userAgentString)));

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
		}
	});
})();
