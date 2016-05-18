Ext.namespace('Zarafa.calendar.data.busytime');

/**
 * @class Zarafa.calendar.data.busytime.BusyTimeStore
 * @extends Zarafa.core.data.MAPIStore
 * @xtype zarafa.busytimestore
 */
Zarafa.calendar.data.busytime.BusyTimeStore = Ext.extend(Zarafa.core.data.MAPIStore, 
{
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			batch: true,
			autoSave: false,
			remoteSort: false,
			proxy: new Zarafa.calendar.data.busytime.BusyTimeProxy(),
			reader: new Ext.data.JsonReader({
				root: 'item'
			}, Zarafa.calendar.data.busytime.BusyTimeRecord)
		});
		Zarafa.calendar.data.busytime.BusyTimeStore.superclass.constructor.call(this, config);
	},

	/**
	 * Clear all data in the store
	 * @private
	 */
	clearData : function()
	{
		// Skip the superclass implementation.
		Zarafa.core.data.MAPIStore.superclass.clearData.apply(this, arguments);
	}
});

Ext.reg('zarafa.busytimestore', Zarafa.calendar.data.busytime.BusyTimeStore);
