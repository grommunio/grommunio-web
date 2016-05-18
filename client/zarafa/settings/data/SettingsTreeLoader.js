Ext.namespace('Zarafa.settings.data');

/**
 * @class Zarafa.settings.data.SettingsTreeLoader
 * @extends Ext.ux.tree.TreeGridLoader
 *
 * A Special treeloader to be used by the
 * {@link Zarafa.settings.ui.SettingsTreePanel SettingsTreePanel}.
 * This wil dynamically load the child nodes for a given node by reading the
 * {@link Zarafa.core.data.SettingsModel Settings}.
 */
Zarafa.settings.data.SettingsTreeLoader = Ext.extend(Ext.ux.tree.TreeGridLoader, {
	/**
	 * @cfg {Number} autoExpandLevel The maximum level in which the TreeNodes will be
	 * expanded by default. e.g. When this is set to 1 then the node 'zarafa' will
	 * be expanded by default, when set to 2 the node 'zarafa/v1' will be expanded,
	 * etc.
	 */
	autoExpandLevel : 0,

	/**
	 * @cfg {String/RegExp} autoExpandFilter The String or Regular expressing which
	 * is used to test if the node must be expanded or not.
	 */
	autoExpandFilter : undefined,

	/**
	 * @cfg {Zarafa.settings.SettingsModel} model The model which should be used for
	 * loading the settings. This can be configured later using {@link #bindModel}.
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!config.directFn) {
			// Small hack, ExtJs calls directFn in the DOMWindow scope, rather
			// then the scope of this class. Since we wish to extend the TreeGridLoader
			// rather then passing the directFn as a configuration option, we are now
			// just going to create a delegate and force the function into the correct
			// scope.
			config.directFn = this.directFn.createDelegate(this);
		}

		Zarafa.settings.data.SettingsTreeLoader.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize a new {@link Zarafa.settings.SettingsModel Settings Model}.
	 * @param {Zarafa.settings.SettingsModel} model The model to load
	 * @param {Boolean} initialize (optional) True if this function is called
	 * during initialization
	 */
	bindModel : function(model, initialize)
	{
		if (initialize || this.model !== model) {
			this.model = model;
		}
	},

	/**
	 * This is called when a node in the SettingsTree is being expanded, this will read
	 * the {@link Zarafa.core.data.SettingsModel Settings} to find the child nodes which
	 * are positioned below the expanded node.
	 *
	 * @param {String} node The ID of the node which is being expanded
	 * @param {Function} fn The function which must be called with the JSON data of
	 * the nodes below the provided node.
	 * @private
	 */
	directFn : function(node, fn)
	{
		var path = this.model.getPath(node);
		var settings = this.model.get(path, true);
		var data = [];

		for (var key in settings) {
			var leaf = !Ext.isObject(settings[key]) || Ext.isArray(settings[key]);
			var nodePath = (!Ext.isEmpty(path) ? path + '/' : '') + key;
			var expanded = false;

			if (this.autoExpandFilter) {
				if (this.autoExpandFilter.test(nodePath)) {
					expanded = nodePath.split('/').length < this.autoExpandLevel;
				}
			}

			data.push({
				nodeType: 'setting',
				text: key,
				id: nodePath,
				leaf: leaf,
				expanded : !leaf && expanded,
				value: leaf ? settings[key] : undefined,
				uiProvider : Zarafa.settings.ui.SettingsTreeNodeUI
			});
		}

		fn(data, {status: true});
	}
});
