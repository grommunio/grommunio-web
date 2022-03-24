Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.FilesStoreRecord
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPFRecord IPFRecord} object.
 */
Zarafa.plugins.files.data.FilesFolderRecordFields = [
	{name: 'path'},
	{name: 'folder_id'},
	// TODO: try to remove id property.
	{name: 'id', mapping: 'entryid'},
	// Fixme: change text property to display_name
	{name: 'text'},
	{name: 'object_type'},
	{name: 'entryid'},
	{name: 'parent_entryid'},
	{name: 'store_entryid'},
	{name: 'filename'},
	{name: 'icon_index'},
	{name: 'display_name'},
	{name: 'lastmodified'},
	{name: 'message_size'},
	{name: 'has_subfolder', defaultValue: false}
];

Zarafa.plugins.files.data.FilesFolderRecord = Ext.extend(Zarafa.core.data.IPFRecord, {

	// TODO: Try to remove id property from baseIdProperties list.
	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties : [ 'id', 'folder_id', 'entryid', 'store_entryid', 'parent_entryid' ],

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
			definition = Zarafa.core.data.RecordFactory.getRecordDefinitionByCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER);
		}

		Zarafa.plugins.files.data.FilesFolderRecord.superclass.constructor.call(this, data, id, definition);
	},

	/**
	 * Usually called by the {@link Ext.data.Store} which owns the Record.
	 * Commits all changes made to the Record since either creation, or the last commit operation.
	 * <p>Developers should subscribe to the {@link Ext.data.Store#update} event
	 * to have their code notified of commit operations.</p>
	 * @param {Boolean} silent (optional) True to skip notification of the owning
	 * store of the change (defaults to false)
	 */
	commit : function()
	{
		// Check if the parent folder still is correct.
		if (this.cacheParentFolder) {
			if (!Zarafa.core.EntryId.compareEntryIds(this.get('parent_entryid'), this.cacheParentFolder.get('entryid'))) {
				delete this.cacheParentFolder;
			}
		}
		Zarafa.plugins.files.data.FilesFolderRecord.superclass.commit.apply(this, arguments);
	},

	/**
	 * Helper function to obtain the fully qualified display name. For normal folders, this will return
	 * the same value as {@link #getDisplayName},
	 * @return {String} name of the folder
	 */
	getFullyQualifiedDisplayName : function(){
		return this.getDisplayName();
	},

	/**
	 * Helper function to get display name of {@link Zarafa.plugins.files.data.FilesFolderRecord FilesFolderRecord}.
	 * it will get it from display_name property.
	 * @return {String} name of the folder.
	 */
	getDisplayName: function () {
		return this.get('display_name');
	},

	/**
	 * @return {Boolean} true if the folder is the subtree folder of its store else false.
	 */
	isSubTreeFolder : function()
	{
		var FilesFolderStore = this.getFilesStore();
		if (FilesFolderStore) {
			return Zarafa.core.EntryId.compareEntryIds(this.get('entryid'), FilesFolderStore.get('subtree_id'));
		}

		return false;
	},

	/**
	 * Returns a {@link Zarafa.plugins.files.data.FilesStoreRecord FilesStoreRecord} for the record
	 * @return {Zarafa.plugins.files.data.FilesStoreRecord} FilesStoreRecord or false if
	 * {@link Zarafa.plugins.files.data.FilesFoldersSubStore FilesFoldersSubStore} is not defined.
	 */
	getFilesStore: function ()
	{
		var store = this.getStore();
		if (store && store instanceof Zarafa.plugins.files.data.FilesFoldersSubStore) {
			return store.getParentRecord();
		}

		return store;
	},

	/**
	 * Returns all child folders of given folder.
	 *
	 * @return {Array} array of child {@link Zarafa.plugins.files.data.FilesFolderRecord folders}
	 */
	getChildren : function ()
	{
		var rs = [];

		this.getFilesFolderStore().each(function(record) {
			if (this === record.getParentFolder()) {
				rs.push(record);
			}
		}, this);

		return rs;
	},

	/**
	 * Function will return parent {@link Zarafa.plugins.files.data.FilesFolderRecord FilesFolderRecord}
	 * of this {@link Zarafa.plugins.files.data.FilesFolderRecord FilesFolderRecord}.
	 * @return {Zarafa.plugins.files.data.FilesFolderRecord} parent {@link Zarafa.plugins.files.data.FilesFolderRecord FilesFolderRecord} or
	 * false if parent folder doesn't exist.
	 */
	getParentFolder : function() {
		if (!this.cacheParentFolder) {
			var path = this.get('parent_entryid');
			if (!this.isSubTreeFolder() && !Ext.isEmpty(path)) {
				this.cacheParentFolder = this.getFilesFolderStore().getById(path);
			}

			// Guarentee that the parent folder knows it has children...
			// Don't use record::set() as we don't want to trigger updates.
			if (this.cacheParentFolder && this.get('object_type') === Zarafa.plugins.files.data.FileTypes.FOLDER) {
				this.cacheParentFolder.data.has_subfolder = this.get("object_type") === Zarafa.plugins.files.data.FileTypes.FOLDER;
			}
		}

		return this.cacheParentFolder;
	},

	/**
	 * Returns the {@link Zarafa.hierarchy.data.IPFSubStore} which contains all folders
	 * of the store in which the current store is located. This is safer then using {@link #getStore},
	 * as this function will use {@link #getMAPIStore} to obtain the parent {@link Zarafa.hierarchy.data.MAPIStoreRecord}
	 * and is thus safe when the current record is located in the {@link Zarafa.core.data.ShadowStore}.
	 * @return {Zarafa.hierarchy.data.IPFSubStore} The substore containing all folders
	 */
	getFilesFolderStore : function ()
	{
		var store = this.getFilesStore();
		if (store) {
			return store.getSubStore('folders');
		}

		return false;
	},

	/**
	 * Copy the {@link Zarafa.core.data.MAPIRecord Record} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Zarafa.core.data.MAPIRecord} The copy of the record.
	 */
	copy : function(newId)
	{
		var copy = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER, this.data, newId || this.id);

		copy.idProperties = this.idProperties.clone();
		copy.phantom = this.phantom;

		return copy.applyData(this, true);
	},

	/**
	 * Function used to get the icon based on the folder.
	 * @return {string} return the icon which used for hierarchy node.
	 */
	getIcon : function ()
	{
		if (this.isSubTreeFolder()) {
			return "icon_16_logo_" + this.getFilesStore().getBackend();
		}

		if(this.isFolder()) {
			return "icon_folder_note";
		}

		return Zarafa.plugins.files.data.Utils.File.getIconClass(this.get('display_name'), "16");
	},

	/**
	 * Check selected record is folder record or not.
	 *
	 * @return {boolean} return true if selected record is
	 * folder record else false.
	 */
	isFolder : function ()
	{
		return this.get('object_type') === Zarafa.plugins.files.data.FileTypes.FOLDER;
	},

	/**
	 * @return {boolean} true if folder is home folder. home folder is dummy and hidden folder
	 * in {@link Zarafa.plugins.files.data.FilesHierarchyStore FilesHierarchyStore} else false.
	 */
	isHomeFolder : function()
	{
		return this.get("entryid") === "#R#";
	},

	/**
	 * @returns {Boolean} true if the folder is the favorites folder else false.
	 */
	isFavoritesFolder : Ext.emptyFn,

	/**
	 * @return {Boolean} true if folder is IPM_Subtree of own store
	 */
	isOwnRoot : Ext.emptyFn,

	/**
	 * Helper function which used to check user is trying to delete the parent folder of currently selected folder or not.
	 *
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord} folder The folder which can be either {@link #getDefaultFolder default folder} or
	 * parent folder of currently deleted folder
	 * @returns {boolean} return true if deleted folder is parent folder of currently selected folder in hierarchy else false.
	 */
	isParentFolderOfSelectedFolder: function(folder)
	{
		if (!Ext.isDefined(folder)) {
			folder = this.getDefaultFolder();
		}

		if (this.get('folder_id') === folder.get('folder_id')) {
			return true;
		} else if (folder.isSubTreeFolder()){
			return false;
		} else {
			return this.isParentFolderOfSelectedFolder(folder.getParentFolder());
		}
		return false;
	}
});

Zarafa.core.data.RecordCustomObjectType.addProperty('FILES_FOLDER');
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER, Zarafa.plugins.files.data.FilesFolderRecordFields);
Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER, Zarafa.plugins.files.data.FilesFolderRecord);
Zarafa.core.data.RecordFactory.addListenerToObjectType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER, 'createphantom', function(record) {
	// Phantom records must always be marked as opened (they contain the full set of data)
	record.afterOpen();
});