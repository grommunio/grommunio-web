Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.FilesStoreRecord
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.core.data.IPFRecord IPFRecord} object.
 */
Grommunio.plugins.files.data.FilesStoreRecordFields = [
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

Grommunio.plugins.files.data.FilesStoreRecord = Ext.extend(Grommunio.core.data.IPFRecord, {
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
	 * @param {Grommunio.core.data.RecordDefinition} definition The record definition used to
	 * construct this record
	 */
	constructor : function(data, id, definition)
	{
		if (!Ext.isDefined(definition)) {
			definition = Grommunio.core.data.RecordFactory.getRecordDefinitionByCustomType(Grommunio.core.data.RecordCustomObjectType.FILES_FOLDER_STORE);
		}

		Grommunio.plugins.files.data.FilesStoreRecord.superclass.constructor.call(this, data, id, definition);
	},

	/**
	 * @return {Grommunio.plugins.files.data.FilesFolderRecord} subtree folder.
	 */
	getSubtreeFolder : function()
	{
		return this.getFolder(this.get('subtree_id'));
	},

	/**
	 * Retrieves a folder by MAPI id.
	 * @param {String} id the id of the folder.
	 * @return {Grommunio.plugins.files.data.FilesFolderRecord} folder object or undefined if not found.
	 */
	getFolder : function(id)
	{
		var store = this.getFolderStore();

		if (store) {
			return store.getById(id);
		}
	},

	/**
	 * Get the Folder store for the {@link Grommunio.plugins.files.data.FilesFolderRecord FilesFolderRecord} (See {@link #getSubStore}).
	 * @return {Grommunio.plugins.files.data.FilesFoldersSubStore} The Folder store.
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

Grommunio.core.data.RecordCustomObjectType.addProperty('FILES_FOLDER_STORE');

Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.FILES_FOLDER_STORE, Grommunio.plugins.files.data.FilesStoreRecordFields);
Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.FILES_FOLDER_STORE, Grommunio.plugins.files.data.FilesStoreRecord);
Grommunio.core.data.RecordFactory.setSubStoreToCustomType(Grommunio.core.data.RecordCustomObjectType.FILES_FOLDER_STORE, 'folders',Grommunio.plugins.files.data.FilesFoldersSubStore);
