Ext.namespace('Grommunio.common.recipientfield.data');

/**
 * @class Grommunio.common.recipientfield.data.SuggestionListStore
 * @extends Ext.data.Store
 * @xtype grommunio.suggestionliststore
 *
 * The main store which holds the suggestions as shown inside the
 * {@link Grommunio.common.recipientfield.ui.RecipientField RecipientField}.
 */
Grommunio.common.recipientfield.data.SuggestionListStore = Ext.extend(Ext.data.Store, {
	/**
	 * @cfg {String} actionType type of action that should be used to send request to server,
	 * valid action types are defined in {@link Grommunio.core.Actions Actions}, default value is 'list'.
	 */
	actionType: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			batch: true,
			autoSave: true,
			remoteSort: false,
			actionType: Grommunio.core.Actions['list'],
			proxy: new Grommunio.common.recipientfield.data.SuggestionListProxy(),
			writer: new Grommunio.common.recipientfield.data.SuggestionListJsonWriter(),
			reader: new Ext.data.JsonReader({
				root: 'result',
				id: 'id'
			}, Grommunio.common.recipientfield.data.SuggestionListRecord)
		});

		Grommunio.common.recipientfield.data.SuggestionListStore.superclass.constructor.call(this, config);

		// Use multi-sorting on the suggestions,
		// we can't apply this in the configuration object
		// so we have to do it here.
		this.sort([{
			field: 'display_name',
			direction: 'ASC'
		},{
			field: 'smtp_address',
			direction: 'ASC'
		},{
			field: 'email_address',
			direction: 'ASC'
		}]);
	},

	/**
	 * Load all data from the store
	 * @param {Object} options Additional options
	 */
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

		if (!Ext.isDefined(options.actionType)) {
			options.actionType = this.actionType;
		}

		Grommunio.common.recipientfield.data.SuggestionListStore.superclass.load.call(this, options);
	}
});

Ext.reg('grommunio.suggestionliststore', Grommunio.common.recipientfield.data.SuggestionListStore);
