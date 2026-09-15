Ext.namespace('Grommunio.common.delegates.data');

/**
 * @class Grommunio.common.delegates.data.DelegateStore
 * @extends Grommunio.core.data.MAPIStore
 *
 * Delegate store that will be used to load delegates information from server.
 */
Grommunio.common.delegates.data.DelegateStore = Ext.extend(Grommunio.core.data.MAPIStore, {
	/**
	 * @cfg {String} actionType type of action that should be used to send request to server,
	 * valid action types are defined in {@link Grommunio.core.Actions Actions}, default value is 'list'.
	 */
	actionType: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			// load data whenever instance of store is created
			autoLoad: true,
			batch: false,

			actionType: Grommunio.core.Actions['list'],

			writer: new Grommunio.core.data.JsonWriter(),
			reader: new Grommunio.common.delegates.data.JsonDelegateReader(),

			proxy: new Grommunio.core.data.IPMProxy({
				listModuleName: Grommunio.core.ModuleNames.getListName('DELEGATES'),
				itemModuleName: Grommunio.core.ModuleNames.getItemName('DELEGATES')
			})
		});

		Grommunio.common.delegates.data.DelegateStore.superclass.constructor.call(this, config);
	},

	load: function(options)
	{
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		// By default 'load' must cancel the previous request.
		if (!Ext.isDefined(options.cancelPreviousRequest)) {
			options.cancelPreviousRequest = true;
		}

		Ext.applyIf(options, {
			actionType: this.actionType
		});

		return Grommunio.common.delegates.data.DelegateStore.superclass.load.call(this, options);
	}
});
