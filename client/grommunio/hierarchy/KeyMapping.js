/*
 * #dependsFile client/grommunio/core/KeyMapMgr.js
 */
Ext.namespace('Grommunio.hierarchy');

/**
 * @class Grommunio.hierarchy.KeyMapping
 * @extends Object
 *
 * The map of keys used in the Hierarchy Context.
 * @singleton
 */
Grommunio.hierarchy.KeyMapping = Ext.extend(Object, {
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

		Grommunio.core.KeyMapMgr.register('global', newItemKeys);
	},

	/**
	 * Event handler for the keydown event of the {@link Grommunio.core.KeyMap KeyMap} when the user wants to
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
	 * Helper function used to identify that folder is not special/default folder which we can't rename folder.
	 * 
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder The folder which is currently selected in the hierarchy.
	 * @returns {Boolean} return true if folder is not allow to change the name else false.
	 */
	forbiddenToRenameFolder : function(folder)
	{
		return false;
	},

	/**
	 * Event handler for the keydown event of the {@link Grommunio.core.KeyMap KeyMap} when the user wants to
	 * create a new folder.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewFolder: function(key, event, component)
	{
		Grommunio.hierarchy.Actions.openCreateFolderContent();
	},

	/**
	 * Event handler for the keydown event of the {@link Grommunio.core.KeyMap KeyMap} when the user wants to
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
				defaultSelectedFolderType = Grommunio.hierarchy.data.SharedFolderTypes['APPOINTMENT'];
				break;
			case 'contact':
				defaultSelectedFolderType = Grommunio.hierarchy.data.SharedFolderTypes['CONTACT'];
				break;
			case 'note':
				defaultSelectedFolderType = Grommunio.hierarchy.data.SharedFolderTypes['NOTE'];
				break;
			case 'task':
				defaultSelectedFolderType = Grommunio.hierarchy.data.SharedFolderTypes['TASK'];
				break;
			case 'inbox':
			/* falls through */
			default:
				defaultSelectedFolderType = Grommunio.hierarchy.data.SharedFolderTypes['MAIL'];
		}
		Grommunio.hierarchy.Actions.openSharedFolderContent(defaultSelectedFolderType);
	}
});

Grommunio.hierarchy.KeyMapping = new Grommunio.hierarchy.KeyMapping();
