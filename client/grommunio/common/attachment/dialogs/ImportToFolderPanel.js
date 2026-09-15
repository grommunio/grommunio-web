Ext.namespace('Grommunio.common.attachment.dialogs');

/**
 * @class Grommunio.common.attachment.dialogs.ImportToFolderPanel
 * @extends Grommunio.common.dialogs.CopyMovePanel
 * @xtype grommunio.importtofolderpanel
 *
 * Panel for users to import the given {@link Grommunio.core.data.IPMAttachmentRecord records}
 * to {@link Grommunio.hierarchy.data.MAPIFolderRecord folder}.
 */
Grommunio.common.attachment.dialogs.ImportToFolderPanel = Ext.extend(Grommunio.common.dialogs.CopyMovePanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.importtofolderpanel',
			permissionFilter: Grommunio.core.mapi.Rights.RIGHTS_CREATE,
			buttons: [{
				text: _('Import'),
				handler: this.onImport,
				scope: this,
				ref: '../importButton',
				disabled: true
			},{
				text: _('New folder'),
				handler: this.onCreateFolder,
				scope: this,
				ref: '../createFolderButton',
				disabled: true
			},
			'->',
			{
				text: _('Cancel'),
				handler: this.onCancel,
				cls: 'grommunio-normal',
				scope: this
			}]
		});

		Grommunio.common.attachment.dialogs.ImportToFolderPanel.superclass.constructor.call(this, config);
	},

	/**
	* Event handler which is triggered when the user select a {@link Grommunio.hierarchy.data.MAPIFolderRecord folder}
	* from the {@link Grommunio.hierarchy.ui.Tree tree}. This will determine if a valid
	* {@link Grommunio.hierarchy.data.MAPIFolderRecord folder} is selected to which the {@link Grommunio.core.data.IPMRecord records}
	* can indeed be copied or moved to.
	* @param {DefaultSelectionModel} selectionModel The selectionModel for the treepanel
	* @param {TreeNode} node The selected tree node
	* @private
	*/
	onSelectionChange: function(selectionModel, node)
	{
		if (!Ext.isDefined(node) || (node.getFolder().isIPMSubTree() && this.objectType == Grommunio.core.mapi.ObjectType.MAPI_MESSAGE)) {
			this.importButton.disable();
			this.createFolderButton.disable();
		} else {
			this.importButton.enable();
			this.createFolderButton.enable();
		}
	},

	/**
	 * Event handler which is triggered when the user presses the import
	 * {@link Ext.Button button}. This will import given attachment into selected folder
	 * and will close the dialog when it is done.
	 * @private
	 */
	onImport: function()
	{
		var folder = this.hierarchyTree.getSelectionModel().getSelectedNode().getFolder();
		var records = this.record;

		if (!Ext.isDefined(folder) || Ext.isEmpty(this.record)) {
			return;
		}

		Ext.each(records, function(record, index) {
			record.store.importRecord(record, record.store.parentRecord, folder);
		}, this);

		this.dialog.selectFolder(folder);
		this.dialog.close();
	},

	/**
	 * Identify {@link Grommunio.common.data.FolderContentTypes content-type} based on
	 * the filename of given attachment to filter matching tree nodes only
	 * using {@link Grommunio.hierarchy.ui.Tree#IPMFilter}.
	 * @param {Grommunio.core.data.IPMAttachmentRecord} record The attachment record which should be imported.
	 * @return {String} The content type, undefined if no match available
	 * @private
	 */
	getIPMFilter: function(record)
	{
		let extension = record.getFileExtension();

		if(record.isEmbeddedMessage()) {
			let messageClass = record.get('attach_message_class');
			if (Grommunio.core.MessageClass.isClass(messageClass, 'IPM.Note')) {
				extension = 'eml';
			} else if (Grommunio.core.MessageClass.isClass(messageClass, 'IPM.Contact')) {
				extension = 'vcf';
			}
		}

		switch (extension) {
			case 'eml':
				return Grommunio.common.data.FolderContentTypes.mail;
			case 'vcf':
				return Grommunio.common.data.FolderContentTypes.contact;
			case 'ics':
			case 'vcs':
				return Grommunio.common.data.FolderContentTypes.appointment;
		}

		return;
	}
});

Ext.reg('grommunio.importtofolderpanel', Grommunio.common.attachment.dialogs.ImportToFolderPanel);
