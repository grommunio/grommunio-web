Ext.namespace('Zarafa.common.freebusy.data');

/**
 * @class Zarafa.common.freebusy.data.FreebusyBlockStore
 * @extends Ext.data.Store
 * @xtype zarafa.freebusyblockstore
 */
Zarafa.common.freebusy.data.FreebusyBlockStore = Ext.extend(Ext.data.Store, 
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
			writer: new Ext.data.JsonWriter(),
			remoteSort: true,
			proxy: new Zarafa.common.freebusy.data.FreebusyProxy(),
			reader: new Ext.data.JsonReader({
				root: 'item'
			}, Zarafa.common.freebusy.data.FreebusyBlockRecord)
		});

		Zarafa.common.freebusy.data.FreebusyBlockStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.freebusyblockstore', Zarafa.common.freebusy.data.FreebusyBlockStore);
