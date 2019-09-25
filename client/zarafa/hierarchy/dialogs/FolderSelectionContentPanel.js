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
	 * @cfg {Boolean} hideTodoList True to hide the To-do list.
	 */
	hideTodoList : false,

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
				hideTodoList: !!config.hideTodoList,
				buttonAlign: 'left',
				buttons : [{
					text : _('New folder'),
					handler : this.onNewFolder,
					cls: 'zarafa-normal',
					scope: this
				},'->',{
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
	 * 'New folder' button. This will open dialog for creating new folder.
	 */
	onNewFolder : function() {
		var parentFolder = this.get(0).getFolder();
		Zarafa.hierarchy.Actions.openCreateFolderContent(parentFolder);
		this.mon(this.get(0).hierarchyTree, 'append', this.onTreeAppend, this, {delay: 10});
	},

	/**
	 * Event handler which is triggered when a new folder is appended to the tree and selects the newly created folder
	 * @param {Zarafa.hierarchy.ui.Tree} tree the folder tree
	 * @param {Ext.data.Node} parent the parent of the newly created node
	 * @param {Ext.data.Node} node the appended node
	 * @private
	 */
	onTreeAppend: function(tree, parent, node)
	{
		// Sometimes the 'append' is fired but the node is not rendered yet,so add a delay of 10 ms.
		if (!node.parentNode) {
			// The node is probably removed and appended again, so let's find the
			// correct node in the tree again
			node = tree.getNodeById(node.id);
		}
		tree.selectPath(node.getPath());
		this.mun(this.get(0).hierarchyTree, 'append', this.onTreeAppend, this);
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
