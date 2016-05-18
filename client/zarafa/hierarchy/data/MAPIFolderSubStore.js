Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.MAPIFolderSubStore
 * @extends Zarafa.core.data.MAPISubStore
 *
 * Substore which contains {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} records,
 * which should not be serialized back to the server as they are only used for display
 * purposes in the {@link Zarafa.hierarchy.dialog.FolderSizeContentPanel}.
 */
Zarafa.hierarchy.data.MAPIFolderSubStore = Ext.extend(Zarafa.core.data.MAPISubStore, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var recordType = Zarafa.core.data.RecordFactory.getRecordClassByObjectType(Zarafa.core.mapi.ObjectType.MAPI_FOLDER);

		Ext.applyIf(config, {
			reader : new Zarafa.core.data.JsonReader({ dynamicRecord : false }, recordType)
		});

		Zarafa.hierarchy.data.MAPIFolderSubStore.superclass.constructor.call(this, config);
	}
});
