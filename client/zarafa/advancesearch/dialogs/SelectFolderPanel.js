Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SelectFolderPanel
 * @extends Ext.Panel
 * @xtype zarafa.selectfolderpanel
 *
 * Panel for users to select the {@link Zarafa.core.data.IPFRecord folder}
 * on which search can perform.
 */
Zarafa.advancesearch.dialogs.SelectFolderPanel = Ext.extend(Ext.Panel, {
	/**
	 * {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo} contains the search folders
	 * which used in search operation.
	 * @type Object
	 * @property searchFolderCombo
	 */
	searchFolderCombo : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.selectfolderpanel',
			layout: {
				type: 'fit',
				align: 'stretch'
			},
			border: false,
			searchFolderCombo : config.searchFolderCombo,
			header: false,
			items: [
				this.createTreePanel()
			],
			buttonAlign: 'right',
			buttons: [{
				text: _('Ok'),
				handler: this.onOk,
				disabled: true,
				ref: '../okButton',
				cls: 'zarafa-action',
				scope: this
			},{
				text: _('Cancel'),
				disabled: true,
				ref: '../cancelButton',
				handler: this.onCancel,
				scope: this
			}]
		});

		Zarafa.advancesearch.dialogs.SelectFolderPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize events
	 * @private
	 */
	initEvents : function ()
	{
		Zarafa.advancesearch.dialogs.SelectFolderPanel.superclass.initEvents.apply(this, arguments);
		this.mon(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		this.mon(this.hierarchyTree.getSelectionModel(), 'selectionchange', this.onSelectionChange, this);
	},

	/**
	 * Creates a {@link Zarafa.hierarchy.ui.Tree treepanel}
	 * which contains all the {@link Zarafa.hierarchy.data.MAPIFolderRecord folders}
	 * on which search get perform.
	 * @return {Object} Configuration object for the tree panel.
	 * @private
	 */
	createTreePanel : function()
	{
		return {
			xtype: 'panel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			defaults: {
				margins : "0 0 5 0"
			},
			border: false,
			flex: 1,
			bodyStyle: 'background-color: inherit;',
			items: [{
				xtype: 'zarafa.hierarchytree',
				flex: 1,
				border: true,
				treeSorter: true,
				hideFavorites : true,
				enableDD : false,
				anchor: '100% 90%',
				ref: '../hierarchyTree'
			},{
				xtype : "checkbox",
				hideLabel : true,
				ref : '../includeSubFolder',
				boxLabel : _('Include subfolders')
			}]
		};
	},

	/**
	 * Event handler which is triggered when the user select a {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
	 * from the {@link Zarafa.hierarchy.ui.Tree tree}. This will determine if a valid
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} is selected on which search get's perform.
	 *
	 * @param {DefaultSelectionModel} selectionModel The selectionModel for the treepanel
	 * @param {TreeNode} node The selected tree node
	 * @private
	 */
	onSelectionChange : function(selectionModel, node)
	{
		if (!Ext.isDefined(node) || (node.getFolder().isIPMSubTree() && this.objectType == Zarafa.core.mapi.ObjectType.MAPI_MESSAGE)) {
			this.okButton.disable();
			this.cancelButton.disable();
		} else {
			this.okButton.enable();
			this.cancelButton.enable();
			this.updateIncludeSubFolderCheckBox(node);
		}
	},

	/**
	 * Function is used to disable "Include sub folder" checkbox and apply tooltip when "All folders" option is
	 * selected from {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo} or IPM_SUBTREE folder
	 * selected from hierarchy and enable as well as remove tooltip from "Include Sub folder" checkbox if other then
	 * "All folders" option is selected in {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo} or
	 * hierarchy
	 *
	 * @param {Ext.tree.TreeNode} node The selected tree node
	 */
	updateIncludeSubFolderCheckBox : function(node)
	{
		var supportSearchFolder = this.model.supportsSearchFolder(node.getFolder());
		this.includeSubFolder.setVisible(supportSearchFolder);
		if (supportSearchFolder) {
			var record = this.searchFolderCombo.findRecord('value', node.getFolder().get('entryid'));
			var isChecked = false;
			var isDisabled = false;
			if(Ext.isDefined(record)) {
				isChecked = record.get('include_subfolder');
				isDisabled = record.get('flag') === Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.ALL_FOLDERS;
			}
			var subFolderCheckBox = this.includeSubFolder;
			subFolderCheckBox.setValue(isChecked);
			subFolderCheckBox.setDisabled(isDisabled);

			if(subFolderCheckBox.rendered) {
				// Add tooltip on "include subfolder" check box when "All folders"
				// was selected in search folder combo box else remove tooltip from
				// "include subfolder" check box
				if (isDisabled) {
					subFolderCheckBox.wrap.dom.qtip = _("All folders are selected");
				} else {
					delete(subFolderCheckBox.wrap.dom.qtip);
				}
			}
		}
	},

	/**
	 * Fired when the {@link Zarafa.hierarchy.ui.Tree Tree} fires the {@link Zarafa.hierarchy.ui.Tree#load load}
	 * event. This function will try to select the {@link Ext.tree.TreeNode TreeNode} in
	 * {@link Zarafa.hierarchy.ui.Tree Tree} intially. When the given node is not loaded yet, it will try again
	 * later when the event is fired again.
	 *
	 * @private
	 */
	onTreeNodeLoad : function()
	{
		// Select folder in hierarchy tree.
		var folder = container.getHierarchyStore().getFolder(this.searchFolderCombo.getValue());

		// If the folder could be selected, then unregister the event handler.
		if (this.hierarchyTree.selectFolderInTree(folder)) {
			this.mun(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
	},

	/**
	 * Event handler which is triggered when the user presses the ok
	 * {@link Ext.Button button}. This will add selected {@link Zarafa.core.data.IPFRecord folder}
	 * into {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}, if folder
	 * is not already exists in {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}.
	 * Also it will use to check/un-check "Include sub folder" checkbox which belongs to
	 * {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel SearchToolBox}.
	 *
	 * @private
	 */
	onOk : function ()
	{
		var folder = this.hierarchyTree.getSelectionModel().getSelectedNode().getFolder();

		if (!Ext.isDefined(folder)) {
			return;
		}
		var includeSubFolder = this.includeSubFolder.checked;
		var store = this.searchFolderCombo.getStore();
		var record = store.getAt(store.findExact("value", folder.get('entryid')));
		if (!Ext.isDefined(record)) {
			var importedFolderFlag = Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.IMPORTED_FOLDER;
			if (store.getAt(0).get('flag') === importedFolderFlag) {
				store.removeAt(0);
			}
			record = new Ext.data.Record({
				'name' : folder.get('display_name'),
				'value' : folder.get('entryid'),
				'flag' : importedFolderFlag,
				'include_subfolder': includeSubFolder
			});
			store.insert(0, record);
		} else {
			record.set('include_subfolder', includeSubFolder);
		}
		this.searchFolderCombo.setValue(record.get('value'));
		this.searchFolderCombo.onSelect(record, 0);
		this.dialog.close();
	},

	/**
	 * Event handler which is triggered when the user presses the cancel
	 * {@link Ext.Button button}. This will close the {@link Zarafa.advancesearch.dialogs.SelectFolderPanel dialog}
	 * without adding any {@link Ext.data.Record records} in search combo box.
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	}
});

Ext.reg('zarafa.selectfolderpanel', Zarafa.advancesearch.dialogs.SelectFolderPanel);
