Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.FolderSelectionContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.folderselectioncontentpanel
 *
 * Content Panel to allow the user to select a folder
 */
Zarafa.hierarchy.dialogs.FolderSelectionContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which is selected by
	 * default in the hierarchy tree.
	 */
	folder : undefined,

	/**
	 * @cfg {Function} callback The callback function which will be called when the
	 * user presses the 'Ok' button. This will pass the selected
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord #folder} as first argument.
	 */
	callback : Ext.emptyFn,

	/**
	 * @cfg {Object} scope The scope by which the {@link #callback} will be called.
	 */
	scope : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			layout: 'fit',
			title : _('Select Folder'),
			width: 330,
			height: 380,
			items: [{
				xtype: 'zarafa.folderselectionpanel',
				folder : config.folder,
				buttons : [{
					text : _('Ok'),
					handler : this.onOk,
					scope : this
				},{
					text : _('Cancel'),
					handler : this.onCancel,
					scope : this
				}]
			}]
		});

		Zarafa.hierarchy.dialogs.FolderSelectionContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is fired when the user pressed the
	 * 'Ok' button. This will call {@link #callback} and {@link #close}
	 * the dialog.
	 * @private
	 */
	onOk : function()
	{
		if (Ext.isFunction(this.callback)) {
			this.callback.call(this.scope || this, this.get(0).getFolder());
		}
		this.close();
	},

	/**
	 * Event handler which is fired when the user pressed the
	 * 'Cancel' button. This will discard all changes and {@link #close}
	 * the dialog.
	 * @private
	 */
	onCancel : function()
	{
		this.close();
	}
});

Ext.reg('zarafa.folderselectioncontentpanel', Zarafa.hierarchy.dialogs.FolderSelectionContentPanel);
