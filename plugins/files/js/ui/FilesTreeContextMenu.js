Ext.namespace('Zarafa.plugins.files.ui');

Zarafa.plugins.files.ui.FilesTreeContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
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

		Ext.applyIf(config, {
			items: [
				this.createContextActionItems(),
				{xtype: 'menuseparator'},
				container.populateInsertionPoint('plugin.files.treecontextmenu.actions', this),
				{xtype: 'menuseparator'},
				container.populateInsertionPoint('plugin.files.treecontextmenu.options', this)
			]
		});

		Zarafa.plugins.files.ui.FilesTreeContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Function create an array which used to create files tree context menu.
	 * @return {Array} Array which contains the context menu items.
	 */
	createContextActionItems: function () {
		return [{
			xtype     : 'zarafa.conditionalitem',
			text      : dgettext('plugin_files', 'New Folder'),
			iconCls   : 'files_icon_action files_icon_action_new_folder',
			handler   : this.onContextItemNewFolder,
			scope     : this
		},{
			xtype     : 'zarafa.conditionalitem',
			text      : dgettext('plugin_files', 'Refresh'),
			iconCls   : 'files_icon_action icon_cache',
			handler   : this.onContextItemRefresh,
			beforeShow: this.onBeforeShowItem,
			name      : "refresh",
			scope     : this
		},{
			xtype     : 'zarafa.conditionalitem',
			text      : dgettext('plugin_files', 'Rename'),
			iconCls   : 'files_icon_action files_icon_action_edit',
			handler   : this.onContextItemRename,
			name      : "rename",
			beforeShow: this.onBeforeShowItem,
			scope     : this
		}, {
			xtype     : 'zarafa.conditionalitem',
			text      : dgettext('plugin_files', 'Delete'),
			iconCls   : 'files_icon_action files_icon_action_delete',
			name      : "delete",
			handler   : this.onContextItemDelete,
			beforeShow: this.onBeforeShowItem,
			scope     : this
		}];
	},

	/**
	 * Event handler triggered before the "Refresh", "Rename" and "Delete"
	 * context menu item show.
	 *
	 * @param {Ext.Button} item The item which is going to show.
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord} record The folder record on which
	 * this context menu item shows.
	 */
	onBeforeShowItem : function (item, record)
	{
		var path = Zarafa.plugins.files.data.Utils.File.stripAccountId(record.get('folder_id'));

		if (item.name === "refresh") {
			item.setVisible(path === "/");
			return;
		}
		item.setVisible(path !== "/");
	},

	/**
	 * Handler called when "Refresh" button is pressed.
	 * it will reload the {@link Zarafa.plugins.files.ui.NavigatorTreePanel NavigatorTreePanel}.
	 */
	onContextItemRefresh: function()
	{
		this.model.getHierarchyStore().reload();
	},

	/**
	 * Handler called when "Delete" button is pressed.
	 * it will delete the folder from {@link Zarafa.plugins.files.ui.NavigatorTreePanel NavigatorTreePanel}.
	 */
	onContextItemDelete: function ()
	{
		Zarafa.plugins.files.data.Actions.deleteRecords(this.records);
	},

	/**
	 * Handler called when "New Folder" button is pressed.
	 * It will open the {@link Zarafa.plugins.files.ui.dialogs.CreateFolderContentPanel CreateFolderContentPanel}
	 */
	onContextItemNewFolder: function ()
	{
		Zarafa.plugins.files.data.Actions.createFolder(this.model, undefined, this.records);
	},

	/**
	 * Handler called when "Rename" button is pressed.
	 * It is used to rename the folder of {@link Zarafa.plugins.files.ui.NavigatorTreePanel NavigatorTreePanel}.
	 */
	onContextItemRename: function ()
	{
		Zarafa.plugins.files.data.Actions.openRenameDialog(this.records);
	}
});

Ext.reg('filesplugin.filestreecontextmenu', Zarafa.plugins.files.ui.FilesTreeContextMenu);
