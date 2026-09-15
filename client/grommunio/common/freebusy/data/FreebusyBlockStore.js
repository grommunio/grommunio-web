Ext.namespace('Grommunio.common.freebusy.data');

/**
 * @class Grommunio.common.freebusy.data.FreebusyBlockStore
 * @extends Ext.data.Store
 * @xtype grommunio.freebusyblockstore
 */
Grommunio.common.freebusy.data.FreebusyBlockStore = Ext.extend(Ext.data.Store, 
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
			proxy: new Grommunio.common.freebusy.data.FreebusyProxy(),
			reader: new Ext.data.JsonReader({
				root: 'item'
			}, Grommunio.common.freebusy.data.FreebusyBlockRecord)
		});

		Grommunio.common.freebusy.data.FreebusyBlockStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.freebusyblockstore', Grommunio.common.freebusy.data.FreebusyBlockStore);
