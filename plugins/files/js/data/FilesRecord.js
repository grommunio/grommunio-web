Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.FilesRecordFields
 *
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Files' type messages.
 */
Zarafa.plugins.files.data.FilesRecordFields = [
	// FIXME : try to remove this id proper.
	{name: 'id', mapping:"entryid"},
	{name: 'folder_id'},
	{name: 'path'},
	{name: 'type', type: 'int', defaultValue: Zarafa.plugins.files.data.FileTypes.FOLDER},
	{name: 'filename'},
	{name: 'display_name', mapping: 'filename'},
	{name: 'isshared', type: 'boolean', defaultValue: false},
	{name: 'sharedid'},
	{name: 'lastmodified', type: 'int', defaultValue: null},
	{name: 'message_size', type: 'int', defaultValue: 0},
	{name: 'deleted', type: 'boolean', defaultValue: false},
];

/**
 * @class Zarafa.plugins.files.data.FilesRecord
 * @extends Zarafa.core.data.IPMRecord
 */
Zarafa.plugins.files.data.FilesRecord = Ext.extend(Zarafa.core.data.IPMRecord, {

	/**
	 * @cfg {Boolean} Record state.
	 */
	disabled: false,

	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties : [ 'folder_id', 'entryid', 'store_entryid', 'parent_entryid' ],

	/**
	 * Applies all data from an {@link Zarafa.plugins.files.data.FilesRecord FilesRecord}
	 * to this instance. This will update all data.
	 *
	 * @param {Zarafa.plugins.files.data.FilesRecord} record The record to apply to this
	 * @return {Zarafa.plugins.files.data.FilesRecord} this
	 */
	applyData: function (record) {
		this.beginEdit();

		Ext.apply(this.data, record.data);
		Ext.apply(this.modified, record.modified);

		this.dirty = record.dirty;

		this.endEdit(false);

		return this;
	},

	/**
	 * Builds and returns inline image URL to download inline images,
	 * it uses {@link Zarafa.core.data.IPMRecord IPMRecord} to get store and message entryids.
	 *
	 * @return {String} URL for downloading inline images.
	 */
	getInlineImageUrl: function () {
		return container.getBasePath() + "index.php?load=custom&name=download_file&" + Ext.urlEncode({
			id    : this.get('folder_id'),
			inline: true
		});
	},

	/**
	 * Builds and returns attachment URL to download attachment,
	 * it uses {@link Zarafa.core.data.IPMRecord IPMRecord} to get store and message entryids.
	 *
	 * @return {String} URL for downloading attachment.
	 */
	getAttachmentUrl: function () {
		return container.getBasePath() + "index.php?sessionid=" + container.getUser().getSessionId() + "&load=custom&name=download_file&" + Ext.urlEncode({
			id    : this.get('folder_id'),
			inline: false
		});
	},

	/**
	 * Set the disabled flag.
	 *
	 * @param {Boolean} state
	 */
	setDisabled: function (state) {
		this.disabled = state;
	},

	/**
	 * Get the disabled flag.
	 *
	 * @return {Boolean}
	 */
	getDisabled: function () {
		return this.disabled;
	},

	/**
	 * Get the account object for the record.
	 *
	 * @return {Zarafa.plugins.files.data.AccountRecord} an IPM.FilesAccount record
	 */
	getAccount: function ()
	{
		// FixME : Create function called getAccountFromRecord in
		// Files context model.
		var accId = Zarafa.plugins.files.data.Utils.File.getAccountId(this.get('folder_id'));
		var store = container.getCurrentContext().getAccountsStore();

		// look up the account
		var account = store.getById(accId);

		return account;
	},

	/**
	 * Check selected record is folder record or not.
	 *
	 * @return {boolean} return true if selected record is
	 * folder record else false.
	 */
	isFolder : function ()
	{
		return this.get('type') === Zarafa.plugins.files.data.FileTypes.FOLDER;
	},

	/**
	 * Move the {@link Zarafa.plugins.files.data.FilesRecord record} to a different
	 * {@link Zarafa.plugins.files.data.FilesFolderRecord folder}.
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord} folder The folder to copy the record to
	 */
	moveTo : function(folder)
	{
		this.addMessageAction('action_type', 'move');
		this.addMessageAction('parent_entryid', folder.get('entryid'));
		this.addMessageAction('destination_folder_id', folder.get('folder_id'));
	}
});

Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_FILES');

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Files', Zarafa.plugins.files.data.FilesRecordFields);
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Files', Zarafa.plugins.files.data.FilesRecord);

Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_FILES, Zarafa.plugins.files.data.FilesRecordFields);
Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_FILES, Zarafa.plugins.files.data.FilesRecord);
