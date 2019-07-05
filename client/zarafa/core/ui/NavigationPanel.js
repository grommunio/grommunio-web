Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.NavigationPanel
 * @extends Zarafa.core.ui.MainViewSidebar
 * @xtype zarafa.navigationpanel
 *
 * NavigationPanel provides basic navigation through {@link Zarafa.hierarchy.ui.Tree} and
 * {@link Zarafa.core.ui.NavigationButtonPanel} and other components which are provided by different
 * contexts. E.g. DatePicker provided by CalendarContext
 */
Zarafa.core.ui.NavigationPanel = Ext.extend(Zarafa.core.ui.MainViewSidebar, {
	// Insertion points for this class
	/**
	 * @insert navigation.north
	 * Insertion point for adding components to top part of the NavigationPanel like Datepicker for
	 * Calendar. Add the reference to the related Context in the property navigationContext to the
	 * added component. Then this component will only be shown when the related Context is active.
	 * If it is not set it will always show the component.
	 * @param {Zarafa.core.ui.NavigationPanel} panel This panel
	 */
	/**
	 * @insert navigation.center
	 * Insertion point for adding a {@link Zarafa.core.ui.ContextNavigationPanel ContextNavigationPanel}
	 * to the {@link #centerPanel centerPanel}. This hierarchy panel will be shown when the Context it
	 * is related to is active. For that to work the {@link Zarafa.core.ui.ContextNavigationPanel#context context}
	 * property needs to be set on the added ContextNavigationPanel.
	 * @param {Zarafa.core.ui.NavigationPanel} panel This panel
	 */
	/**
	 * @insert navigation.south
	 * Insertion point for adding components to top part of the NavigationPanel like Datepicker for
	 * Calendar. Add the reference to the related Context in the property navigationContext to the
	 * added component. Then this component will only be shown when the related Context is active.
	 * If it is not set it will always show the component.
	 * @param {Zarafa.core.ui.NavigationPanel} panel This panel
	 */

	/**
	 * Reference to the {@link Ext.Container Container} that holds the hierarchy panels for all the
	 * Contexts. It contains a card layout that is able to switch between the different items within
	 * the Container.
	 * @property
	 * @type Ext.Container
	 */
	centerPanel: null,

	/**
	 * This will determine whether the "Show all Folders" Panel will be shown or if
	 * the Context-related {@link Zarafa.core.ui.ContextNavigationPanel ContextNavigationPanel} will
	 * be shown.
	 * @property
	 * @type Boolean
	 */
	showFolderList: false,

	/**
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function (config)
	{
		this.addEvents([
			/**
			 * @event toggleshowallfolders Fired when the user switches between forcing to show all folders in the hierarchy tree
			 * @param {Boolean} show The showAllFolders state
			 */
			'toggleshowallfolders'
		]);

		config = config || {};

		// Collect components for 'north', 'center' and 'south' from registered plugins
		var northComponents = container.populateInsertionPoint('navigation.north', this);
		var centerComponents = container.populateInsertionPoint('navigation.center', this);
		var southComponents = container.populateInsertionPoint('navigation.south', this);

		for (var i = 0, len = northComponents.length; i < len; i++){
			northComponents[i] = Ext.create(northComponents[i]);
		}

		for (var i = 0, len = centerComponents.length; i < len; i++){
			centerComponents[i] = Ext.create(centerComponents[i]);
		}
		// Add the default ShowAllFoldersPanel to the start of the centerComponents
		centerComponents.unshift(this.getAllFoldersPanel());

		for (var i = 0, len = southComponents.length; i < len; i++){
			southComponents[i] = Ext.create(southComponents[i]);
		}
		var items = [];
		items.push.apply(items, northComponents);

		items.push({
				xtype: 'container',
				ref: 'centerPanel',
				cls: 'zarafa-navigationpanel-centerpanel',
				flex: 1,
				layout: {
					type : 'card',
					deferredRender : true
				},
				activeItem: 0,
				items: centerComponents
			});

		items.push.apply(items, southComponents);

		// Add CSS class to every item
		for(var i=0,len=items.length;i<len;i++){
			// Prevent overriding other css classes
			if(Ext.isEmpty(items[i].cls)){
				items[i].cls = 'zarafa-navigationpanel-item';
			}else{
				items[i].cls += ' zarafa-navigationpanel-item';
			}
		}

		Ext.applyIf(config, {
			border : false,
			layout : {
				type: 'vbox',
				align: 'stretch'
			},
			id: 'zarafa-navigationpanel',
			cls: 'zarafa-navigation zarafa-panel zarafa-context-mainpanel',

			north : northComponents,
			center : centerComponents,
			south : southComponents,

			items : items,
			collapseQuickTip: _('Collapse hierarchy'),
			expandQuickTip: _('Expand hierarchy'),
			animCollapse: false,
			headerCfg : { cls : 'zarafa-main-header x-panel-header' }
		});

		// parent constructor
		Zarafa.core.ui.NavigationPanel.superclass.constructor.call(this, config);

		// If previous value is there in state to "show all the folders" then simply assign it to respective config
		// TODO : This is achieved by overriding the applyState in Zarafa.hierarchy.ui.HierarchyTreePanel class.
		// But, the instance of Zarafa.core.ui.NavigationPanel is not created when applyState gets executed.
		var checkBoxState = container.getSettingsModel().get('zarafa/v1/state/sidebars/hierarchytree/showallcheckbox');
		this.showFolderList = checkBoxState || false;
	},

	/**
	 * @return {Ext.Container} Container which contains {@link Zarafa.hierarchy.ui.FolderSelectTree HierarchyTree}
	 * component and {@link Zarafa.hierarchy.ui.OpenSharedStorePanel OpenSharedStorePanel} component.
	 */
	getAllFoldersPanel : function()
	{
		return {
			xtype : 'zarafa.contextnavigation',
			ownerTitle: _('Folders List'),
			cls: 'zarafa-navigationpanel-centerpanel-allfolders',
			ref : 'allFoldersPanel',
			items : [{
				layout: 'fit',
				cls: 'zarafa-context-navigation-block',
				items: this.getFolderListPanel()
			}]
		};
	},

	/**
	 * @return {Zarafa.hierarchy.ui.Tree} Tree component showing folder list
	 */
	getFolderListPanel : function()
	{
		return {
			xtype : 'zarafa.hierarchytreepanel',
			enableDD : true,
			ref : '../allFoldersHierarchyTree',
			enableItemDrop : true,
			showAllFoldersDefaultValue : true,
			deferredLoading : true
		};
	},

	/**
	 * Fires on context switch from container. Updates local folder tree
	 * @param {Object} parameters contains folder details
	 * @param {Context} oldContext previously selected context
	 * @param {Context} newContext selected context
	 *
	 * @private
	 */
	onContextSwitch : function(parameters, oldContext, newContext)
	{
		this.activeContext = newContext;

		this.toggleVisibilityNavigationComponents();

		var title = newContext.getDisplayName() || _('Folders List');
		this.setTitle(title);
	},

	/**
	 * Set all compontents that are related to the active Context to visible and hide the other
	 * ones. The {@link #centerPanel centerPanel} is always visible and contains a card layout. It
	 * will switch to the tab that is related to the active Context as well. If no tab is related
	 * than it will show the {@link #AllFoldersPanel AllFoldersPanel} by default.
	 * @private
	 */
	toggleVisibilityNavigationComponents: function()
	{
		// Loop through all items in the navigation panel and determine whether to hide or show them
		for (var i = 0, len = this.items.length; i < len; i++){
			var item = this.items.itemAt(i);
			// Do not change the visibility of the centerPanel
			if(item !== this.centerPanel){
				// If no navigationContext property is set always show it, otherwise only for the related Context
				if(!item.navigationContext || item.navigationContext == this.activeContext){
					item.setVisible(true);
				}else{
					item.setVisible(false);
				}
			}
		}

		var center = this.centerPanel;
		var layout = center.getLayout();

		// Use this variable to see if we have to switch to the default one if none is found
		var contextNavPanelFound = false;
		// Loop through all items to find the one for the active Context
		for (var i = 0, len = center.items.length; i < len; i++){
			var item = center.items.itemAt(i);
			if(!this.showFolderList || item.restrictToShowAllFolderList === true) {
				if (item.getContext() == this.activeContext) {
					// Switch to the panel belonging to the active Context
					if (!Ext.isFunction(layout.setActiveItem)) {
						center.activeItem = i;
					} else {
						layout.setActiveItem(i);
					}
					contextNavPanelFound = true;
					break;
				}
			}
		}

		// If there is no center panel for the active Context found, switch to the "Show all Folders" by default
		if (!contextNavPanelFound) {
			if (!Ext.isFunction(layout.setActiveItem)) {
				center.activeItem = 0;
			} else {
				layout.setActiveItem(0);
			}
		}

		this.doLayout();
	},

	/**
	 * Sets the {@link #showFolderList showFolderList} property. This will determine whether the
	 * "Show all Folders" panel will be shown or if the Context-related
	 * {@link Zarafa.core.ui.ContextNavigationPanel ContextNavigationPanel} will be shown. If the
	 * state of the {@link #showFolderList} is not changed it will not do anything.
	 * @param {Boolean} showFolderList True to force the full folder list to be shown
	 */
	setShowFolderList : function(showFolderList)
	{
		if (this.showFolderList === showFolderList){
			return;
		}

		this.showFolderList = showFolderList;
		this.toggleVisibilityNavigationComponents();

		this.fireEvent('toggleshowallfolders', this.showFolderList);
	},

	/**
	 * Called during rendering of the panel, this will initialize all events.
	 * This will also update the {@link #activeContext active context} and
	 * call {@link #onContextSwitch} to ensure that the context is properly
	 * initialized.
	 * @private
	 */
	initEvents : function()
	{
		this.activeContext = container.getCurrentContext();
		this.mon(container, 'contextswitch', this.onContextSwitch, this);
		this.onContextSwitch(null, this.activeContext, this.activeContext);

		this.on('resize', this.onResizePanel, this);

		Zarafa.core.ui.NavigationPanel.superclass.initEvents.apply(this, arguments);
	},

	/**
	 * Event handler which is fired when the panel is resized. It will force the items to layout again.
	 *
	 * @param {Number} adjWidth The box-adjusted width that was set
	 * @param {Number} adjHeight The box-adjusted height that was set
	 * @param {Number} rawWidth The width that was originally specified
	 * @param {Number} rawHeight The height that was originally specified
	 * @private
	 */
	onResizePanel : function(adjWidth, adjHeight, rawWidth, rawHeight)
	{
		this.doLayout();
	},

	/**
	 * Override saveState to check if a user moves to the settingsContext,
	 * where the hierarchybar is disabled, which should not be saved to state.
	 *
	 * Since otherwise logging out from Settings breaks.
	 *
	 * @private
	 */
	saveState : function()
	{
		if (container.getCurrentContext().getName() !== "settings") {
			Zarafa.core.ui.NavigationPanel.superclass.saveState.apply(this);
		}
	}
});
Ext.reg('zarafa.navigationpanel', Zarafa.core.ui.NavigationPanel);
