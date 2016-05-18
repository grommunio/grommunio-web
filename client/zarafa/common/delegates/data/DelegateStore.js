Ext.namespace('Zarafa.common.delegates.data');

/**
 * @class Zarafa.common.delegates.data.DelegateStore
 * @extends Zarafa.core.data.MAPIStore
 *
 * Delegate store that will be used to load delegates information from server.
 */
Zarafa.common.delegates.data.DelegateStore = Ext.extend(Zarafa.core.data.MAPIStore, {
	/**
	 * @cfg {String} actionType type of action that should be used to send request to server,
	 * valid action types are defined in {@link Zarafa.core.Actions Actions}, default value is 'list'.
	 */
	actionType : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			// load data whenever instance of store is created
			autoLoad : true,
			batch : false,

			actionType : Zarafa.core.Actions['list'],

			writer : new Zarafa.core.data.JsonWriter(),
			reader : new Zarafa.common.delegates.data.JsonDelegateReader(),

			proxy : new Zarafa.core.data.IPMProxy({
				listModuleName : Zarafa.core.ModuleNames.getListName('DELEGATES'),
				itemModuleName : Zarafa.core.ModuleNames.getItemName('DELEGATES')
			})
		});

		Zarafa.common.delegates.data.DelegateStore.superclass.constructor.call(this, config);
	},

	load : function(options)
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
			actionType : this.actionType
		});

		return Zarafa.common.delegates.data.DelegateStore.superclass.load.call(this, options);
	}
});
