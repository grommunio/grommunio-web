Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.Actions
 * @singleton
 *
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 */
Zarafa.plugins.files.data.Actions = {

	/**
	 * The internal 'iframe' which is hidden from the user, which is used for downloading
	 * attachments. See {@link #doOpen}.
	 *
	 * @property
	 * @type Ext.Element
	 */
	downloadFrame: undefined,

	/**
	 * Converts received file information to attachment record.
	 *
	 * @param {Object} record
	 * @private
	 */
	convertDownloadedFileInfoToAttachmentRecord: function (record) {
		var attachmentRecord = Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH);

		attachmentRecord.set('tmpname', record.tmpname);
		attachmentRecord.set('name', record.name);
		attachmentRecord.set('size', record.size);
		return attachmentRecord;
	},

	/**
	 * Open a Panel in which a new {@link Zarafa.core.data.IPMRecord record} can be
	 * further edited.
	 *
	 * @param {Zarafa.core.data.IPMRecord} emailRecord The email record that will be edited.
	 * @param {Array} records Filerecords that will be added as attachments.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateMailContent: function (emailRecord, records, config) {
		var attachmentStore = emailRecord.getAttachmentStore();

		Ext.each(records, function (record) {
			var attachmentRecord = this.convertDownloadedFileInfoToAttachmentRecord(record);
			attachmentStore.add(attachmentRecord);
		}, this);

		Zarafa.core.data.UIFactory.openCreateRecord(emailRecord, config);
	},

	/**
	 * Open a Panel in which a new {@link Zarafa.core.data.IPMRecord record} can be
	 * further edited.
	 *
	 * @param {Zarafa.mail.MailContextModel} model Context Model object that will be used
	 * to {@link Zarafa.mail.MailContextModel#createRecord create} the E-Mail.
	 * @param {Zarafa.addressbook.AddressBookRecord} contacts One or more contact records.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateMailContentForContacts: function (model, contacts, config) {
		var emailRecord = container.getContextByName("mail").getModel().createRecord();

		Zarafa.core.data.UIFactory.openLayerComponent(Zarafa.core.data.SharedComponentType['zarafa.plugins.files.attachdialog'], undefined, {
			title      : String.format(_('Add attachment from {0}'), container.getSettingsModel().get('zarafa/v1/plugins/files/button_name')),
			emailrecord: emailRecord,
			manager    : Ext.WindowMgr
		});

		var recipientStore = emailRecord.getRecipientStore();
		var tasks = [];

		contacts = Ext.isArray(contacts) ? contacts : [contacts];
		for (var i = 0, len = contacts.length; i < len; i++) {
			var contact = contacts[i];

			if (contact.isOpened()) {

				var recipient = contact.convertToRecipient(Zarafa.core.mapi.RecipientType.MAPI_TO, true);
				recipientStore.add(recipient);
			} else {

				tasks.push({

					fn: function () {

						var contactRecord = contact;
						return function (panel, record, task, callback) {
							var fn = function (store, record) {
								if (record === contactRecord) {
									store.un('open', fn, task);
									var recipient = contactRecord.convertToRecipient(Zarafa.core.mapi.RecipientType.MAPI_TO, true);
									recipientStore.add(recipient);
									callback();
								}
							};

							contactRecord.getStore().on('open', fn, task);
							contactRecord.open();
						}

					}()
				});
			}
		}

		config = Ext.applyIf(config || {}, {
			recordComponentPluginConfig: {
				loadTasks: tasks
			}
		});

		Zarafa.core.data.UIFactory.openCreateRecord(emailRecord, config);
	},

	/**
	 * Create a new item...
	 *
	 * @param {Zarafa.plugins.files.context.FilesContextModel} model Context Model.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateFilesContent: function (model, config) {
		var record = model.createRecord();
		Zarafa.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Function is used to delete files or folders.
	 *
	 * @param {Array} records
	 */
	deleteRecords: function (records) {
		var allowDelete = true;
		var folderCount = 0;
		var fileCount = 0;
		var firstFileName, firstFolderName;

		Ext.each(records, function (record) {
			if (record.get('folder_id') === (container.getSettingsModel().get('zarafa/v1/contexts/files/files_path') + "/") || record.get('filename') === "..") {
				allowDelete = false;
			}
			if (record.get('object_type') === Zarafa.plugins.files.data.FileTypes.FOLDER) {
				folderCount += 1;
				if (!firstFolderName) {
					firstFolderName = record.get('filename');
				}
			} else if (record.get('object_type') === Zarafa.plugins.files.data.FileTypes.FILE) {
				fileCount += 1;
				if (!firstFileName) {
					firstFileName = record.get('filename');
				}
			}
		}, this);

		var askOnDelete = container.getSettingsModel().get('zarafa/v1/contexts/files/ask_before_delete');

		if (allowDelete) {
			if (askOnDelete) {
				Ext.MessageBox.confirm(_('Confirm deletion'),
					this.createDeletionMessage(fileCount, firstFileName, folderCount, firstFolderName),
					function (button) {
						if (button === 'yes') {
							this.doDelete(records);
						}
					}, this);
			} else {
				this.doDelete(records);
			}
		}
	},

	/**
	 * Create a proper message for the confirm deletion message box
	 * @param {Integer} fileCount number of files to delete
	 * @param {String} fileName name of the file to be deleted
	 * @param {Integer} folderCount number of folders to delete
	 * @param {String} folderName name of the folder to be deleted
	 * @return {String} the string to be shown in the delete confirmation dialog
	 */
	createDeletionMessage: function(fileCount, fileName, folderCount, folderName) {
		//single file
		if (fileCount === 1 && folderCount === 0) {
			return String.format(_('Are you sure you want to delete {0}?'), fileName);
		}
		//single folder
		if (fileCount === 0 && folderCount === 1) {
			 return String.format(_('Are you sure you want to delete {0} and all of its contents?'), folderName);
		}
		//multiple files
		if (fileCount >= 1 && folderCount === 0) {
			 return String.format(_('Are you sure you want to delete {0} files?'), fileCount);
		}
		//multiple folders
		if (fileCount === 0 && folderCount >= 1) {
			return String.format(_('Are you sure want to delete {0} folders and all of their contents?'), folderCount);
		}
		//multiple files and folders
		if (fileCount !== 0 && folderCount !== 0) {
			return _('Are you sure want to delete the selected items and all of their contents?');
		}
	},

	/**
	 * Delete the selected files.
	 *
	 * @param {Zarafa.plugins.files.data.FilesRecord[]} records The records that must be deleted.
	 * @private
	 */
	doDelete: function (records)
	{
		if (!Array.isArray(records)) {
			records = [records];
		}

		var store = records[0].getStore();
		store.remove(records);
		store.save(records);
	},

	/**
	 * Create the sharing dialog.
	 *
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 * @param {Array} records Selected filerecords
	 */
	createShareDialog: function (records, config) {
		config = Ext.applyIf(config || {}, {
			modal  : true,
			records: records
		});

		var componentType = Zarafa.core.data.SharedComponentType['zarafa.plugins.files.sharedialog'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Create a new Folder in {@link Zarafa.core.data.IPMRecord node}.
	 *
	 * @param {Zarafa.plugins.files.context.FilesContextModel} model Context Model.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord} folder The destination folder in which the new folder will be created.
	 */
	createFolder: function (model, config, folder) {

		config = Ext.applyIf(config || {}, {
			accountFilter: folder.getFilesStore().get('entryid'),
			parentFolder: folder,
			model: model,
			manager: Ext.WindowMgr
		});

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER, {
			"object_type": Zarafa.plugins.files.data.FileTypes.FOLDER
		});

		var componentType = Zarafa.core.data.SharedComponentType['zarafa.plugins.files.createfolderdialog'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Callback for the {@link Zarafa.plugins.files.data.FilesRecordStore#load} event.
	 * This function will refresh the view of the main panel.
	 */
	doRefreshIconView: function () {
		if (Zarafa.plugins.files.data.ComponentBox.getContext().getCurrentView() === Zarafa.plugins.files.data.Views.ICON) {
			Zarafa.plugins.files.data.ComponentBox.getItemsView().refresh();
		}
	},

	/**
	 * Move specified records to the new folder.
	 *
	 * @param {Array} records array of records
	 * @param {Object} destination record or treenode
	 * @param {Boolean} overwrite boolean flag - if true, existing dst records will be overwritten, default: true
	 */
	moveRecords: function (records, destination, options)
	{
		if (!Ext.isDefined(destination.data)) {
			var parent = destination.parentNode;
			destination = Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(Zarafa.core.mapi.ObjectType.ZARAFA_FILES, {
				id            : destination.id,
				entryid       : destination.id,
				parent_entryid: Ext.isDefined(parent) ? parent.id : "/"
			}, destination.id);
		}

		var isExists = this.isRecordExistsAlready(options.hierarchyStore, records, destination);
		if (isExists) {
			// TODO: Show conflicted folder/file names.
			Ext.MessageBox.confirm(
				_('Confirm overwrite'),
				_('File already exists. Do you want to overwrite it?'),
				function (button) {
					this.doMoveRecords(records, destination, button);
				},
				this
			);
		} else {
			this.doMoveRecords(records, destination);
		}
	},

	/**
	 * Helper function which used to check folder is already exists in destination folder.
	 *
	 * @param {Zarafa.plugins.files.data.FilesHierarchyStore} hierarchyStore the hierarchy store.
	 * @param {Ext.data.Record} records The records which needs to move.
	 * @param {Ext.data.Record} destination The destination folder where records going to move.
	 * @returns {boolean}
	 */
	isRecordExistsAlready : function(hierarchyStore, records, destination)
	{
		if (!Array.isArray(records)) {
			records = [records];
		}

		var folderNames = records.map(function (record) {
			return record.get('display_name')
		});

		var folder = hierarchyStore.getFolder(destination.id);
		var childFolder = folder.getChildren();
		return childFolder.some(function (folder) {
			return folderNames.indexOf(folder.get('display_name')) !== -1;
		},this);
	},

	/**
	 * This function will actually move the given files to a new destination.
	 *
	 * @param {Array} files Array of records
	 * @param {Object} destination Destination folder
	 * @param {String} overwrite It will be "yes" to overwrite files, false otherwise.
	 * @private
	 */
	doMoveRecords: function (files, destination, overwrite) {
		var store = files[0].getStore();
		if(!Ext.isDefined(overwrite) || overwrite === 'yes' ) {
			Ext.each(files, function (record) {
				record.beginEdit();
				record.moveTo(destination);
				record.set("deleted", true);
				record.addMessageAction('overwrite', Ext.isDefined(overwrite) ? overwrite : 'no');
				record.addMessageAction('isFolder', record.get('type') === Zarafa.plugins.files.data.FileTypes.FOLDER);
				record.dirty = true;
				record.endEdit();
				record.save();
			});
			store.filter("deleted", false);
		} else {
			store.reload();
		}

		if (Zarafa.plugins.files.data.ComponentBox.getContext().getCurrentView() === Zarafa.plugins.files.data.Views.ICON) {
			Zarafa.plugins.files.data.ComponentBox.getItemsView().refresh();
		}
	},

	/**
	 * Open a rename dialog and rename the item
	 *
	 * @param {Zarafa.plugins.files.data.FilesRecord} record
	 */
	openRenameDialog: function (record) {
		Ext.MessageBox.prompt(
			_('Rename'),
			_('Please enter a new name'),
			this.doCheckRenameDuplicate.createDelegate(this, [record], true),
			this,
			false,
			record.get('filename'));
	},

	/**
	 * Check if the new name already exists
	 *
	 * @param {String} button The value of the button
	 * @param {String} text Inputfield value, new name
	 * @param {Object} options Unused
	 * @param {Zarafa.plugins.files.data.FilesRecord} record
	 * @private
	 */
	doCheckRenameDuplicate: function (button, text, options, record) {
		if (button === "ok") {
			// Show alert message box if new name of file is empty.
			if (Ext.isEmpty(text)) {
				Ext.Msg.alert(
					_('Rename record'),
					_('A file name should not be empty.'),
					function (button) {
						this.openRenameDialog(record);
					},
					this
				);
				return;
			}

			var store = record.getStore();
			var index = 0;
			if (store instanceof Zarafa.plugins.files.data.FilesFoldersSubStore) {
				var parentFolder = record.getParentFolder();
				index = parentFolder.getChildren().findIndex(function(item) {
					return item.get('filename') === text;
				});
			} else {
				index = store.findExact("filename", text);
			}

			if (index > -1) {
				Ext.Msg.alert(
					_('Rename item'),
					String.format(_('A file named \"{0}\" already exists. Please enter a different name.'), text),
					function () {
						this.openRenameDialog(record);
					},
					this
				);
			} else {
				this.doRename(text, record);
			}
		}
	},

	/**
	 * Rename a record on the server
	 *
	 * @param {String} text Inputfield value, new name
	 * @param {Zarafa.plugins.files.data.FilesRecord} record
	 * @private
	 */
	doRename: function (text, record)
	{
		var path = record.get('path');
		record.addMessageAction("source_folder_id", record.get('folder_id'));
		record.addMessageAction("isFolder", record.isFolder());
		record.beginEdit();
		record.set("display_name", text);
		record.set("filename", text);
		record.set("text", text);
		record.set('folder_id', path + text + "/");
		record.endEdit();
		record.save()
	},

	/**
	 * Download the selected items from files.
	 *
	 * @param {Array} records An array of ids
	 */
	downloadItem: function (records)
	{
		if (!Array.isArray(records)) {
			records = [records];
		}

		var downloadFrame = Ext.getBody().createChild({
			tag: 'iframe',
			cls: 'x-hidden'
		});

		if (records.length == 1) {
			var url = this.getDownloadLink(records[0], false);
			downloadFrame.dom.contentWindow.location = url;
		} else if (records.length > 1) {
			var url = this.getDownloadLinkForMultipleFiles(records, false);
			downloadFrame.dom.contentWindow.location = url;
		}
		container.getNotifier().notify('info.files', _('Downloading'), _('Download started... please wait!'));
	},

	/**
	 * Upload the given files to the files backend. This method will use the async XMLHttpRequest to
	 * upload the files to the server.
	 *
	 * @param {Array} files An array of files
	 * @param {Zarafa.plugins.files.data.FilesRecordStore} store which
	 * contains {@link Zarafa.plugins.files.data.FilesRecord FilesRecord}
	 * @param {string} destination The destination folder id where file gets uploaded.
	 */
	uploadAsyncItems: function (files, store, destination) {
		if (!Ext.isDefined(destination)) {
			destination = store.folderId;
		}

		var fileStore = store;
		// build the ids:
		var ids = [];
		var fileTooLarge = false;

		Ext.each(files, function (file) {
			if (file.size > Zarafa.plugins.files.data.Utils.Core.getMaxUploadFilesize()) {
				fileTooLarge = true;
			}
			var id = destination + file.name;
			ids.push({
				id      : id,
				isFolder: false
			});
		});

		if (fileTooLarge) {
			Zarafa.common.dialogs.MessageBox.show({
				title  : _('Upload'),
				msg    : String.format(_('At least one file is too large! Maximum allowed filesize: {0}.'), Zarafa.plugins.files.data.Utils.Format.fileSize(Zarafa.plugins.files.data.Utils.Core.getMaxUploadFilesize())),
				icon   : Zarafa.common.dialogs.MessageBox.ERROR,
				buttons: Zarafa.common.dialogs.MessageBox.OK
			});
		} else {
			// check for duplicates
			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'checkifexists',
				{
					records    : ids,
					destination: destination
				},

				new Zarafa.core.data.AbstractResponseHandler({
					doCheckifexists:  this.checkForExistingFilesDone.createDelegate(this, [files, destination, fileStore, this.doAsyncUpload], true)
				})
			);
		}
	},

	/**
	 * Actually uploads all the files to the server.
	 *
	 * @param {Zarafa.common.dialogs.MessageBox.addCustomButtons} button
	 * @param {Array} files An array of files
	 * @param {string} destination The destination folder id where file gets uploaded.
	 * @param {Zarafa.plugins.files.data.FilesRecordStore} store which contains {@link Zarafa.plugins.files.data.FilesRecord FilesRecord}
	 */
	doAsyncUpload: function (button, files, destination, store) {
		if (button === "overwrite" || button === "keepboth") {
			var componentType = Zarafa.core.data.SharedComponentType['zarafa.plugins.files.uploadstatusdialog'];
			Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, {
				files : files,
				destination : destination,
				keepBoth : button === "keepboth",
				manager : Ext.WindowMgr,
				store : store,
				callbackAllDone : this.uploadDone.bind(this)
			});
		}
	},

	/**
	 * Callback if the upload has completed.
	 *
	 * @param {Array} files An array of files
	 * @param {string} destination The destination folder id where file gets uploaded.
	 * @param {Zarafa.plugins.files.data.FilesRecordStore} store which contains {@link Zarafa.plugins.files.data.FilesRecord FilesRecord}
	 */
	uploadDone: function (files, destination, store)
	{
		this.updateCache(destination);
		if (store.folderId === destination) {
			store.reload();
		}
	},

	/**
	 * This function is called after the {@Zarafa.plugins.files.data.FilesStore} has loaded the target folder.
	 * It will check if one of the selected files already exists in the store. If there is a duplicate file
	 * a warning will be shown.
	 *
	 * @param {Object} response
	 * @param {File[]} files The files that should be uploaded
	 * @param {string} destination record id
 	 * @param {Zarafa.plugins.files.data.FilesRecordStore} store which contains
	 * {@link Zarafa.plugins.files.data.FilesRecord FilesRecord}
	 * @param {Function} callback function which triggers {@link #doAsyncUpload} function.
	 * @private
	 */
	checkForExistingFilesDone: function (response, files, destination, store, callback) {
		if (response.duplicate === true) {
			Zarafa.common.dialogs.MessageBox.addCustomButtons({
				title : _('Confirm overwrite'),
				icon: Ext.MessageBox.QUESTION,
				msg : _('File already exists. Do you want to overwrite it?'),
				fn : callback.createDelegate(this, [files, destination, store], true),
				customButton : [{
					text :  _('Keep both'),
					name : 'keepboth'
				}, {
					text :  _('Overwrite'),
					name : 'overwrite'
				}, {
					text :  _('Cancel'),
					name : 'cancel'
				}],
				scope : this
			});
		} else {
			callback.createDelegate(this, ["overwrite", files, destination, store])();
		}
	},

	/**
	 * Returns a download link for the client.
	 *
	 * @param {Zarafa.plugins.files.data.FilesRecord} record a file record
	 * @param {Boolean} inline (optional)
	 * @return {String}
	 */
	getDownloadLink: function (record, inline) {
		return (Ext.isDefined(inline) && inline == false) ? record.getAttachmentUrl() : record.getInlineImageUrl();
	},

	/**
	 * Returns a download link for the client to download multiple items.
	 *
	 * @param {Array} records a array of {Zarafa.plugins.files.data.FilesRecord}
	 * @return {String}
	 */
	getDownloadLinkForMultipleFiles: function (records) {
		var link = "";

		var url = document.URL;
		link = url.substring(0, url.lastIndexOf('/') + 1);

		link += "index.php?load=custom&name=download_file";
		Ext.each(records, function (record, index) {
			link = Ext.urlAppend(link, "ids[" + index + "]=" + encodeURIComponent(record.get("folder_id")));
		});

		link = Ext.urlAppend(link, "inline=false");

		return link;
	},

	/**
	 * This will display a messagebox with warning icons to the user.
	 *
	 * @param {String} errorMessage The error message to display
	 */
	msgWarning: function (errorMessage) {
		Zarafa.common.dialogs.MessageBox.show({
			title  : _('Warning'),
			msg    : errorMessage,
			icon   : Zarafa.common.dialogs.MessageBox.WARNING,
			buttons: Zarafa.common.dialogs.MessageBox.OK
		});
	},

	/**
	 * Event handler called when the "use Zarafa credentials" checkbox has been modified
	 *
	 * @param {Ext.form.CheckBox} checkbox Checkbox element from which the event originated
	 * @param {Boolean} checked State of the checkbox
	 * @private
	 */
	onCheckCredentials: function (checkbox, checked) {
		if (checked) {
			this.usernameField.hide();
			this.usernameField.setValue("");
			this.usernameField.label.hide();
			this.usernameField.allowBlank = true;
                        this.usernameField.validate();
			this.passwordField.hide();
			this.passwordField.setValue("");
			this.passwordField.label.hide();
			this.passwordField.allowBlank = true;
                        this.passwordField.validate()
		} else {
			this.usernameField.show();
			this.usernameField.label.show();
			this.usernameField.allowBlank = false;
                        this.usernameField.validate();
			this.passwordField.show();
			this.passwordField.label.show();
			this.passwordField.allowBlank = false;
                        this.passwordField.validate()
		}
	},

	/**
	 * Event handler called when the "use ssl connection" checkbox has been modified.
	 * If checked and the server port is 80, switch it to 443, else if the port is unchecked
	 * and the port is not 80, change it to the default.
	 *
	 * @param {Ext.form.CheckBox} checkbox Checkbox element from which the event originated
	 * @param {Boolean} checked State of the checkbox
	 */
	onCheckSSL: function (checkbox, checked) {
		if (checked && this.portField.getValue() === "80") {
			this.portField.setValue("443");
		} else if (!checked && this.portField.getValue() === "443") {
			this.portField.setValue("80");
		}
	},

	/**
	 * Updates the cache for given record
	 *
	 * @param destination record id.
	 */
	updateCache: function (destination)
	{
		container.getRequest().singleRequest(
			'filesbrowsermodule',
			'updatecache',
			{
				id: destination
			}
		);
	},

	/**
	 * Open the folder. This will check if the user has rights to open
	 * the given folder, and will call {@link Zarafa.core.Container#selectFolder}
	 * if that is the case. Otherwise if this is a shared store, it will ask
	 * if the store can be closed.
	 *
	 * @param {Zarafa.plugins.files.FilesContextModel} model The {Zarafa.plugins.files.FilesContextModel FilesContextModel}.
	 * @param {String} entryId The entryId is id of folder which is going to open.
	 */
	openFolder : function(model, entryId)
	{
		var folder = model.getHierarchyStore().getFolder(entryId);
		if (Ext.isDefined(folder)) {
			container.selectFolder(folder);
		}
	},

	/**
	 * Function which open the {@link Zarafa.plugins.files.ui.dialogs.SaveToFilesContentPanel SaveToFilesContentPanel}
	 * in dialog.
	 *
	 * @param {Zarafa.plugins.files.FilesContextModel} model The model is {@link Zarafa.plugins.files.FilesContextModel FilesContextModel}.
	 * @param {Object} config The configuration object which used to open {@link Zarafa.plugins.files.ui.dialogs.SaveToFilesContentPanel SaveToFilesContentPanel}.
	 */
	openSaveToFilesDialog : function (model, config)
	{
		config = Ext.applyIf(config||{}, {
			model : model,
			modal : true
		});

		var component = Zarafa.core.data.SharedComponentType['common.dialog.attachments.savetofiles'];
		Zarafa.core.data.UIFactory.openLayerComponent(component, undefined, config);
	}
};
