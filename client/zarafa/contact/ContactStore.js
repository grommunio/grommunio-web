Ext.namespace('Zarafa.contact');

/**
 * @class Zarafa.contact.ContactStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.contactstore
 *
 * this will contain all records fetched from the server side code
 */
Zarafa.contact.ContactStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor : function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass : 'IPM.Contact',
			defaultSortInfo : {
				field : 'fileas',
				direction : 'desc'
			}
		});

		Zarafa.contact.ContactStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.contactstore', Zarafa.contact.ContactStore);
