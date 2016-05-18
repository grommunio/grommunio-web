Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.PreviewPanelToolbarButtons
 * @extends Object
 *
 * Contains special toolbar buttons for the previewpanel.
 */
Zarafa.common.ui.PreviewPanelToolbarButtons = Ext.extend(Object, {
	/**
	 * @cfg {@link Zarafa.core.ContextModel}
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * Function called when insertion point previewpanel.toolbar.right is called,
	 * Function returns configuration object for Copy/Move, Delete and Print buttons
	 * which are added on the right side of previewpanels toolbar.
	 * @param {String} insertionPoint name of the insertion point
	 * @param {Object} options (optional) optional arguments such as scope
	 * @return {Object} Configuration object containing buttons
	 * which are added in the {@link Ext.Toolbar Toolbar}.
	 */
	getToolbarButtons : function(insertionPoint, options)
	{
		// Use model that is passed as arguments for these buttons, if any.
		var modelPassedAsArgument = false;
		if(Ext.isDefined(options.model) && options.model instanceof Zarafa.core.ContextModel) {
			modelPassedAsArgument = options.model;
		}

		return [{
			xtype: 'zarafa.toolbarbutton',
			tooltip: _('Copy/Move') + ' (Ctrl + M)',
			overflowText: _('Copy/Move'),
			iconCls: 'icon_copy',
			nonEmptySelectOnly: true,
			handler: this.onCopyMove,
			model: modelPassedAsArgument || this.model
		},{
			xtype: 'zarafa.toolbarbutton',
			tooltip: _('Delete') + ' (DELETE)',
			overflowText: _('Delete'),
			iconCls: 'icon_delete',
			nonEmptySelectOnly: true,
			handler: this.onDelete,
			model: modelPassedAsArgument || this.model
		}];
	},

	/**
	 * Open the {@link Zarafa.common.dialogs.CopyMoveContent CopyMoveContent} for copying
	 * or moving the currently selected folders.
	 * @private
	 */
	onCopyMove : function()
	{
		Zarafa.common.Actions.openCopyMoveContent(this.model.getSelectedRecords());
	},

	/**
	 * Delete the currently selected messages. If any of the records is a recurring item,
	 * then the {@link #Zarafa.common.dialogs.MessageBox.select MessageBox} will be used
	 * to select between the recurring and single appointment.
	 * @private
	 */
	onDelete : function()
	{
		Zarafa.common.Actions.deleteRecords(this.model.getSelectedRecords());
	},

	/**
	 * Open the Print dialog
	 * @private
	 */
	onPrint : function()
	{
		Zarafa.common.Actions.openPrintDialog(this.model.getSelectedRecords());
	}
});
