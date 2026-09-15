/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.FilesRecordFields
 *
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Files' type messages.
 */
Grommunio.plugins.files.data.FilesRecordFields = [
	// FIXME : try to remove this id proper.
	{name: 'id', mapping:"entryid"},
	{name: 'folder_id'},
	{name: 'fileid'},
	{name: 'path'},
	{name: 'type', type: 'int', defaultValue: Grommunio.plugins.files.data.FileTypes.FOLDER},
	{name: 'filename'},
	{name: 'display_name', mapping: 'filename'},
	{name: 'isshared', type: 'boolean', defaultValue: false},
	{name: 'sharedid'},
	{name: 'lastmodified', type: 'int', defaultValue: null},
	{name: 'message_size', type: 'int', defaultValue: 0},
	{name: 'deleted', type: 'boolean', defaultValue: false},
];

/**
 * @class Grommunio.plugins.files.data.FilesRecord
 * @extends Grommunio.core.data.IPMRecord
 */
Grommunio.plugins.files.data.FilesRecord = Ext.extend(Grommunio.core.data.IPMRecord, {

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
	 * Applies all data from an {@link Grommunio.plugins.files.data.FilesRecord FilesRecord}
	 * to this instance. This will update all data.
	 *
	 * @param {Grommunio.plugins.files.data.FilesRecord} record The record to apply to this
	 * @return {Grommunio.plugins.files.data.FilesRecord} this
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
	 * it uses {@link Grommunio.core.data.IPMRecord IPMRecord} to get store and message entryids.
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
	 * it uses {@link Grommunio.core.data.IPMRecord IPMRecord} to get store and message entryids.
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
	 * Get the file id.
	 *
	 * @return {Boolean}
	 */
	getFileid: function () {
		return this.get('fileid') || "-1";
	},

	/**
	 * Get the account object for the record.
	 *
	 * @return {Grommunio.plugins.files.data.AccountRecord} an IPM.FilesAccount record
	 */
	getAccount: function ()
	{
		// FixME : Create function called getAccountFromRecord in
		// Files context model.
		var accId = Grommunio.plugins.files.data.Utils.File.getAccountId(this.get('folder_id'));
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
		return this.get('type') === Grommunio.plugins.files.data.FileTypes.FOLDER;
	},

	/**
	 * Move the {@link Grommunio.plugins.files.data.FilesRecord record} to a different
	 * {@link Grommunio.plugins.files.data.FilesFolderRecord folder}.
	 * @param {Grommunio.plugins.files.data.FilesFolderRecord} folder The folder to copy the record to
	 */
	moveTo : function(folder)
	{
		this.addMessageAction('action_type', 'move');
		this.addMessageAction('parent_entryid', folder.get('entryid'));
		this.addMessageAction('destination_folder_id', folder.get('folder_id'));
	}
});

Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_FILES');

Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.Files', Grommunio.plugins.files.data.FilesRecordFields);
Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Files', Grommunio.plugins.files.data.FilesRecord);

Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_FILES, Grommunio.plugins.files.data.FilesRecordFields);
Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_FILES, Grommunio.plugins.files.data.FilesRecord);
