/*
 * #dependsFile client/zarafa/core/KeyMapMgr.js
 */
Ext.namespace('Zarafa.hierarchy');

/**
 * @class Zarafa.hierarchy.KeyMapping
 * @extends Object
 *
 * The map of keys used in the Hierarchy Context.
 * @singleton
 */
Zarafa.hierarchy.KeyMapping = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor: function()
	{
		var newItemKeys = [{
			key: Ext.EventObject.F,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onNewFolder,
			scope: this,
			settingsCfg: {
				description: _('New folder'),
				category: _('Creating an item')
			}
		},{
			key: Ext.EventObject.S,
			ctrl: false,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onOpenSharedFolder,
			scope: this,
			settingsCfg: {
				description: _('Open shared folder/store'),
				category: _('Basic navigation')
			}
		},{
			key: Ext.EventObject.F2,
			ctrl: false,
			alt: false,
			shift: false,
			stopEvent: true,
			handler: this.onRenameFolder,
			scope: this,
			settingsCfg: {
				description: _('Rename folder'),
				category: _('All views')
			},
			basic: true
		}];

		Zarafa.core.KeyMapMgr.register('global', newItemKeys);
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to
	 * rename the folder.
	 */
	onRenameFolder : function()
	{
		var navigationBar = container.getNavigationBar();
		var centerPanel = navigationBar.centerPanel;
		var currentContextName = navigationBar.activeContext.getName();

		var hierarchyTree;
		if (navigationBar.showFolderList || currentContextName === 'today') {
			hierarchyTree = centerPanel.allFoldersPanel.allFoldersHierarchyTree;
		} else if (currentContextName === "calendar") {
			hierarchyTree = centerPanel.multiSelectHierarchyTree;
		} else {
			var activeItem = centerPanel.layout.activeItem;
			hierarchyTree = activeItem.hierarchytree;
		}

		var selectedNode = hierarchyTree.getSelectionModel().getSelectedNode();
		if (this.forbiddenToRenameFolder(selectedNode.getFolder())) {
			return;
		}
		hierarchyTree.startEditingNode(selectedNode);
	},

	/**
	 * Helper function used to identify that folder is not specical/default folder which we can't rename folder.
	 * 
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which is currently selected in hieararchy.
	 * @returns {Boolean} return true if folder is not allow to change the name else false.
	 */
	forbiddenToRenameFolder : function(folder)
	{
		return folder.isDefaultFolder() || folder.isIPMSubTree() || folder.isTodoListFolder() || folder.isRSSFolder() || folder.isSearchFolder();
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to
	 * create a new folder.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewFolder: function(key, event, component)
	{
		Zarafa.hierarchy.Actions.openCreateFolderContent();
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to
	 * create a new folder.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onOpenSharedFolder: function(key, event, component)
	{
		var currentContextName = container.getCurrentContext().getName();
		var defaultSelectedFolderType;
		switch(currentContextName) {
			case 'calendar':
				defaultSelectedFolderType = Zarafa.hierarchy.data.SharedFolderTypes['APPOINTMENT'];
				break;
			case 'contact':
				defaultSelectedFolderType = Zarafa.hierarchy.data.SharedFolderTypes['CONTACT'];
				break;
			case 'note':
				defaultSelectedFolderType = Zarafa.hierarchy.data.SharedFolderTypes['NOTE'];
				break;
			case 'task':
				defaultSelectedFolderType = Zarafa.hierarchy.data.SharedFolderTypes['TASK'];
				break;
			case 'inbox':
			/* falls through */
			default:
				defaultSelectedFolderType = Zarafa.hierarchy.data.SharedFolderTypes['MAIL'];
		}
		Zarafa.hierarchy.Actions.openSharedFolderContent(defaultSelectedFolderType);
	}
});

Zarafa.hierarchy.KeyMapping = new Zarafa.hierarchy.KeyMapping();
