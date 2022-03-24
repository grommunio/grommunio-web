Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.AttachFromFilesTreePanel
 * @extends Ext.Panel
 * @xtype filesplugin.attachfromfilespanel
 *
 * This dialog panel will provide the filechooser tree.
 */
Zarafa.plugins.files.ui.dialogs.AttachFromFilesPanel = Ext.extend(Ext.Panel, {

	/**
	 * @var {Zarafa.core.data.IPMRecord} emailRecord
	 */
	emailRecord: undefined,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		if (Ext.isDefined(config.emailrecord)) {
			this.emailRecord = config.emailrecord;
		}

		config = Ext.applyIf(config, {
			xtype : 'filesplugin.attachfromfilespanel',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			border: false,
			header: false,
			items : [{
				xtype : 'filesplugin.tree',
				model : config.model,
				border : true,
				flex : 1,
				ref : 'hierarchyTree'
			}, {
				xtype : 'filesplugin.attachfromfilesgridpanel',
				ref : 'attachGrid',
				flex : 2
			}],
			buttonAlign: 'right',
			buttons: this.createActionButtons()
		});

		Zarafa.plugins.files.ui.dialogs.AttachFromFilesPanel.superclass.constructor.call(this, config);
		if (Ext.isDefined(this.model)) {
			this.mon(this.hierarchyTree, 'click', this.onTreeNodeClick, this);
		}
	},

	/**
	 * Called when a treeNode is click in tree. The corresponding folder is added to,
	 * or removed from the active folder list depending on the state of the check box.
	 * @param {Ext.tree.TreeNode} treeNode tree node.
	 * @private
	 */
	onTreeNodeClick : function(treeNode)
	{
		var folder = treeNode.getFolder();
		this.attachGrid.store.load({
			params: {
				only_files : true
			},
			folder : folder });
	},

	/**
	 * Genereate the toolbar buttons.
	 *
	 * @returns {Object}
	 */
	createActionButtons: function () {
		return [{
			xtype  : 'button',
			text   : dgettext('plugin_files', 'Add attachment'),
			iconCls: 'icon_files_category_white',
			handler: this.downloadSelectedFilesFromFilesToTmp,
			scope  : this
		},{
			text   : dgettext('plugin_files', 'Cancel'),
			handler: this.onClickCancel,
			scope: this
		}];
	},

	/**
	 * Event handler which is triggered when the user presses the cancel
	 * {@link Ext.Button button}. This will close this dialog.
	 * @private
	 */
	onClickCancel : function()
	{
		this.dialog.close();
	},

	/**
	 * Start to download the files to a temporary folder on the backend.
	 */
	downloadSelectedFilesFromFilesToTmp: function () {
		var selectedNodes = this.attachGrid.getSelectionModel().getSelections();
		var idsList = [];
		var emailRecord = this.dialog.record;

		if (Ext.isDefined(this.emailRecord)) {
			emailRecord = this.emailRecord;
		}

		var attachmentStore = emailRecord.getAttachmentStore();
		var server = container.getServerConfig();
		var max_attachment_size = server.getMaxAttachmentSize();
		var size_exceeded = false;

		Ext.each(selectedNodes, function (node, index) {
			if (node.get('message_size') > max_attachment_size) {
				Zarafa.common.dialogs.MessageBox.show({
					title  : dgettext('plugin_files', 'Warning'),
					msg    : String.format(dgettext('plugin_files', 'The file {0} is too large!'), node.get('filename')) + ' (' + dgettext('plugin_files', 'max') + ': ' + Ext.util.Format.fileSize(max_attachment_size) + ')',
					icon   : Zarafa.common.dialogs.MessageBox.WARNING,
					buttons: Zarafa.common.dialogs.MessageBox.OK
				});
				size_exceeded = true;
				return false;
			}
			idsList.push(node.get('folder_id'));
		});

		if (!size_exceeded) {
			if (idsList.length < 1) {
				Ext.MessageBox.show({
					title  : dgettext('plugin_files', 'Warning'),
					msg    : dgettext('plugin_files', 'You have to choose at least one file!'),
					icon   : Zarafa.common.dialogs.MessageBox.WARNING,
					buttons: Zarafa.common.dialogs.MessageBox.OK
				});
			} else {
				try {
					this.disable();
					// TODO: try to remove this single request call.
					container.getRequest().singleRequest(
						'filesbrowsermodule',
						'downloadtotmp',
						{
							ids               : idsList,
							dialog_attachments: attachmentStore.getId()
						},
						new Zarafa.core.data.AbstractResponseHandler({
							doDownloadtotmp: this.addDownloadedFilesAsAttachmentToEmail.createDelegate(this)
						})
					);
				} catch (e) {
					Zarafa.common.dialogs.MessageBox.show({
						title  : dgettext('plugin_files', 'Warning'),
						msg    : e.getMessage(),
						icon   : Zarafa.common.dialogs.MessageBox.WARNING,
						buttons: Zarafa.common.dialogs.MessageBox.OK
					});
				}
			}
		}
	},

	/**
	 * Convert the serverresponse to {@link Ext.data.Record}.
	 *
	 * @param {Object} downloadedFileInfo
	 * @returns {Ext.data.Record}
	 */
	convertDownloadedFileInfoToAttachmentRecord: function (downloadedFileInfo) {
		var attachmentRecord = Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH);

		attachmentRecord.set('tmpname', downloadedFileInfo.tmpname);
		attachmentRecord.set('name', downloadedFileInfo.name);
		attachmentRecord.set('size', downloadedFileInfo.size);
		attachmentRecord.set('attach_id', downloadedFileInfo.attach_id);
		return attachmentRecord;
	},

	/**
	 * Add the attachment records to the email.
	 *
	 * @param downloadedFilesInfoArray
	 */
	addDownloadedFilesAsAttachmentToEmail: function (downloadedFilesInfo) {
		var downloadedFilesInfoArray = downloadedFilesInfo.items;
		var emailRecord = this.dialog.record;
		if (Ext.isDefined(this.emailRecord)) {
			emailRecord = this.emailRecord;
		}
		var attachmentStore = emailRecord.getAttachmentStore();

		Ext.each(downloadedFilesInfoArray, function (downloadedFileInfo) {
			var attachmentRecord = this.convertDownloadedFileInfoToAttachmentRecord(downloadedFileInfo);
			attachmentStore.add(attachmentRecord);
		}, this);
		this.dialog.close();
	}
});

Ext.reg('filesplugin.attachfromfilespanel', Zarafa.plugins.files.ui.dialogs.AttachFromFilesPanel);
