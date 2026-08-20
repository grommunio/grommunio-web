Ext.namespace('Zarafa.settings');

/**
 * @class Zarafa.settings.PersistentSettingsModel
 * @extends Zarafa.settings.SettingsModel
 *
 * The PersistentSettingsModel class contains functionality that acts on the persistent settings of the user.
 * The settings are built up in a hierarchical way, where each node in the path is separated using
 * the {@link #pathSeparator}.
 */
Zarafa.settings.PersistentSettingsModel = Ext.extend(Zarafa.settings.SettingsModel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};
		if (!Ext.isObject(config.defaults)) {
			config.defaults = Zarafa.settings.data.PersistentSettingsDefaultValue.getDefaultValues();
		}

		Zarafa.settings.PersistentSettingsModel.superclass.constructor.call(this, config);
	},

	/**
	 * Save the persistentsettings to the server, this will call {@link #execute} for
	 * the different {@link Zarafa.core.Actions actions} which are supposed
	 * to be executed on the server.
	 */
	save: function()
	{
		// Send a copy of each list, so a setting which changes while the request is in
		// flight is neither sent along nor dropped when the response comes in.
		if (!Ext.isEmpty(this.deleted)) {
			this.execute(Zarafa.core.Actions['delete'], this.deleted.slice());
		}

		if (!Ext.isEmpty(this.modified)) {
			this.execute(Zarafa.core.Actions['set'], this.modified.slice());
		}

		if (!Ext.isEmpty(this.resetSettings)) {
			this.execute(Zarafa.core.Actions['reset'], this.resetSettings.slice());
		}
	},

	/**
	 * Send the save action to the server, the actionData goes into 'persistentSetting'
	 * instead of 'setting'.
	 * @param {Zarafa.core.Actions} action The action which must be performed on the server
	 * @param {Object} parameters The action parameters which must be send to the server.
	 * @private
	 */
	execute: function(action, parameters)
	{
		if (this.fireEvent('beforesave', this, { action: parameters}) !== false) {
			container.getRequest().singleRequest(
				Zarafa.core.ModuleNames.getListName('settings'),
				action,
				{
					'persistentSetting': parameters
				},
				new Zarafa.core.data.ProxyResponseHandler({
					proxy: this,
					action: Ext.data.Api.actions['update'],
					options: {
						action: action,
						parameters: parameters
					},
					callback:  this.onExecuteComplete,
					scope: this
				})
			);
		}
	}

});
