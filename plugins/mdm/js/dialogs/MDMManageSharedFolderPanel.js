Ext.namespace('Zarafa.plugins.mdm.dialogs');

/**
 * @class Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderPanel
 * @extends Ext.Panel
 * @xtype mdm.managesharedfolderpanel
 *
 * Panel for users to show the {@link Zarafa.core.data.IPFRecord folders} which are shared with device
 */
Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderPanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Zarafa.plugins.mdm.data.MDMDeviceFolderStore} store contains {@link Zarafa.plugins.mdm.data.MDMDeviceFolderRecord folders} which
	 * is going to shared with device.
	 */
	sharedFoldersStore : undefined,

	/**
	 * @cfg {Zarafa.core.data.IPMRecord} record The mail which
	 * is being update by this panel.
	 */
	record: null,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'mdm.managesharedfolderpanel',
			layout: {
				type: 'fit',
				align: 'stretch'
			},
			border: false,
			header: false,
			items: [
				this.createTreePanel()
			],
			buttonAlign: 'right',
			plugins : ['zarafa.recordcomponentupdaterplugin'],
			buttons: [{
				text: _('Apply'),
				handler: this.onApply,
				cls: 'zarafa-action',
				scope: this
			}, {
				text: _('Cancel'),
				handler: this.onCancel,
				scope: this
			}]
		});

		Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates a {@link Zarafa.hierarchy.ui.Tree treepanel}
	 * which contains all the {@link Zarafa.hierarchy.data.MAPIFolderRecord folders}
	 * on which search get perform.
	 * @return {Object} Configuration object for the tree panel.
	 * @private
	 */
	createTreePanel: function ()
	{
		return {
			xtype: 'panel',
			layout : 'form',
			defaults: {
				cls : 'mdm-create-tree-panel-item'
			},
			border: false,
			flex: 1,
			items: [{
				xtype: 'displayfield',
				hideLabel : true,
				value: dgettext('plugin_mdm','Select folders to sync to your device from the list below. To add additional mailboxes to the list, open them in WebApp first.')
			}, {
				xtype: 'mdm.hierarchytree',
				autoScroll : true,
				hideOwnTree : true,
				nodeConfig : {
					checked : false
				},
				multiSelect: true,
				hideShowAllFolders: true,
				border: true,
				treeSorter: true,
				bbarConfig: {
					hidden: true
				},
				enableDD: false,
				anchor: '100% 90%',
				ref: '../hierarchyTree'
			}]
		};
	},

	/**
	 * Initialize the events
	 * @private
	 */
	initEvents: function ()
	{
		Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderPanel.superclass.initEvents.apply(this, arguments);
		this.mon(this.hierarchyTree, {
			expandnode: this.onTreeNodeExpand,
			checkchange: this.onTreeNodeCheckChange,
			click: this.onTreeNodeClick,
			scope: this
		});
	},

	/**
	 * Fired when the {@link Zarafa.hierarchy.ui.Tree Tree} fires the {@link Zarafa.hierarchy.ui.Tree#nodeexpand nodeexpand}
	 * event.
	 * It will update the hierarchy by selecting child node if it will shared with device.
	 * @private
	 */
	onTreeNodeExpand: function ()
	{
		if (!this.record.isOpened()) {
			return false;
		}
		this.updateHierarchy();
	},

	/**
	 * Updates the panel by loading data from the record.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;
		this.sharedFoldersStore = record.getSubStore('sharedfolders');
		this.updateHierarchy();
	},

	/**
	 * Function will try to select those {@link Ext.tree.TreeNode TreeNode} in
	 * {@link Zarafa.hierarchy.ui.Tree Tree} which was shared with respective device.
	 */
	updateHierarchy : function ()
	{
		var folders = this.sharedFoldersStore.getRange();
		folders.forEach(function (folder) {
			var node = this.hierarchyTree.getNodeById(folder.get('entryid'));
			if (Ext.isDefined(node)) {
				if (node.hasChildNodes()) {
					node.expand();
				}
				node.isNodeSelected = true;
				node.getUI().toggleCheck(true);
			}
		}, this);
	},

	/**
	 * Called when a treeNode is click in tree. The corresponding folder is added to,
	 * or removed from the active folder list depending on the state of the check box.
	 * @param {Ext.tree.TreeNode} treeNode tree node.
	 * @private
	 */
	onTreeNodeClick : function(treeNode)
	{
		var treeNodeui = treeNode.getUI();
		if (treeNodeui.checkbox.checked && treeNode.isNodeSelected) {
			treeNodeui.toggleCheck(false);
			return false;
		}
		treeNode.isNodeSelected = true;
		this.sharedFoldersStore.addFolder(treeNode.getFolder());
		treeNodeui.toggleCheck(true);
	},

	/**
	 * Called when a check box in the calendar tree is toggled. The corresponding folder is added to,
	 * or removed from the active folder list depending on the state of the check box.
	 * @param {Ext.tree.TreeNode} node tree node.
	 * @param {Boolean} checked indicates whether the box is checked.
	 * @private
	 */
	onTreeNodeCheckChange : function(node, checked)
	{
		if (!checked) {
			node.isNodeSelected = false;
			this.sharedFoldersStore.removeFolder(node.getFolder());
		} else if (checked && !node.isNodeSelected) {
			this.onTreeNodeClick(node);
		}
	},

	/**
	 * Action handler when the user presses the "Apply" button.
	 * This save the record and close the panel.
	 */
	onApply : function ()
	{
		if (this.record.dirty) {
			this.record.save();
		} else {
			this.dialog.close();
		}
	},

	/**
	 * Action handler when the user presses the "Cancel" button.
	 * This will close the panel.
	 */
	onCancel: function ()
	{
		this.dialog.close();
	}
});

Ext.reg('mdm.managesharedfolderpanel', Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderPanel);