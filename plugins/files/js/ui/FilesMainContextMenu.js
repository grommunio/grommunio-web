Ext.namespace('Zarafa.plugins.files.ui');

Zarafa.plugins.files.ui.FilesMainContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {

	/**
	 * @cfg {Zarafa.plugins.files.FilesContext} context The context to which this context menu belongs.
	 */
	context : undefined,
	model : null,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			items: [
				this.createContextActionItems(config.context.model),
				{xtype: 'menuseparator'},
				container.populateInsertionPoint('plugin.files.contextmenu.actions', this),
				{xtype: 'menuseparator'},
				container.populateInsertionPoint('plugin.files.contextmenu.options', this)
			]
		});

		this.model = config.context.model;

		Zarafa.plugins.files.ui.FilesMainContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create a context menu items.
	 *
	 * @return {Array} return an array which contains the configuration objects for
	 * context menu.
	 * 
	 * @param model
	 */
	createContextActionItems: function (model) {
		return [{
			xtype     : 'zarafa.conditionalitem',
			text      : _('Download'),
			iconCls   : 'files_icon_action files_icon_action_download',
			handler   : this.onContextItemDownload,
			beforeShow: function (item, records) {
				var visible = Zarafa.plugins.files.data.Utils.Validator.actionSelectionVisibilityFilter(records, false, true, false, false);

				item.setVisible(visible);
			},
			scope     : this
		}, {
			xtype     : 'zarafa.conditionalitem',
			text      : _('Share'),
			iconCls   : 'files_icon_action files_icon_action_share',
			handler   : this.onContextItemShare,
			beforeShow: function (item, records) {
				var visible = false;
				var isShared = false;
				if (records.length > 0) {
					var account = records[0].getAccount();
					isShared = records[0].get("isshared");
					visible = account.supportsFeature(Zarafa.plugins.files.data.AccountRecordFeature.SHARING);
				}

				visible = visible && Zarafa.plugins.files.data.Utils.Validator.actionSelectionVisibilityFilter(records, true, false, false, true);

				item.setVisible(visible);

				if (isShared == true) {
					item.setText(_('Edit share'));
				}
			},
			scope     : this
		}, {
			xtype     : 'zarafa.conditionalitem',
			text      : _('New Folder'),
			iconCls   : 'files_icon_action files_icon_action_new_folder',
			handler   : this.onContextItemNewFolder,
			beforeShow: function (item, records) {
				item.setVisible(Zarafa.plugins.files.data.Utils.Validator.actionSelectionVisibilityFilter(records, true, false, true, true));
			},
			model     : model,
			scope     : this
		}, {
			xtype     : 'zarafa.conditionalitem',
			text      : _('Attach to mail'),
			iconCls   : 'files_icon_action files_icon_action_attach_to_mail',
			handler   : this.onContextItemAttach,
			beforeShow: function (item, records) {
				var visible = Zarafa.plugins.files.data.Utils.Validator.actionSelectionVisibilityFilter(records, false, true, false, true);
				var max_attachment_size = container.getServerConfig().getMaxAttachmentSize();

				for (var i = 0; i < records.length; i++) {
					var record = records[i];
					if (record.get('message_size') > max_attachment_size) {
						visible = false;
						break;
					}
				}

				item.setVisible(visible);
			},
			scope     : this
		},  {
			xtype : 'zarafa.conditionalitem',
			cls : 'files_icon_actionbutton',
			text : _('Attach to mail as link'),
			iconCls : 'files_icon_action files_icon_action_attach_to_mail',
			handler : this.onFileLinkAddToMail,
			scope : this,
			beforeShow: function (item, records) {
				
				var visible = Zarafa.plugins.files.data.Utils.Validator.actionSelectionVisibilityFilter(records, false, false, false, true);

				if (Ext.isArray(records)) {
					for(let i = 0; i < records.length; i++) {
						const sharedIds = records[i].get('sharedid');
						if(sharedIds.length === 0) {
							visible = false;
						}
					}
				}

				item.setVisible(visible);
			}
		},{
			xtype     : 'zarafa.conditionalitem',
			text      : _('Rename'),
			iconCls   : 'files_icon_action files_icon_action_edit',
			handler   : this.onContextItemRename,
			beforeShow: function (item, records) {
				item.setVisible(Zarafa.plugins.files.data.Utils.Validator.actionSelectionVisibilityFilter(records, true, false, false, true));
			},
			scope     : this
		}, {
			xtype     : 'zarafa.conditionalitem',
			text      : _('Delete'),
			iconCls   : 'files_icon_action files_icon_action_delete',
			handler   : this.onContextItemDelete,
			beforeShow: function (item, records) {
				item.setVisible(Zarafa.plugins.files.data.Utils.Validator.actionSelectionVisibilityFilter(records, false, false, false));
			},
			scope     : this
		}, {
			xtype : 'zarafa.conditionalitem',
			text : _('Info'),
			iconCls : 'icon_info',
			handler : this.onContextItemInfo,
			beforeShow: function (item, records) {
				var visibilityFilter = Zarafa.plugins.files.data.Utils.Validator.actionSelectionVisibilityFilter(records, true, false, false, true);
				var noPreviewPanel = this.context.getCurrentViewMode() === Zarafa.plugins.files.data.ViewModes.NO_PREVIEW;
				item.setDisabled(!visibilityFilter || !noPreviewPanel);
			},
			scope : this
		}];
	},

	/**
	 * Handler called when 'Download' context menu item is pressed.
	 */
	onContextItemDownload : function ()
	{
		Zarafa.plugins.files.data.Actions.downloadItem(this.records);
	},

	/**
	 * Handler called when 'Delete' context menu item is pressed.
	 */
	onContextItemDelete: function ()
	{
		Zarafa.plugins.files.data.Actions.deleteRecords(this.records);
	},

	/**
	 * Handler called when 'share' context menu item is pressed.
	 */
	onContextItemShare: function ()
	{
		Zarafa.plugins.files.data.Actions.createShareDialog(this.records);
	},

	/**
	 * Event handler for opening the "create new folder" dialog.
	 *
	 * @param button
	 */
	onContextItemNewFolder: function (button)
	{
		var model = button.model;
		var hierarchyStore = model.getHierarchyStore();
		var folder = hierarchyStore.getFolder(this.records[0].get('entryid'));
		Zarafa.plugins.files.data.Actions.createFolder(model, undefined, folder);
	},

	/**
	 * Handler called when 'Info' context menu item is pressed.
	 * It will open the {@link Zarafa.plugins.files.ui.dialogs.FilesRecordContentPanel FilesRecordContentPanel}.
	 */
	onContextItemInfo: function ()
	{
		var count = this.records.length;
		var record = undefined;

		if (count == 1) {
			record = this.records[0];
		}

		var config = Ext.applyIf({}, {
			modal : true,
			record: record
		});

		var componentType = Zarafa.core.data.SharedComponentType['zarafa.plugins.files.fileinfopanel'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Handler called when 'Rename' context menu item is pressed.
	 */
	onContextItemRename: function () {
		Zarafa.plugins.files.data.Actions.openRenameDialog(this.records[0]);
	},

	/**
	 * Handler called when 'Attach to mail' context menu item is pressed.
	 * It will create new mail with selected file(s) as an attachment.
	 */
	onContextItemAttach: function () {
		var emailRecord = container.getContextByName("mail").getModel().createRecord();
		var idsList = [];
		var attachmentStore = emailRecord.getAttachmentStore();

		Ext.each(this.records, function (record) {
			idsList.push(record.get('folder_id'));
		}, this);

		container.getNotifier().notify('info.files', _('Attaching'), _('Creating email... Please wait!'));

		try {
			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'downloadtotmp',
				{
					ids               : idsList,
					maxAttachmentSize : container.getServerConfig().getMaxAttachmentSize(),
					dialog_attachments: attachmentStore.getId()
				},
				new Zarafa.core.data.AbstractResponseHandler({
					doDownloadtotmp: this.attachToMail.createDelegate(this, [emailRecord], true)
				})
			);
		} catch (e) {
			Zarafa.plugins.files.data.Actions.msgWarning(e.message);
		}
	},

	/**
	 * Open newly created mail record into tab panel.
	 *
	 * @param {Array} responseItems The File records that will be added as attachments.
	 * @param {Object} response The response object belonging to the given command.
	 * @param {Zarafa.core.data.IPMRecord} emailRecord The mail record which contains files records
	 * as an attachments.
	 */
	attachToMail: function (response, emailRecord)
	{
		Zarafa.plugins.files.data.Actions.openCreateMailContent(emailRecord, response.items);
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
		var emailRecord = container.getContextByName("mail").getModel().createRecord();

		Ext.each(records, function (record) {
			idsList.push(record.get('folder_id'));
		}, this);

		container.getNotifier().notify('info.files', _('Attaching'), _('Creating email... Please wait!'));

		try {
			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'loadsharingdetails',
				{
					records: idsList
				},
				new Zarafa.plugins.files.backend.Owncloud.data.ResponseHandler({
					successCallback: this.attachLinkToMail.createDelegate(this, [emailRecord], true)
				})
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
			if(len > 0) {
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
	}
});

Ext.reg('filesplugin.filesmaincontextmenu', Zarafa.plugins.files.ui.FilesMainContextMenu);
