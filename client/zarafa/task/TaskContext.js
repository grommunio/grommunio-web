/*
 * #dependsFile client/zarafa/task/TaskContextModel.js
 */
Ext.namespace('Zarafa.task');

/**
 * @class Zarafa.task.TaskContext
 * @extends Zarafa.core.Context
 *
 * Context that displays tasks. This context has only one view ie. grid view
 */
Zarafa.task.TaskContext = Ext.extend(Zarafa.core.Context, {
	// Insertion points for this class
	/**
	 * @insert main.maintoolbar.view.task
	 * Insertion point for populating the main toolbar with a View button. This item is only visible
	 * when this context is active.
	 * @param {Zarafa.mail.TaskContext} context This context
	 */

	/**
	 * When searching, this property marks the {@link Zarafa.core.Context#getCurrentView view}
	 * which was used before {@link #onSearchStart searching started} the view was switched to
	 * {@link Zarafa.task.data.Views#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldView : undefined,

	/**
	 * When searching, this property marks the {@link Zarafa.core.Context#getCurrentViewMode viewmode}
	 * which was used before {@link #onSearchStart searching started} the viewmode was switched to
	 * {@link Zarafa.task.data.ViewModes#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldViewMode : undefined,

	/**
	 * @constructor
	 * @param config
	 */
	constructor : function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			current_view : Zarafa.task.data.Views.LIST,
			current_view_mode : Zarafa.task.data.ViewModes.SIMPLE
		});

		// The tab in the top tabbar
		this.registerInsertionPoint('main.maintabbar.left', this.createMainTab, this);

		// The "New task" button which is available in all contexts
		this.registerInsertionPoint('main.maintoolbar.new.item', this.createToolbarNewTaskButton, this);
		// The "New task request" button which is available in all contexts
		this.registerInsertionPoint('main.maintoolbar.new.item', this.createToolbarNewTaskRequestButton, this);

		this.registerInsertionPoint('previewpanel.toolbar.left', this.createTaskRequestToolbarButtons, this);

		Zarafa.task.TaskContext.superclass.constructor.call(this, config);

		// Add a tree control showing a list of task folders to the navigation panel.
		// The control will be shown when the user selects the task context from the button panel.
		this.registerInsertionPoint('navigation.center', this.createTaskNavigationPanel, this);

		// Adds convert mail to task contextmenu item in the mail contextmenu.
		this.registerInsertionPoint('context.mail.contextmenu.actions', this.convertToTask, this);

		// Register task specific dialog types
		Zarafa.core.data.SharedComponentType.addProperty('task.dialogs.sendtaskrequestconfirmation');
		Zarafa.core.data.SharedComponentType.addProperty('task.dialogs.sendtaskrequestcancellation');
	},

	/**
	 * @return Zarafa.task.TaskContextModel the task context model
	 */
	getModel : function()
	{	if (!Ext.isDefined(this.model)) {
			this.model = new Zarafa.task.TaskContextModel();
			this.model.on({
				'searchstart' : this.onModelSearchStart,
				'searchstop' : this.onModelSearchStop,
				scope : this
			});
		}
		return this.model;
	},

	/**
	 * Event handler for the {@link #model}#{@link Zarafa.core.ContextModel#searchstart searchstart} event.
	 * This will {@link #switchView switch the view} to {@link Zarafa.task.data.Views#SEARCH search mode}.
	 * The previously active {@link #getCurrentView view} will be stored in the {@link #oldView} and will
	 * be recovered when the {@link #onModelSearchStop search is stopped}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchStart : function(model)
	{
		if(this.getCurrentView() !== Zarafa.task.data.Views.SEARCH && this.getCurrentViewMode() !== Zarafa.task.data.ViewModes.SEARCH){
			this.oldView = this.getCurrentView();
			this.oldViewMode = this.getCurrentViewMode();
			this.switchView(Zarafa.task.data.Views.SEARCH, Zarafa.task.data.ViewModes.SEARCH);
		}
	},

	/**
	 * Event handler for the {@link #model}#{@link Zarafa.core.ContextModel#searchstop searchstop} event.
	 * This will {@link #switchView switch the view} to the {@link #oldView previous view}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchStop : function(model)
	{
		this.switchView(this.oldView, this.oldViewMode);
		delete this.oldView;
		delete this.oldViewMode;
	},

	/**
	 * Bid on task folders.
	 * @param {Zarafa.Folder} folder which contains task items.
	 * @return {Number} return 1 if specified folder contains items of type IPF.Task else -1
	 * @method
	 */
	bid : function(folder)
	{

		// the folder contains items of type IPF.Task, return 1
		if (folder.isContainerClass('IPF.Task', true)) {
			return 1;
		}

		// return -1, don't handle this content type
		return -1;

	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		if (Array.isArray(record)) {
			record = record[0];
		}

		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.create']:
			case Zarafa.core.data.SharedComponentType['common.view']:
			case Zarafa.core.data.SharedComponentType['common.preview']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.isMessageClass('IPM.Task', true)) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['task.dialogs.sendtaskrequestconfirmation']:
			case Zarafa.core.data.SharedComponentType['task.dialogs.sendtaskrequestcancellation']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass('IPM.Task', true)) {
						bid = 1;
					}
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']: 
				if (record instanceof Zarafa.core.data.IPMRecord) {
					if(this.model.getDefaultFolder().isTodoListFolder()) {
						bid = 2;
					} else if(record.isMessageClass('IPM.Task', true)) {
						bid = 1;
					}
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.printer.renderer']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass([ 'IPM.Task' ], true)) {
						bid = 1;
					}
				} else if (record instanceof Zarafa.task.TaskContext) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel']:
				if (record instanceof Zarafa.hierarchy.data.MAPIFolderRecord) {
					if (record.isContainerClass('IPF.Task', true)) {
						bid = 1;
					}
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass('IPM.Task', true)) {
						bid = 1;
					}
				}
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.create']:
			case Zarafa.core.data.SharedComponentType['common.view']:
				component = Zarafa.task.dialogs.TaskEditContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.preview']:
				component = Zarafa.task.ui.TaskPreviewPanel;
				break;
			case Zarafa.core.data.SharedComponentType['task.dialogs.sendtaskrequestconfirmation']:
			case Zarafa.core.data.SharedComponentType['task.dialogs.sendtaskrequestcancellation']:
				component = Zarafa.task.dialogs.SendTaskRequestConfirmationContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
		  		component = Zarafa.task.ui.TaskContextMenu;
				break;	
			case Zarafa.core.data.SharedComponentType['common.printer.renderer']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
					component = Zarafa.task.printer.TaskRenderer;
				} else {
					component = Zarafa.task.printer.TaskListViewRenderer;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel']:
				component = Zarafa.task.attachitem.AttachTaskColumnModel;
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer']:
				component = Zarafa.task.attachitem.AttachTaskRenderer;
				break;
		}
		return component;
	},

	/**
	 * Creates the task tree that is shown when the user selects the task context from the
	 * button panel. It shows a tree of available task folders that can be checked and unchecked.
	 * @private
	 */
	createTaskNavigationPanel : function()
	{
		return {
			xtype : 'zarafa.contextnavigation',
			context : this,
			items : [{
				xtype : 'panel',
				id: 'zarafa-navigationpanel-tasks-navigation',
				cls: 'zarafa-context-navigation-block',
				layout: 'fit',
				items : [{
					xtype : 'zarafa.hierarchytreepanel',
					id: 'zarafa-navigationpanel-tasks-navigation-tree',
					model: this.getModel(),
					IPMFilter: 'IPF.Task',
					hideDeletedFolders : true,
					enableDD : true,
					enableItemDrop : true,
					deferredLoading : true,
					bbarConfig: {
						defaultSelectedSharedFolderType: Zarafa.hierarchy.data.SharedFolderTypes['TASK'],
						buttonText : _('Open Shared Tasks')
					}
				}]
			}]
		};
	},

	/**
	 * Obtain the {@link Zarafa.task.ui.taskPanel taskpanel} object
	 *
	 * @return {Zarafa.task.ui.taskPanel} The main panel which should
	 * be used within the {@link Zarafa.core.Context context}
	 */
	createContentPanel : function()
	{
		return {
			xtype : 'zarafa.taskmainpanel',
			id: 'zarafa-mainpanel-contentpanel-tasks',
			context : this
		};
	},

	/**
	 * Returns the buttons for the dropdown list of the VIEW-button in the main toolbar. It will use the 
	 * main.maintoolbar.view.task insertion point to allow other plugins to add their items at the end.
	 * 
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarViewButtons : function()
	{
		var items = container.populateInsertionPoint('main.maintoolbar.view.task', this) || [];

		var defaultItems = [{
			id: 'zarafa-maintoolbar-view-tasks-simple',
			text: _('Simple view'),
			overflowText: _('Simple view'),
			iconCls: 'icon_task_simple',
			valueView : Zarafa.task.data.Views.LIST,
			valueViewMode : Zarafa.task.data.ViewModes.SIMPLE,
			valueDataMode : Zarafa.task.data.DataModes.ALL,
			handler : this.onContextSelectView,
			scope : this
		},{
			id: 'zarafa-maintoolbar-view-tasks-detailed',
			text: _('Detailed view'),
			overflowText: _('Detailed view'),
			iconCls: 'icon_task_detailed',
			valueView : Zarafa.task.data.Views.LIST,
			valueViewMode : Zarafa.task.data.ViewModes.DETAILED,
			valueDataMode : Zarafa.task.data.DataModes.ALL,
			handler : this.onContextSelectView,
			scope : this
		}];

		return defaultItems.concat(items);
	},

	/** 
	 * Event handler which is fired when one of the View buttons 
	 * has been pressed. This will call {@link Zarafa.task.TaskContext#setView setView} 
	 * to update the view. 
	 * @param {Ext.Button} button The button which was pressed 
	 * @private 
	 */ 
	onContextSelectView : function(button)
	{
		this.getModel().setDataMode(button.valueDataMode);
		this.switchView(button.valueView, button.valueViewMode);
	},

	/**
	 * Create "New Task" {@link Ext.menu.MenuItem item} for the "New item"
	 * {@link Ext.menu.Menu menu} in the {@link Zarafa.core.ui.MainToolbar MainToolbar}.
	 * This button should be shown in all {@link Zarafa.core.Context contexts} and
	 * is used to create a new task. 
	 *
	 * @return {Object} The menu item for creating a new task item
	 * @static
	 */
	createToolbarNewTaskButton : function()
	{
		//create new task buttton.
		return {

			xtype	: 'menuitem',
			id: 'zarafa-maintoolbar-newitem-task',
			tooltip : _('Task')+' (Ctrl + Alt + K)',
			plugins : 'zarafa.menuitemtooltipplugin',
			text	: _('Task'),
			handler	: function(){
				Zarafa.task.Actions.openCreateTaskContent(this.getModel());
			},
			iconCls		: 'icon_createTask',
			newMenuIndex: 4,
			context: 'task',
			scope : this
		};
	},

	/**
	 * Create "New Task Request" {@link Ext.menu.MenuItem item} for the "New item"
	 * {@link Ext.menu.Menu menu} in the {@link Zarafa.core.ui.MainToolbar MainToolbar}.
	 * This button should be shown in all {@link Zarafa.core.Context contexts} and
	 * is used to create a new task request.
	 *
	 * @return {Object} The menu item for creating a new task request item
	 * @static
	 */
	createToolbarNewTaskRequestButton : function()
	{
		return {
			xtype : 'menuitem',
			id : 'zarafa-maintoolbar-newitem-task-request',
			tooltip : _('Task request'),
			plugins : 'zarafa.menuitemtooltipplugin',
			text : _('Task request'),
			handler : function(){
				Zarafa.task.Actions.openCreateTaskRequestContent(this.getModel());
			},
			iconCls : 'icon_createTaskRequest',
			newMenuIndex: 4,
			context: 'task',
			scope : this
		};
	},

	/**
	 * Populates the View button in the main toolbar
	 * @return {Array} items The menu items available for printing in this context
	 */
	getMainToolbarPrintButtons : function()
	{
		var items = container.populateInsertionPoint('main.toolbar.print.task', this) || [];
		
		var defaultItems = [{
			xtype: 'zarafa.conditionalitem',
			id: 'zarafa-maintoolbar-print-selectedtask',
			overflowText: _('Print selected task'),
			iconCls: 'icon_print_single_task',
			tooltip : _('Print selected task') + ' (Ctrl + P)',
			plugins : 'zarafa.menuitemtooltipplugin',
			text: _('Print selected task'),
			hideOnDisabled: false,
			singleSelectOnly : true,
			handler: this.onPrintSelected,
			scope: this
		},{
			overflowText: _('Print task list'),
			id: 'zarafa-maintoolbar-print-tasklist',
			iconCls: 'icon_print_task_list',
			tooltip : _('Print task list') + ' (Ctrl + Alt + P)',
			plugins : 'zarafa.menuitemtooltipplugin',
			text: _('Print task list'),
			handler: this.onPrintList,
			scope : this
		}];

		return defaultItems.concat(items);
	},

	/**
	 * Handler for printing the selected {@link Zarafa.core.data.MAPIRecord} record. Menu item is disabled if there is no record selected.
	 * Calls {@link Zarafa.common.Actions.openPrintDialog} openPrintDialog with the selected record.
	 * @private
	 */
	onPrintSelected : function()
	{
		var records = this.getModel().getSelectedRecords();
		if (Ext.isEmpty(records)) {
			Ext.MessageBox.alert(_('Print'), _('No task selected'));
			return;
		}
		Zarafa.common.Actions.openPrintDialog(records);
	},

	/**
	 * Handler for printing all {@link Zarafa.core.data.MAPIRecord} records in the current view.
	 * Calls {@link Zarafa.common.Actions.openPrintDialog} openPrintDialog with the current context.
	 * @private
	 */
	onPrintList : function(item)
	{
		Zarafa.common.Actions.openPrintDialog(this);
	},

	/**
	 * Adds a button to the top tab bar for this context.
	 * @return {Object} The button for the top tabbar 
	 * @private
	 */
	createMainTab: function()
	{
		return {
			text: this.getDisplayName(),
			tabOrderIndex: 5,
			context: this.getName(),
			id: 'mainmenu-button-tasks'
		};
	},

	/**
	 * Adds a new contextmenu item in the mail context, which converts an email to a task
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The Action context menu item
	 * @private
	 */
	convertToTask : function()
	{
		return {
			xtype: 'zarafa.conditionalitem',
			text : _('Create task'),
			iconCls : 'icon_createTask',
			singleSelectOnly: true,
			hidden: true,
			handler: this.onContextItemCreateTask,
			scope: this
		};
	},

	/**
	 * @param {Ext.Component} component The component to which the buttons will be added
	 * @return {Object} Configuration object containing a ButtonGroup which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createTaskRequestToolbarButtons : function(component)
	{
		return {
			xtype : 'zarafa.taskrequestbuttons'
		};
	},

	/**
	 * Event Handler triggered when {@link #convertToTask convert to task} context menu item is click. 
	 * function is used to convert email to task record 
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item context menu item 
	 * @param {Ext.EventObject} event The event information
	 * @private
	 */
	onContextItemCreateTask : function(menuItem, event)
	{
		var records = menuItem.getRecords();
		Zarafa.task.Actions.createTaskFromMail(records, this.getModel());
	}
});

Zarafa.onReady(function() {
	container.registerContext(new Zarafa.core.ContextMetaData({
		name : 'task',
		displayName : _('Tasks'),
		allowUserVisible : false,
		pluginConstructor : Zarafa.task.TaskContext
	}));
});
