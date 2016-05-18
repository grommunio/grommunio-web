Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.MAPIFolderPermissionsSubStore
 * @extends Zarafa.core.data.MAPISubStore
 */
Zarafa.hierarchy.data.MAPIFolderPermissionsSubStore = Ext.extend(Zarafa.core.data.MAPISubStore, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_USER_PERMISSION);

		Ext.applyIf(config, {
			writer : new Zarafa.hierarchy.data.JsonPermissionsWriter(),
			// provide a default reader
			reader : new Zarafa.core.data.JsonReader({
				root : 'item',
				dynamicRecord : false
			}, recordType)
		});

		Zarafa.hierarchy.data.MAPIFolderPermissionsSubStore.superclass.constructor.call(this, config);
	}

});
