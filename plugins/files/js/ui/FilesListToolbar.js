Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.FilesListToolbar
 * @extends Ext.Toolbar
 * @xtype filesplugin.fileslisttoolbar
 *
 * The top toolbar for the files explorer.
 */
Zarafa.plugins.files.ui.FilesListToolbar = Ext.extend(
	Zarafa.core.ui.ContentPanelToolbar,
	{
		/**
		 * @cfg {Zarafa.plugins.files.FilesContext} context The context to which this toolbar belongs
		 */
		context: undefined,

		/**
		 * The {@link Zarafa.plugins.files.FilesContextModel} which is obtained from the {@link #context}.
		 * @property
		 * @type Zarafa.plugins.files.FilesContextModel
		 */
		model: undefined,

		/**
		 * @constructor
		 * @param config
		 */
		constructor: function (config) {
			config = config || {};

			if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
				this.model = config.context.getModel();
			}

			Ext.applyIf(config, {
				enableOverflow: true,
				items: this.createToolbarItems(),
			});
			Zarafa.plugins.files.ui.FilesListToolbar.superclass.constructor.call(
				this,
				config,
			);

			this.initEvent();
			this.onFolderChangeLoad(this.model, [this.model.getDefaultFolder()]);
		},

		/**
		 * Called after constructing files list toolbar.
		 */
		initEvent: function () {
			this.mon(this.model, {
				recordselectionchange: this.onRecordSelectionChange,
				folderchange: this.onFolderChangeLoad,
				scope: this,
			});

			const fileTypes = [
				{
					text: _('Document'),
					iconCls: 'plus',
					signatureId: false,
					handler: this.onCreateFile(this.model, '.docx'),
				},
				{
					text: _('Presentation'),
					iconCls: 'plus',
					signatureId: false,
					handler: this.onCreateFile(this.model, '.pptx'),
				},
				{
					text: _('Spreadsheet'),
					iconCls: 'plus',
					signatureId: false,
					handler: this.onCreateFile(this.model, '.xlsx'),
				},
			];

			// Create menu for the first time.
			// instance creation of menu will be handled by MenuMgr
			this.createFileButton.menu = Ext.menu.MenuMgr.get({
				xtype: 'menu',
				items: fileTypes,
			});
		},

		/**
		 * Create configuration object array which used to
		 * create toolbar items.
		 *
		 * @return {Array} configuration object array for toolbar.
		 */
		createToolbarItems: function () {
			return [
				{
					cls: 'files_icon_actionbutton',
					text: _('Upload'),
					ref: 'uploadButton',
					overflowText: _('Upload files'),
					iconCls: 'files_icon_action files_icon_action_upload',
					handler: this.onFileUpload,
					model: this.model,
					disabled: true,
					scope: this,
				},
				{
					xtype: 'button',
					text: _('Create document'),
					overflowText: _('Create document'),
					tooltip: _('Create office document'),
					iconCls: 'icon_new_note', // TODO: Change to proper icon
					ref: 'createFileButton',
					scope: this,
					disabled: false,
				},
				{
					cls: 'files_icon_actionbutton',
					text: _('New Folder'),
					ref: 'createFolderButton',
					disabled: true,
					overflowText: _('New Folder'),
					iconCls: 'files_icon_action files_icon_action_new_folder',
					handler: this.onCreateFolder,
					scope: this,
				},
				{
					ref: 'downloadBtn',
					cls: 'files_icon_actionbutton',
					text: _('Download'),
					overflowText: _('Download files'),
					iconCls: 'files_icon_action files_icon_action_download',
					handler: this.onFileDownload,
					disabled: true,
					scope: this,
				},
				{
					cls: 'files_icon_actionbutton',
					ref: 'shareBtn',
					text: _('Share'),
					overflowText: _('Share files'),
					iconCls: 'files_icon_action files_icon_action_share',
					handler: this.onFileShare,
					disabled: true,
					scope: this,
				},
				{
					cls: 'files_icon_actionbutton',
					ref: 'attachToMailBtn',
					text: _('Attach to mail'),
					overflowText: _('Attach to mail'),
					iconCls: 'files_icon_action files_icon_action_attach_to_mail',
					handler: this.onFileAddToMail,
					disabled: true,
					scope: this,
				},
				{
					cls: 'files_icon_actionbutton',
					ref: 'attachLinkToMailBtn',
					text: _('Attach to mail as link'),
					overflowText: _('Attach to mail as link'),
					iconCls: 'files_icon_action files_icon_action_attach_to_mail_link',
					handler: this.onFileLinkAddToMail,
					disabled: true,
					scope: this,
				},
				{
					xtype: 'tbfill',
				},
				{
					tooltip: _('Rename'),
					overflowText: _('Rename'),
					ref: 'renameBtn',
					iconCls: 'files_icon_action files_icon_action_edit',
					handler: this.onRename,
					nonEmptySelectOnly: true,
					disabled: true,
					scope: this,
				},
				{
					xtype: 'zarafa.toolbarbutton',
					tooltip: _('Delete'),
					ref: 'deleteBtn',
					overflowText: _('Delete'),
					iconCls: 'files_icon_action files_icon_action_delete',
					handler: this.onDelete,
					disabled: true,
					scope: this,
				},
			];
		},

		/**
		 * Event handler triggered when selection was changed in
		 * grid. it will disable/enable download, attach to mail,
		 * share and rename buttons in toolbar.
		 *
		 * @param {Zarafa.core.ContextModel} model this model.
		 * @param {Zarafa.plugins.files.data.FilesRecord[]} records The selected records
		 */
		onRecordSelectionChange: function (model, records) {
			var linkShareVisible = true;
			if (Ext.isArray(records)) {
				for (let i = 0; i < records.length; i++) {
					const sharedIds = records[i].get('sharedid');
					if (sharedIds.length === 0) {
						linkShareVisible = false;
					}
				}
			}

			var validator = Zarafa.plugins.files.data.Utils.Validator;
			var isVisible = validator.actionSelectionVisibilityFilter(
				records,
				false,
				true,
				false,
				true,
			);
			linkShareVisible =
				linkShareVisible &&
				validator.actionSelectionVisibilityFilter(
					records,
					false,
					false,
					false,
					true,
				);
			this.downloadBtn.setDisabled(!isVisible);
			this.attachToMailBtn.setDisabled(!isVisible);
			this.attachLinkToMailBtn.setDisabled(!linkShareVisible);

			isVisible = validator.actionSelectionVisibilityFilter(
				records,
				true,
				false,
				false,
				true,
			);
			if (isVisible) {
				this.shareBtn.setDisabled(!isVisible);
				var account = records[0].getAccount();
				this.shareBtn.setVisible(
					account.supportsFeature(
						Zarafa.plugins.files.data.AccountRecordFeature.SHARING,
					),
				);
			} else {
				this.shareBtn.setVisible(false);
			}
			this.renameBtn.setDisabled(!isVisible);
			this.deleteBtn.setDisabled(
				!validator.actionSelectionVisibilityFilter(
					records,
					false,
					false,
					false,
					true,
				),
			);
		},

		/**
		 * Event handler which is triggered when folder was changed.
		 * It will disable or enable the toolbar items.
		 *
		 * @param {Zarafa.plugins.files.FilesContextModel} model The {@link Zarafa.plugins.files.FilesContextModel FilesContextModel}
		 * @param {Zarafa.plugins.files.data.FilesRecord} records
		 * @param {Object} options
		 */
		onFolderChangeLoad: function (model, folders) {
			var folder = folders[0] || undefined;
			if (Ext.isEmpty(folder) || folder.get('folder_id') === '#R#') {
				this.setDisabled(true);
				this.shareBtn.setVisible(false);
			} else {
				this.createFolderButton.setDisabled(false);
				this.createFileButton.setDisabled(false);
				this.uploadButton.setDisabled(false);
			}
		},

		/**
		 * Event handler for creating a new file
		 */
		onCreateFile: function (model, filetype) {
			return function (button) {
				var hierarchyStore = model.getHierarchyStore();
				var folder = hierarchyStore.getFolder(model.getStore().getPath());
				Zarafa.plugins.files.data.Actions.createFile(
					model,
					undefined,
					folder,
					button,
					filetype,
				);
			};
		},

		/**
		 * Event handler for opening the "create new folder" dialog.
		 */
		onCreateFolder: function () {
			var model = this.model;
			var hierarchyStore = model.getHierarchyStore();
			var folder = hierarchyStore.getFolder(model.getStore().getPath());
			Zarafa.plugins.files.data.Actions.createFolder(model, undefined, folder);
		},

		/**
		 * Event handler for opening the Browser's file selection dialog.
		 *
		 * See {@link #onFileInputChange} for the handling of the selected files.
		 * @param {Ext.Button} button the button on which click event is performed.
		 * @param {Ext.EventObject} event The event object
		 * @private
		 */
		onFileUpload: function (button, event) {
			var uploadComponent = new Zarafa.plugins.files.ui.UploadComponent({
				callback: this.uploadCallback,
				multiple: true,
				scope: this,
			});

			uploadComponent.openUploadDialog();
		},

		/**
		 * Event handler for downloading the selected files.
		 * See {@link #onFileInputChange} for the handling of the selected files.
		 * @private
		 */
		onFileDownload: function () {
			var records = this.model.getSelectedRecords();
			Zarafa.plugins.files.data.Actions.downloadItem(records);
		},

		/**
		 * Event handler for sharing the selected files.
		 *
		 * See {@link #onFileInputChange} for the handling of the selected files.
		 * @param {Ext.Button} button the button on which click event is performed.
		 * @param {Ext.EventObject} event The event object
		 * @private
		 */
		onFileShare: function (button, event) {
			var records = this.model.getSelectedRecords();
			Zarafa.plugins.files.data.Actions.createShareDialog(records);
		},

		/**
		 * Event handler for attaching the selected files to a new mail record.
		 *
		 * See {@link #onFileInputChange} for the handling of the selected files.
		 * @param {Ext.Button} button the button on which click event is performed.
		 * @param {Ext.EventObject} event The event object
		 * @private
		 */
		onFileAddToMail: function (button, event) {
			var records = this.model.getSelectedRecords();

			var emailRecord = container
				.getContextByName('mail')
				.getModel()
				.createRecord();
			var idsList = [];
			var attachmentStore = emailRecord.getAttachmentStore();

			Ext.each(
				records,
				function (record) {
					idsList.push(record.get('folder_id'));
				},
				this,
			);

			container
				.getNotifier()
				.notify(
					'info.files',
					_('Attaching'),
					_('Creating email... Please wait!'),
				);

			try {
				container.getRequest().singleRequest(
					'filesbrowsermodule',
					'downloadtotmp',
					{
						ids: idsList,
						maxAttachmentSize: container
							.getServerConfig()
							.getMaxAttachmentSize(),
						dialog_attachments: attachmentStore.getId(),
					},
					new Zarafa.core.data.AbstractResponseHandler({
						doDownloadtotmp: this.attachToMail.createDelegate(
							this,
							[emailRecord],
							true,
						),
					}),
				);
			} catch (e) {
				Zarafa.plugins.files.data.Actions.msgWarning(e.message);
			}
		},

		/**
		 * Event handler for attaching the selected file as link to a new mail record.
		 *
		 * See {@link #onFileInputChange} for the handling of the selected files.
		 * @param {Ext.Button} button the button on which click event is performed.
		 * @param {Ext.EventObject} event The event object
		 * @private
		 */
		onFileLinkAddToMail: function (button, event) {
			var records = this.model.getSelectedRecords();
			var idsList = [];
			var emailRecord = container
				.getContextByName('mail')
				.getModel()
				.createRecord();

			Ext.each(
				records,
				function (record) {
					idsList.push(record.get('folder_id'));
				},
				this,
			);

			container
				.getNotifier()
				.notify(
					'info.files',
					_('Attaching'),
					_('Creating email... Please wait!'),
				);

			try {
				container.getRequest().singleRequest(
					'filesbrowsermodule',
					'loadsharingdetails',
					{
						records: idsList,
					},
					new Zarafa.plugins.files.backend.Default.data.ResponseHandler({
						successCallback: this.attachLinkToMail.createDelegate(
							this,
							[emailRecord],
							true,
						),
					}),
				);
			} catch (e) {
				Zarafa.plugins.files.data.Actions.msgWarning(e.message);
			}
		},

		/**
		 * Callback for the loadsharingdetails response. This function will initialize the UI with the given
		 * share records.
		 *
		 * @param {Object} response the response object from the share record request
		 * @private
		 */
		attachLinkToMail: function (response, emailRecord) {
			const signature = emailRecord.get('html_body');
			var shares = response.shares;
			// For each record
			const urls = Object.values(shares).map((share) => {
				// Get last share-link of record
				const arr = Object.values(share);
				const len = arr.length;
				if (len > 0) {
					return arr[len - 1].url;
				}
				return '';
			});
			var html = '<br>';
			urls.forEach((url) => {
				html += '<a href="' + url + '">' + url + '</a><br>';
			});
			html += signature;
			emailRecord.set('html_body', html);
			Zarafa.core.data.UIFactory.openCreateRecord(emailRecord);
		},

		/**
		 * The callback function of {@link Zarafa.plugins.files.ui.UploadComponent}
		 * which used to upload the attachment file on server.
		 *
		 * @param {Object/Array} files The files contains file information.
		 * @param {Object} form the form is contains {@link Ext.form.BasicForm bacisform} info.
		 */
		uploadCallback: function (files, form) {
			Zarafa.plugins.files.data.Actions.uploadAsyncItems(
				files,
				this.model.getStore(),
			);
		},

		/**
		 * This method will add the downloaded files to a new mail record.
		 *
		 * @param responseItems
		 * @param response
		 * @param emailRecord
		 */
		attachToMail: function (response, emailRecord) {
			Zarafa.plugins.files.data.Actions.openCreateMailContent(
				emailRecord,
				response.items,
			);
		},

		/**
		 * Event handler for renaming a selected file.
		 *
		 * See {@link #onFileInputChange} for the handling of the selected files.
		 * @param {Ext.Button} button the button on which click event is performed.
		 * @param {Ext.EventObject} event The event object
		 * @private
		 */
		onRename: function (button, event) {
			var records = this.model.getSelectedRecords();
			Zarafa.plugins.files.data.Actions.openRenameDialog(records[0]);
		},

		/**
		 * Event handler for deleting files and folders.
		 *
		 * See {@link #onFileInputChange} for the handling of the selected files.
		 * @param {Ext.Button} button the button on which click event is performed.
		 * @param {Ext.EventObject} event The event object
		 * @private
		 */
		onDelete: function (button, event) {
			var model = this.model;
			var records = model.getSelectedRecords();
			var folders = [];
			Ext.each(
				records,
				function (item) {
					folders.push(model.getHierarchyStore().getFolder(item.id));
				},
				this,
			);

			Zarafa.plugins.files.data.Actions.deleteRecords(records);
		},
	},
);

Ext.reg(
	'filesplugin.fileslisttoolbar',
	Zarafa.plugins.files.ui.FilesListToolbar,
);
