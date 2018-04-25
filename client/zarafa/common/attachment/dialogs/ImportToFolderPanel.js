Ext.namespace('Zarafa.common.attachment.dialogs');

/**
 * @class Zarafa.common.attachment.dialogs.ImportToFolderPanel
 * @extends Zarafa.common.dialogs.CopyMovePanel
 * @xtype zarafa.importtofolderpanel
 *
 * Panel for users to import the given {@link Zarafa.core.data.IPMAttachmentRecord records}
 * to {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}.
 */
Zarafa.common.attachment.dialogs.ImportToFolderPanel = Ext.extend(Zarafa.common.dialogs.CopyMovePanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.importtofolderpanel',
			permissionFilter: Zarafa.core.mapi.Rights.RIGHTS_CREATE,
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
				cls: 'zarafa-normal',
				scope: this
			}]
		});

		Zarafa.common.attachment.dialogs.ImportToFolderPanel.superclass.constructor.call(this, config);
	},

	/**
	* Event handler which is trigggered when the user select a {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
	* from the {@link Zarafa.hierarchy.ui.Tree tree}. This will determine if a valid
	* {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} is selected to which the {@link Zarafa.core.data.IPMRecord records}
	* can indeed be copied or moved to.
	* @param {DefaultSelectionModel} selectionModel The selectionModel for the treepanel
	* @param {TreeNode} node The selected tree node
	* @private
	*/
	onSelectionChange : function(selectionModel, node)
	{
		if (!Ext.isDefined(node) || (node.getFolder().isIPMSubTree() && this.objectType == Zarafa.core.mapi.ObjectType.MAPI_MESSAGE)) {
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
	onImport : function()
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
	 * Identify {@link Zarafa.common.data.FolderContentTypes content-type} based on
	 * the filename of given attachment to filter matching tree nodes only
	 * using {@link Zarafa.hierarchy.ui.Tree#IPMFilter}.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The attachment record which should be imported.
	 * @return {String} The content type, undefined if no match available
	 * @private
	 */
	getIPMFilter : function(record)
	{
		switch (record.get('extension')) {
			case 'eml':
				return Zarafa.common.data.FolderContentTypes.mail;
			case 'vcf':
				return Zarafa.common.data.FolderContentTypes.contact;
		}

		return;
	}
});

Ext.reg('zarafa.importtofolderpanel', Zarafa.common.attachment.dialogs.ImportToFolderPanel);
