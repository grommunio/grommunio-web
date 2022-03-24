Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.FilesStoreRecord
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPFRecord IPFRecord} object.
 */
Zarafa.plugins.files.data.FilesStoreRecordFields = [
	{name: 'path'},
	{name: 'entryid'},
	{name: 'store_entryid'},
	// Fixme :
	{name: 'text'},
	{name: 'object_type'},
	{name: 'status'},
	{name: 'status_description'},
	{name: 'backend'},
	{name: 'backend_config'},
	{name: 'backend_features'},
	{name: 'cannot_change'},
	{name: 'filename'},
	{name: 'subtree_id'},
	{name: 'display_name'},
	{name: 'account_sequence'}
];

Zarafa.plugins.files.data.FilesStoreRecord = Ext.extend(Zarafa.core.data.IPFRecord, {
	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties : [ 'store_entryid'],

	/**
	 * @constructor
	 * @param {Object} data The data which must be applied to this record
	 * @param {Object} id The unique id for this record
	 * @param {Zarafa.core.data.RecordDefinition} definition The record definition used to
	 * construct this record
	 */
	constructor : function(data, id, definition)
	{
		if (!Ext.isDefined(definition)) {
			definition = Zarafa.core.data.RecordFactory.getRecordDefinitionByCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER_STORE);
		}

		Zarafa.plugins.files.data.FilesStoreRecord.superclass.constructor.call(this, data, id, definition);
	},

	/**
	 * @return {Zarafa.plugins.files.data.FilesFolderRecord} subtree folder.
	 */
	getSubtreeFolder : function()
	{
		return this.getFolder(this.get('subtree_id'));
	},

	/**
	 * Retrieves a folder by MAPI id.
	 * @param {String} id the id of the folder.
	 * @return {Zarafa.plugins.files.data.FilesFolderRecord} folder object or undefined if not found.
	 */
	getFolder : function(id)
	{
		var store = this.getFolderStore();

		if (store) {
			return store.getById(id);
		}
	},

	/**
	 * Get the Folder store for the {@link Zarafa.plugins.files.data.FilesFolderRecord FilesFolderRecord} (See {@link #getSubStore}).
	 * @return {Zarafa.plugins.files.data.FilesFoldersSubStore} The Folder store.
	 */
	getFolderStore : function()
	{
		return this.getSubStore('folders');
	},

	getBackend : function ()
	{
		return this.get('backend');
	}
});

Zarafa.core.data.RecordCustomObjectType.addProperty('FILES_FOLDER_STORE');

Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER_STORE, Zarafa.plugins.files.data.FilesStoreRecordFields);
Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER_STORE, Zarafa.plugins.files.data.FilesStoreRecord);
Zarafa.core.data.RecordFactory.setSubStoreToCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER_STORE, 'folders',Zarafa.plugins.files.data.FilesFoldersSubStore);
