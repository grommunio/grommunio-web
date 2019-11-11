Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.HierarchyTreePanel
 * @extends Zarafa.hierarchy.ui.Tree
 * @xtype zarafa.hierarchytreepanel
 *
 * HierarchyTreePanel for hierachy list in the main window.
 */
Zarafa.hierarchy.ui.HierarchyTreePanel = Ext.extend(Zarafa.hierarchy.ui.Tree, {
	/**
	 * @cfg {Boolean} enableItemDrop true to enable just drag for {@link Zarafa.core.data.MAPIRecord items}
	 * from a {@Link Ext.grid.GridPanel grid}.
	 */
	enableItemDrop : false,

	/**
	 * The dropZone used by this tree if drop is enabled (see {@link #enableItemDrop})
	 * @property
	 * @type Ext.tree.TreeDropZone
	 */
	itemDropZone : undefined,

	/**
	 * @cfg {Object} itemDropConfig Custom config to pass to the {@link Ext.tree.TreeDropZone} instance
	 */
	itemDropConfig : undefined,

	/**
	 * @cfg {Object} bbarConfig Custom config to pass to the {@link Zarafa.hierarchy.ui.HierarchyTreeBottomBar}.
	 * By default the xtype in this object is set to zarafa.hierarchytreebottombar.
	 */
	bbarConfig: undefined,

	/**
	 * @cfg {Boolean} showAllFoldersDefaultValue True to render the 'Show all folders'
	 * {@link #showAllFoldersCheckbox checkbox} as {@link Ext.form.Checkbox#checked checked}.
	 */
	showAllFoldersDefaultValue : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var checked = Ext.isDefined(config.showAllFoldersDefaultValue) ?
				config.showAllFoldersDefaultValue : this.showAllFoldersDefaultValue;

		Ext.applyIf(config, {
			xtype : 'zarafa.hierarchytreepanel',
			baseCls: 'zarafa-hierarchy-treepanel',
			flex : 1,
			minHeight : 100,
			stateful : true,
			statefulName : 'hierarchytree',
			tbar: {
				items: [{
					xtype: 'checkbox',
					cls: 'zarafa-hierarchy-treepanel-showallfolders',
					ref: '../showAllFoldersCheckbox',
					boxLabel : _('Show all folders'),
					checked : checked,
					listeners : {
						beforerender: this.reviseCheckboxDisablity,
						check: this.onCheckShowAllFoldersCheckbox,
						scope: this
					}
				}]
			},
			loadMask : true,
			treeSorter : true,
			trackMouseOver : true,
			containerScroll: true,
			// Default values for the Drag&Drop objects.
			// By default is Drag&Drop disabled...
			dragConfig : {
				ddGroup: 'dd.mapifolder'
			},
			dropConfig : {
				ddGroup: 'dd.mapifolder',
				expandDelay : 250,
				allowParentInsert : true
			},
			enableItemDrop : true,
			itemDropConfig : {
				ddGroup: 'dd.mapiitem'
			}
		});

		if(!Ext.isDefined(config.bbar)){
			config.bbarConfig = config.bbarConfig || {};
			config.bbar = Ext.applyIf(config.bbarConfig, {
				xtype : 'zarafa.hierarchytreebottombar'
			});
		}

		this.addEvents(
			/**
			 * @event beforeitemdrop
			 * Fires when a DD object is dropped on a node in this tree for preprocessing. Return false to cancel the drop. The dropEvent
			 * passed to handlers has the following properties:<br />
			 * <ul style="padding:5px;padding-left:16px;">
			 * <li>tree - The TreePanel</li>
			 * <li>target - The node being targeted for the drop</li>
			 * <li>data - The drag data from the drag source</li>
			 * <li>point - The point of the drop - append, above or below</li>
			 * <li>source - The drag source</li>
			 * <li>rawEvent - Raw mouse event</li>
			 * <li>dropNode - Drop node(s) provided by the source <b>OR</b> you can supply node(s)
			 * to be inserted by setting them on this object.</li>
			 * <li>cancel - Set this to true to cancel the drop.</li>
			 * <li>dropStatus - If the default drop action is cancelled but the drop is valid, setting this to true
			 * will prevent the animated 'repair' from appearing.</li>
			 * </ul>
			 * @param {Object} dropEvent
			 */
			'beforeitemdrop',
			/**
			 * @event itemdrop
			 * Fires after a DD object is dropped on a node in this tree. The dropEvent
			 * passed to handlers has the following properties:<br />
			 * <ul style="padding:5px;padding-left:16px;">
			 * <li>tree - The TreePanel</li>
			 * <li>target - The node being targeted for the drop</li>
			 * <li>data - The drag data from the drag source</li>
			 * <li>point - The point of the drop - append, above or below</li>
			 * <li>source - The drag source</li>
			 * <li>rawEvent - Raw mouse event</li>
			 * <li>dropNode - Dropped node(s).</li>
			 * </ul>
			 * @param {Object} dropEvent
			 */
			'itemdrop',
			/**
			 * @event folderdrop
			 * Fires after a DD object is dropped on a folder node in this tree. The dropEvent
			 * passed to handlers has the following properties:<br />
			 * <ul style="padding:5px;padding-left:16px;">
			 * <li>tree - The TreePanel</li>
			 * <li>target - The node being targeted for the drop</li>
			 * <li>data - The drag data from the drag source</li>
			 * <li>point - The point of the drop - append, above or below</li>
			 * <li>source - The drag source</li>
			 * <li>rawEvent - Raw mouse event</li>
			 * <li>dropNode - Dropped node(s).</li>
			 * </ul>
			 * @param {Object} dropEvent
			 */
			'folderdrop'
		);

		Zarafa.hierarchy.ui.HierarchyTreePanel.superclass.constructor.call(this, config);

		// We cannot wait for render time to set these listeners (as in initEvents()) because
		// then the listeners would not be set when 'Show all folders' is checked.
		this.mon(this.store, 'remove', this.onStoreRemove, this);
		this.mon(this.store, 'removeFolder', this.onFolderRemove, this);
	},


	/**
	 * Called after the tree has been {@link #render rendered} This will initialize
	 * all event handlers and when {@link #enableDD Drag & Drop} has been enabled,
	 * it will initialize the {@link #dropZone} with a special
	 * {@link Zarafa.hierarchy.ui.HierarchyFolderDropZone Folder DropZone} object.
	 * When {@link #enableItemDrop} has been enabled, it will also initialize the
	 * {@link #itemDropZone} using the {@link Zarafa.hierarchy.ui.HierarchyItemDropZone Item DropZone}.
	 * @private
	 */
	initEvents : function()
	{
		// Capture events that can change the height of the hierarchy tree, or of the containing panel,
		// so we can add a class and the css can handle the position of the bottombar
		this.on('afterrender', function(){
			this.on('expandnode', this.checkTreeHeight, this);
			this.on('collapsenode', this.checkTreeHeight, this);
			this.on('afterlayout', this.checkTreeHeight, this);
			this.on('append', this.checkTreeHeight, this);
			this.on('remove', this.checkTreeHeight, this);
			this.on('resize', this.checkTreeHeight, this);
		}, this, {single: true});

		// Add listeners to Zarafa.hierarchy.ui.Tree events
		this.on('contextmenu', this.onTreeNodeContextMenu, this);
		this.on('click', this.onFolderClicked, this);
		this.mon(container, 'folderselect', this.onFolderSelect, this);

		this.mon(container, 'contextswitch', this.reviseCheckboxDisablity, this);

		// TODO This needs to be fixed by lazy loading the stuff in the mainPanel, then we can do container.getNavigationBar()
		// But at the moment it is instantiated as getMainPanel is run and so we cannot yet get the navigationBar that way
		var navigationPanel = this.findParentByType('zarafa.navigationpanel');
		if(navigationPanel){
			this.mon(navigationPanel, 'toggleshowallfolders', this.onToggleShowAllFolders, this);
		}

		// Add listener for the 'load' event so we can select
		// the currently active folder (when a folder was activated
		// before the hierarchy is shown).
		this.mon(this.loader, 'load', this.onHierarchyLoaderLoad, this);

		if (this.stateful === true) {
			this.on('expandnode', this.saveFolderState, this, { buffer : 5 });
			this.on('collapsenode', this.saveFolderState, this, { buffer : 5 });
		}

		if (this.enableDD || this.enableDrop) {
			// Initialize a special DropZone which has better support for detecting where
			// mapifolders can be dropped inside the hierarchy.
			if (!this.dropZone) {
				this.dropZone = new Zarafa.hierarchy.ui.HierarchyFolderDropZone(this, this.dropConfig || {
					ddGroup: this.ddGroup || 'TreeDD', appendOnly: this.ddAppendOnly === true
				});
			}

			this.on('folderdrop', this.onFolderDrop, this);
		}

		if (this.enableItemDrop) {
			// Initialize a special DropZone which has support for dragging MAPIRecord objects
			// from a grid into the hierarchy.
			if (!this.itemDropZone) {
				this.itemDropZone = new Zarafa.hierarchy.ui.HierarchyItemDropZone(this, this.itemDropConfig || {
					ddGroup: this.ddGroup || 'TreeDD'
				});
			}

			this.on('itemdrop', this.onItemDrop, this);
		}

		Zarafa.hierarchy.ui.HierarchyTreePanel.superclass.initEvents.call(this);
	},

	/**
	 * Register the {@link #stateEvents state events} to the {@link #saveState} callback function.
	 * @protected
	 */
	initStateEvents : function(){
		Zarafa.hierarchy.ui.HierarchyTreePanel.superclass.initStateEvents.call(this);
		this.mon(this.showAllFoldersCheckbox, 'check', this.saveState, this, {delay: 100});
	},

	/**
	 * Checks the height of the hierarchy tree. When it is smaller then the height of the containing box
	 * it will add a class so the the css can handle the position of the bottombar.
	 */
	checkTreeHeight: function(){
		if(!this.ownerCt) {
			return;
		}

		var treeHeight = this.body.down('ul').getHeight();
		var panelHeight = this.ownerCt.getHeight();
		var topBarHeight = this.getTopToolbar().getHeight();
		var bottomBarHeight = this.getBottomToolbar().getHeight();
		if ( panelHeight < treeHeight + bottomBarHeight + topBarHeight ){
			this.ownerCt.getEl().addClass('fixed-bottombar');
		} else {
			this.ownerCt.getEl().removeClass('fixed-bottombar');
		}
	},

	/**
	 * Fires on {@link Zarafa.core.Container#contextswitch}, or {@link Ext.form.Checkbox#beforerender}.
	 * Make (@link #showAllFoldersCheckbox) disable if current context is Settings or Zarafa, enable otherwise.
	 * @param {Object | Ext.form.Checkbox} parameters contains folder details or checkbox instance
	 * @param {Context} oldContext (optional) previously selected context
	 * @param {Context} newContext (optional) selected context
	 *
	 * @private
	 */
	reviseCheckboxDisablity : function(parameters, oldContext, newContext)
	{
		newContext = newContext || container.getCurrentContext();
		var settingsOrToday = (newContext == container.getContextByName('settings') || newContext == container.getContextByName('today'));
		this.showAllFoldersCheckbox.setDisabled(settingsOrToday);
	},

	/**
	 * Event handler which is triggered after drop is completed on {@link Zarafa.hierarchy.ui.Tree Tree}.
	 * @param {Object} dropEvent The object describing the drop information
	 * @private
	 */
	onFolderDrop : function(dropEvent)
	{
		if (Ext.isDefined(dropEvent.dropNode)) {
			var targetNode = dropEvent.target;

			switch (dropEvent.point) {
				case 'above':
				case 'below':
					targetNode = dropEvent.target.parentNode;
					break;
				case 'append':
				/* falls through */
				default:
					break;
			}

			var sourceFolder = dropEvent.dropNode.getFolder();
			var targetFolder = targetNode.getFolder();

			var hasAccess = targetFolder.get('access') & Zarafa.core.mapi.Access.ACCESS_CREATE_HIERARCHY;
			var hasCtrlKeyPressed = dropEvent.rawEvent.ctrlKey;

			if (!hasAccess) {
				var msg = hasCtrlKeyPressed ? _("You have insufficient privileges to copy this folder. Ask the folder owner to grant you permissions or contact your system administrator."):
					_("You have insufficient privileges to move this folder. Ask the folder owner to grant you permissions or contact your system administrator.");
				container.getNotifier().notify('error', _("Insufficient privileges"), msg);
				return false;
			}

			if (hasCtrlKeyPressed) {
				sourceFolder.copyTo(targetFolder);
			} else {
				sourceFolder.moveTo(targetFolder);
			}

			sourceFolder.save();
		}
	},

	/**
	 * Event handler which is trigggered after drop of item is completed on {@link Zarafa.hierarchy.ui.Tree Tree}.
	 * @param {Object} dropEvent The object describing the drop information
	 * @private
	 */
	onItemDrop : function(dropEvent)
	{
		if (!Ext.isEmpty(dropEvent.dropItem)) {
			var targetNode = dropEvent.target;

			var sourceNodes = Array.isArray(dropEvent.dropItem) ? dropEvent.dropItem : [ dropEvent.dropItem ];
			var targetFolder = targetNode.getFolder();
			var store = sourceNodes[0].getStore();

			var isWasteBasket = targetFolder.isSpecialFolder('wastebasket');
			var cloneSourceNodes = sourceNodes.clone();
			if (isWasteBasket) {
				Zarafa.common.Actions.deleteRecords(cloneSourceNodes);
			} else {
				var isCtrlKeyPress = dropEvent.rawEvent.ctrlKey;
				var noAccessRecord = [];

				// Check folder has create item rights.
				if (!targetFolder.hasCreateRights()) {
					var message = _("You have insufficient privileges to move and copy this item. Ask the folder owner to grant you permissions or contact your system administrator.");
					if (isCtrlKeyPress) {
						message = _("You have insufficient privileges to copy this item. Ask the folder owner to grant you permissions or contact your system administrator.");
					}
					container.getNotifier().notify('error', _("Insufficient privileges"), message);
					return false;
				}

				var sourceNode = this.getNodeById(cloneSourceNodes[0].get('parent_entryid'));
				var sourceFolder =  sourceNode.getFolder();

				// If targetFolder has create item rights and source folder does not have delete item rights,
				// in that case move operation is not possible, therefore show message box which indicate that
				// move operation is not possible and ask user to copy the item.
				if (targetFolder.hasCreateRights() && !sourceFolder.hasDeleteOwnRights() && !isCtrlKeyPress) {
					Zarafa.common.Actions.showMessageBox(cloneSourceNodes, targetFolder, store, undefined, this);
					return false;
				}

				cloneSourceNodes.forEach(function (sourceNode, index) {
					if (isCtrlKeyPress) {
						sourceNode.copyTo(targetFolder);
					} else {
						// Check record access. If record has no delete access (record not belongs to user)
						// user can't move this item.
						if (!sourceNode.hasDeleteAccess()) {
							noAccessRecord.push({
								record: sourceNode,
								index:index
							});
						} else {
							sourceNode.moveTo(targetFolder);
						}
					}
				}, this);

				// Show detailed warning message when record have no access to delete
				// ask user to copy that records.
				if (!Ext.isEmpty(noAccessRecord)) {
					var msg = undefined;
					if (noAccessRecord.length > 1) {
						msg = _("You have insufficient privileges to move following items.");
						msg += "<br/><br/>";
						noAccessRecord.forEach(function (item) {
							cloneSourceNodes.splice(item.index, 1);
							var subject = item.record.get('subject');
							subject = !Ext.isEmpty(subject) ? subject : _("None");
							msg += "<b>" +_("Subject:") + "</b> " + subject ;
							msg += "<br/>";
						}, this);
						msg += "<br/>" + _("Would you like to copy instead?");
					}
					var records = Ext.pluck(noAccessRecord, "record");
					Zarafa.common.Actions.showMessageBox(records, targetFolder, store, msg, this);
				}
			}

			// Don't call store.save if folder is waste basket or is cloneSourceNodes is empty array.
			if(!isWasteBasket && !Ext.isEmpty(cloneSourceNodes)) {
				store.save(cloneSourceNodes);
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link #store} fires the
	 * {@link Zarafa.hierarchy.data.HierarchyStore#remove} event handler. This will check
	 * if any of the folders inside the store is currently opened, and
	 * will deselect those folders.
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The store which fired the event
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} storeRecord The store which was deleted
	 * @private
	 */
	onStoreRemove : function(store, storeRecord)
	{
		var subFolders = storeRecord.getSubStore('folders');

		if (this.model) {
			subFolders.each(function(folder) {
				this.model.removeFolder(folder);
			}, this);
		}
	},

	/**
	 * Event handler which is fired when the {@link #store} fires the
	 * {@link Zarafa.hierarchy.data.HierarchyStore#removeFolder} event handlerr. This will check
	 * if the folder is currently opened, and will deselect that folder.
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The store which fired the event
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} storeRecord The store from where the folder is
	 * removed
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which was removed from the store
	 * @private
	 */
	onFolderRemove : function(store, storeRecord, folder)
	{
		if (this.model) {
			this.model.removeFolder(folder);
		}
	},

	/**
	 * Fires when the {@link Zarafa.core.Container} fires the
	 * {@link Zarafa.core.Container#folderselect} event. This
	 * will search for the corresponding node in the tree,
	 * and will mark the given folder as {@link #selectFolderInTree selected}.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord|Array} folder The folder which
	 * is currently selected.
	 * @private
	 */
	onFolderSelect : function(folder)
	{
		if (Array.isArray(folder)) {

			// If we have multi selected folder then select previously selected node in tree.
			if (folder.length > 1 && this.model) {
				folder = this.model.getDefaultFolder();
			} else {
				folder = folder[0];
			}
		}

		// Select the node of selected folder.
		if (folder) {
			this.selectFolderInTree(folder);
		}
	},

	/**
	 * Fires when the {@link #loader} fires the {@link Zarafa.hierarchy.data.HierarchyTreeLoader#load}
	 * event to indicate that all nodes have been rendered into the tree.
	 * This will {@link #selectFolderInTree select} {@link Zarafa.core.ContextModel#getFolders all folders}
	 * @param {Object} loader TreeLoader object.
	 * @param {Object} node The {@link Ext.tree.TreeNode} object being loaded.
	 * @param {Object} response The response object containing the data from the server.
	 * @private
	 */
	onHierarchyLoaderLoad : function(loader, node, response)
	{
		// Use respective model considering the case the current model doesn't belongs to current context
		var currentContextModel = container.getCurrentContext().getModel();
		if (currentContextModel) {
			var folders = currentContextModel.getFolders();
			for (var i = 0, len = folders.length; i < len; i++) {
				this.selectFolderInTree(folders[i], folders[i].id === node.id);
			}

			// If we have multi selected folder then select previously selected node in tree.
			if (folders.length > 1 && currentContextModel) {
				this.selectFolderInTree(currentContextModel.getDefaultFolder());
			}
		}
	},

	/**
	 * Fired on contextmenu event on {@link Zarafa.hierarchy.ui.FolderNode}
	 * @param {Zarafa.hierarchy.ui.FolderNode} treeNode The node on which the contextmenu
	 * was requested.
	 * @param {Ext.EventObject} eventObj The event object with event information
	 * @private
	 */
	onTreeNodeContextMenu : function(treeNode, eventObj)
	{
		// If folder is favorites root folder then disable the right click
		// as it doesn't support any context menu items.
		if(treeNode.getFolder().isFavoritesRootFolder()) {
			return;
		}

		var positionEventObj = eventObj.getXY();

		// Handle a specific situation for Edge where somehow eventObj replaced with 'blur' event which doesn't have the position.
		// Check if the position is available or not, get the position of treeNode
		// and use that position to render context menu if not available.
		if (positionEventObj[0] === 0 && positionEventObj[1] === 0) {
			var treeNodeAnchor = treeNode.ui.anchor;
			var nodePosition = treeNodeAnchor.getBoundingClientRect();
			positionEventObj = [nodePosition.left, nodePosition.top];
		}
		var folder = treeNode.getFolder();
		if(folder.isFavoritesFolder() && !folder.isSearchFolder()) {
			folder = folder.getOriginalRecordFromFavoritesRecord();
		}
		Zarafa.core.data.UIFactory.openDefaultContextMenu(folder, { position : positionEventObj, contextNode : treeNode });
	},

	/**
	 * Fired when a node is clicked in {@link Zarafa.hierarchy.ui.Tree}.
	 * It calls container to change folder.
	 * @param {Ext.tree.TreeNode} node which is clicked
	 */
	onFolderClicked : function(treeNode)
	{
		var folder = treeNode.getFolder();
		Zarafa.hierarchy.Actions.openFolder(folder);
	},

	/**
	 * @return {Zarafa.hierarchy.ui.TreeEditor} The tree editor which can be used
	 * @private
	 */
	getTreeEditor : function()
	{
		if (!this.treeEditor) {
			this.treeEditor = new Zarafa.hierarchy.ui.TreeEditor(this);
		}
		return this.treeEditor;
	},

	/**
	 * Triggers node editing
	 * @param {Zarafa.hierarchy.ui.FolderNode} treeNode node to be edited
	 */
	startEditingNode : function(treeNode)
	{
		this.getTreeEditor().startEditingNode(treeNode);
	},

	/**
	 * When {@link #stateful} is enabled, this will test if the given
	 * folder has the 'is_open' state enabled.
	 * If the folder is not found in the settings, the rule is that
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord#isIPMSubTree subtrees}
	 * will be expaned by default, all other folders are collapsed.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to check
	 * @return {Boolean} True if the folder should be expanded by default
	 * @private
	 */
	isFolderOpened : function(folder)
	{
		var opened;
		if (this.stateful === true) {
			var state = container.getHierarchyStore().getState(folder, 'tree');
			if (state) {
				opened = state.is_open;
			}
		}
		if (!Ext.isDefined(opened)) {
			opened = Zarafa.hierarchy.ui.HierarchyTreePanel.superclass.isFolderOpened.call(this, folder);
		}
		return opened;
	},

	/**
	 * Event handler for the {@link #expandnode} and {@link #collapsenode} events. When
	 * {@link #stateful} is enabled, then this function will save the current
	 * state of the given node.
	 *
	 * @param {Zarafa.hierarchy.ui.FolderNode} node The node which will be saved into the settings
	 * @private
	 */
	saveFolderState : function(node)
	{
		if (this.stateful === true && !node.isRoot) {
			var folder = node.getFolder();
			var state = container.getHierarchyStore().getState(folder, 'tree');

			if (state.is_open !== node.expanded) {
				container.getHierarchyStore().applyState(folder, 'tree', { is_open : node.expanded });
			}
		}
	},

	/**
	 * Called when the {@link #showAllFoldersCheckbox} checkbox in the top toolbar is checked or
	 * unchecked. It will set the toggle showAllFolders option in the
	 * {@link Zarafa.core.ui.NavigationPanel}.
	 * @param {Ext.Form.Checkbox} button The pressed button
	 * @param {Boolean} checkState True when checkbox is checked, false when not
	 */
	onCheckShowAllFoldersCheckbox: function(checkbox, checkState)
	{
		container.getNavigationBar().setShowFolderList(checkState);
	},

	/**
	 * Called when the {@link Zarafa.core.ui.NavigationPanel} fires the
	 * {@link Zarafa.core.ui.NavigationPanel#toggleshowallfolders toggleshowallfolders} event. Then
	 * we change the {@link #showAllFoldersCheckbox} button in the top toolbar accordingly.
	 * @param {Boolean} show Value of the showAllFolders state
	 */
	onToggleShowAllFolders: function(show)
	{
		// Suspend events to stop the check-event that will fire from triggering all kinds of
		// other updates externally.
		this.suspendEvents(false);

		this.showAllFoldersCheckbox.setValue(show);

		this.resumeEvents();
	},

	/**
	 * Called before the panel is being destroyed.
	 */
	beforeDestroy : function()
	{
		if (this.rendered) {
			Ext.destroy(this.itemDropZone);
		}

		Zarafa.hierarchy.ui.HierarchyTreePanel.superclass.beforeDestroy.apply(this, arguments);
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState : function()
	{
		var state = Zarafa.hierarchy.ui.HierarchyTreePanel.superclass.getState.call(this) || {};
		var checkboxValue = this.showAllFoldersCheckbox.getValue();
		return Ext.apply(state, {
			showallcheckbox : checkboxValue
		});
	},

	/**
	 * Obtain the path in which the {@link #getState state} must be saved.
	 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
	 * used in the {@link Ext.state.Manager}. This returns {@link #statefulName} if provided, or else generates
	 * a custom name.
	 * @return {String} The unique name for this component by which the {@link #getState state} must be saved.
	 */
	getStateName : function()
	{
		return 'sidebars/' + Zarafa.core.ui.MainViewSidebar.superclass.getStateName.call(this);
	}
});
Ext.reg('zarafa.hierarchytreepanel', Zarafa.hierarchy.ui.HierarchyTreePanel);
