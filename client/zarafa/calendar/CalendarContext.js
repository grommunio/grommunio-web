Ext.namespace('Zarafa.calendar');

/**
 * @class Zarafa.calendar.CalendarContext
 * @extends Zarafa.core.Context
 *
 * Calendar context. This provides a tool bar and specialised tree view with selectable appointment folders. The folder hierarchy
 * can show either a full list of folders, or a list of appointment folders (when the user clicks the calendar icon at the bottom
 * of the folder hierarchy).
 */
Zarafa.calendar.CalendarContext = Ext.extend(Zarafa.core.Context, {
	// Insertion points for this class
	/**
	 * @insert main.maintoolbar.view.calendar
	 * Insertion point for populating the main toolbar with a View button. This item is only visible
	 * when this context is active.
	 * @param {Zarafa.mail.CalendarContext} context This context
	 */

	/**
	 * The currently active zoom level for the calendar.
	 * @property
	 * @type Number
	 */
	default_zoom_level : undefined,

	/**
	 * When searching, this property marks the {@link Zarafa.core.Context#getCurrentView view}
	 * which was used before {@link #onSearchStart searching started} the view was switched to
	 * {@link Zarafa.calendar.data.Views#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldView : undefined,

	/**
	 * When searching, this property marks the {@link Zarafa.core.Context#getCurrentViewMode viewmode}
	 * which was used before {@link #onSearchStart searching started} the viewmode was switched to
	 * {@link Zarafa.calendar.data.ViewModes#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldViewMode : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			groupViewBtns : false,
			current_view : Zarafa.calendar.data.Views.BLOCKS,
			current_view_mode : Zarafa.calendar.data.ViewModes.DAYS
		});

		// The "New appointment" button which is available in all contexts
		this.registerInsertionPoint('main.maintoolbar.new.item', this.createNewAppointmentButton, this);
		// The "New meeting request" button which is available in all contexts
		this.registerInsertionPoint('main.maintoolbar.new.item', this.createNewMeetingRequestButton, this);

		// The tab in the top tabbar
		this.registerInsertionPoint('main.maintabbar.left', this.createMainTab, this);

		// Add a date picker control to the navigation panel.
		this.registerInsertionPoint('navigation.north', this.createDatePicker, this);

		// Add a tree control showing a list of calendar folders to the navigation panel.
		// The control will be shown when the user selects the calendar context from the button panel.
		this.registerInsertionPoint('navigation.center', this.createCalendarNavigationPanel, this);

		// Adds convert mail to appointment contextmenu item in the mail contextmenu.
		this.registerInsertionPoint('context.mail.contextmenu.topoptions', this.convertToAppointment, this);

		// Register the calendar category for the settings
		this.registerInsertionPoint('context.settings.categories', this.createSettingCategories, this);

		this.registerInsertionPoint('previewpanel.toolbar.right.first', this.getMeetingRequestToolbarButtons, this);
		this.registerInsertionPoint('previewpanel.toolbar.detaillinks', this.getMeetingRequestDetailLinks, this);

		// Add meeting request related button in the showmeeting ContentPanel
		this.registerInsertionPoint('context.mail.showmailcontentpanel.toolbar.actions.first', this.getMeetingRequestToolbarButtons, this);

		this.addEvents([
			/**
			 * @event zoomchange
			 * Fired when the zoom level has changed, some views support a zoom level being configured.
			 * @param {Zarafa.calendar.CalendarContext} context The context which fired the event
			 * @param {Number} zoomLevel The new zoomLevel.
			 * @param {Number} oldZoomLevel The previously configured zoomlevel.
			 */
			'zoomchange'
		]);

		Zarafa.calendar.CalendarContext.superclass.constructor.call(this, config);

		// Register calendar specific dialog types
		Zarafa.core.data.SharedComponentType.addProperty('calendar.dialogs.proposenewtimecontentpanel');
		Zarafa.core.data.SharedComponentType.addProperty('calendar.dialogs.sendmeetingrequestconfirmation');
		Zarafa.core.data.SharedComponentType.addProperty('calendar.dialogs.sendmeetingrequestcancellation');
	},

	/**
	 * Called before the context is switched in.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to show.
	 * @param {Boolean} suspended True to enable the ContextModel {@link Zarafa.core.ContextModel#suspendLoading suspended}
	 */
	enable : function(folder, suspended)
	{
		this.default_zoom_level = container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level');

		Zarafa.calendar.CalendarContext.superclass.enable.apply(this, arguments);
	},

	/**
	 * @return Zarafa.calendar.CalendarContextModel the calendar context model
	 */
	getModel : function()
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Zarafa.calendar.CalendarContextModel();
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
	 * This will {@link #switchView switch the view} to {@link Zarafa.calendar.data.Views#SEARCH search mode}.
	 * The previously active {@link #getCurrentView view} will be stored in the {@link #oldView} and will
	 * be recovered when the {@link #onModelSearchStop search is stopped}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchStart : function(model)
	{
		if(this.getCurrentView() != Zarafa.calendar.data.Views.SEARCH && this.getCurrentViewMode() != Zarafa.calendar.data.ViewModes.SEARCH){
			this.oldView = this.getCurrentView();
			this.oldViewMode = this.getCurrentViewMode();
			this.switchView(Zarafa.calendar.data.Views.SEARCH, Zarafa.calendar.data.ViewModes.SEARCH);
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
	 * Update the zoomLevel {@link Zarafa.settings.SettingsModel setting}
	 * for the currently active {@link #current_view view}.
	 * @param {Number} zoomLevel The new zoomLevel.
	 * @param {Boolean} init (optional) True when this function is called during initialization
	 * and it should force the change of the zoom level
	 */
	setZoomLevel : function(zoomLevel, init)
	{
		if (init === true || this.default_zoom_level !== zoomLevel) {
			var oldZoomLevel = this.default_zoom_level;
			this.default_zoom_level = zoomLevel;

			this.fireEvent('zoomchange', this, this.default_zoom_level, oldZoomLevel);
		}
	},

	/**
	 * Update the zoomLevel {@link Zarafa.settings.SettingsModel setting}.
	 * @return {Number} the zoom level
	 */
	getZoomLevel : function(zoomLevel)
	{
		return this.default_zoom_level;
	},

	/**
	 * Enable the calendar panel when a context switch happens and the folder is an appointment folder.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to bid on.
	 * @return {Number} returns a number which is used for bidding for a folder, highest bidder will be allowed to show the contents
	 */
	bid : function(folder)
	{
		// If the folder contains items of type IPF.Appointment then the calendar context applies
		if (folder.isContainerClass('IPF.Appointment', true)) {
			return 1;
		}

		// return -1, don't know this content types
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

		switch(type) {
			case Zarafa.core.data.SharedComponentType['common.create']:
			case Zarafa.core.data.SharedComponentType['common.view']:
			case Zarafa.core.data.SharedComponentType['common.preview']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass([ 'IPM.Appointment', 'IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}' ], true)) {
						bid = 1;
					} else {
						bid = -1;
					}
				}
				break;
			case Zarafa.core.data.SharedComponentType['calendar.dialogs.sendmeetingrequestconfirmation']:
			case Zarafa.core.data.SharedComponentType['calendar.dialogs.sendmeetingrequestcancellation']:
			case Zarafa.core.data.SharedComponentType['calendar.dialogs.proposenewtimecontentpanel']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass([ 'IPM.Appointment', 'IPM.Schedule.Meeting', 'IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}' ], true)) {
						bid = 1;
					}
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.printer.renderer']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass([ 'IPM.Appointment', 'IPM.Schedule.Meeting', 'IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}' ], true)) {
						bid = 1;
					}
				} else if (record instanceof Zarafa.calendar.CalendarContext) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				if (!record) {
					bid = 1;
				} else if (record instanceof Zarafa.core.data.MessageRecord && record.isMessageClass(['IPM.Appointment', 'IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}'], true)) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel']:
				if (record instanceof Zarafa.hierarchy.data.MAPIFolderRecord) {
					if (record.isContainerClass('IPF.Appointment', true)) {
						bid = 1;
					}
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass([ 'IPM.Appointment', 'IPM.Schedule.Meeting' ], true)) {
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
		switch(type) {
			case Zarafa.core.data.SharedComponentType['common.create']:
			case Zarafa.core.data.SharedComponentType['common.view']:
				component = Zarafa.calendar.dialogs.AppointmentContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.preview']:
				component = Zarafa.calendar.ui.AppointmentPreviewPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				component = Zarafa.calendar.ui.CalendarContextMenu;
				break;
			case Zarafa.core.data.SharedComponentType['calendar.dialogs.proposenewtimecontentpanel']:
				component = Zarafa.calendar.dialogs.ProposeNewTimeContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['calendar.dialogs.sendmeetingrequestconfirmation']:
				component = Zarafa.calendar.dialogs.SendMeetingRequestConfirmationContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['calendar.dialogs.sendmeetingrequestcancellation']:
				component = Zarafa.calendar.dialogs.SendMeetingRequestCancellationContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.printer.renderer']:
				if (record instanceof Zarafa.core.data.IPMRecord) {
					component = Zarafa.calendar.printer.MeetingRenderer;
				} else {
					// see if we have a view before getModel() ?
					switch (record.getModel().getCurrentDataMode()) {
						case Zarafa.calendar.data.DataModes.WORKWEEK:
							component = Zarafa.calendar.printer.WorkWeekViewRenderer;
							break;
						case Zarafa.calendar.data.DataModes.WEEK:
							component = Zarafa.calendar.printer.WeekViewRenderer;
							break;
						case Zarafa.calendar.data.DataModes.DAY:
							component = Zarafa.calendar.printer.DaysViewRenderer;
							break;
						case Zarafa.calendar.data.DataModes.MONTH:
							component = Zarafa.calendar.printer.MonthViewRenderer;
							break;
						case Zarafa.calendar.data.DataModes.ALL:
							component = Zarafa.calendar.printer.ListViewRenderer;
							break;
					}
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel']:
				component = Zarafa.calendar.attachitem.AttachCalendarColumnModel;
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer']:
				component = Zarafa.calendar.attachitem.AttachCalendarRenderer;
				break;
		}
		return component;
	},

	/**
	 * Creates the calendar tree that is shown when the user selects the calendar context from the
	 * button panel. It shows a tree of available appointment folders that can be checked and unchecked,
	 * allowing the user to open multiple calendars side-by-side.
	 * @private
	 */
	createCalendarNavigationPanel : function()
	{
		return {
			xtype : 'zarafa.contextnavigation',
			context : this,
			items : [{
				xtype : 'panel',
				id: 'zarafa-navigationpanel-calendar-navigation',
				cls: 'zarafa-context-navigation-block',
				layout: 'fit',
				items : [{
					xtype : 'zarafa.multiselecthierarchytree',
					id: 'zarafa-navigationpanel-calendar-navigation-tree',
					ref : '../../multiSelectHierarchyTree',
					model: this.getModel(),
					IPMFilter: 'IPF.Appointment',
					hideDeletedFolders : true,
					multiSelect: true,
					enableDD : true,
					enableItemDrop : true,
					deferredLoading : true,
					colored : true,
					bbarConfig: {
						defaultSelectedSharedFolderType: Zarafa.hierarchy.data.SharedFolderTypes['APPOINTMENT'],
						buttonText : _('Add Shared Calendar')
					}
				}]
			}]
		};
	},

	/**
	 * Create a {@link Zarafa.calendar.ui.DatePicker DatePicker} panel which can
	 * be used by the user to select a particular date.
	 * @return {Zarafa.calendar.ui.DatePicker} The date picker.
	 */
	createDatePicker : function()
	{
		var picker = new Zarafa.calendar.ui.DatePicker({
			id: 'zarafa-navigationpanel-calendar-datepicker',
			navigationContext: this,
			showWeekNumber: true,
			showToday : true,
			width:'100%',
			handler : function (picker, date) {
				this.getModel().setDate(date);
			},
			scope : this
		});

		this.getModel().on('datechange', function(model, date) { this.setValue(date); }, picker);

		return picker;
	},

	/**
	 * @param {Ext.Component} component The component to which the buttons will be added
	 * @return {Object} Configuration object containing a ButtonGroup which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	getMeetingRequestToolbarButtons : function(component)
	{
		return {
			xtype : 'zarafa.meetingrequestbuttons'
		};
	},

	/**
	 * @param {Ext.Component} component The component to which the panel will be added
	 * @return {Object} Configuration object containing the details which should be
	 * added into the {@link Zarafa.core.ui.PreviewPanel}.
	 * @private
	 */
	getMeetingRequestDetailLinks : function(component)
	{
		return {
			xtype : 'zarafa.meetinginfo'
		};
	},

	/**
	 * Creates the main panel for this context.
	 * @return {Zarafa.calendar.ui.CalendarMainPanel} main panel.
	 */
	createContentPanel : function()
	{
		return {
			xtype: 'zarafa.calendarmainpanel',
			id: 'zarafa-mainpanel-contentpanel-calendar',
			context: this
		};
	},

	/**
	 * Returns the buttons for the dropdown list of the VIEW-button in the main toolbar. It will use the
	 * main.maintoolbar.view.calendar insertion point to allow other plugins to add their items at the end.
	 *
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarViewButtons : function()
	{
		var items = container.populateInsertionPoint('main.maintoolbar.view.calendar', this) || [];
		var defaultItems = [{
			id: 'zarafa-maintoolbar-view-calendar-day',
			text : _('Day'),
			iconCls : 'icon_large_calendar_view_day',
			ref : 'calendarDay',
			valueView : Zarafa.calendar.data.Views.BLOCKS,
			valueViewMode : Zarafa.calendar.data.ViewModes.DAYS,
			valueDataMode : Zarafa.calendar.data.DataModes.DAY,
			handler : this.onContextSelectView,
			scope : this
		},{
			id: 'zarafa-maintoolbar-view-calendar-workweek',
			text : _('Workweek'),
			iconCls : 'icon_large_calendar_view_workweek',
			ref : 'calendarWorkweek',
			valueView : Zarafa.calendar.data.Views.BLOCKS,
			valueViewMode : Zarafa.calendar.data.ViewModes.DAYS,
			valueDataMode : Zarafa.calendar.data.DataModes.WORKWEEK,
			handler : this.onContextSelectView,
			scope : this
		},{
			id: 'zarafa-maintoolbar-view-calendar-week',
			text : _('Week'),
			iconCls : 'icon_large_calendar_view_week',
			ref : 'calendarWeek',
			valueView : Zarafa.calendar.data.Views.BLOCKS,
			valueViewMode : Zarafa.calendar.data.ViewModes.DAYS,
			valueDataMode : Zarafa.calendar.data.DataModes.WEEK,
			handler : this.onContextSelectView,
			scope : this
		},{
			id: 'zarafa-maintoolbar-view-calendar-month',
			text : _('Month'),
			iconCls : 'icon_large_calendar_view_month',
			ref : 'calendarMonth',
			valueView : Zarafa.calendar.data.Views.BLOCKS,
			valueViewMode : Zarafa.calendar.data.ViewModes.BOX,
			valueDataMode : Zarafa.calendar.data.DataModes.MONTH,
			handler : this.onContextSelectView,
			scope : this
		},{
			id: 'zarafa-maintoolbar-view-calendar-list',
			text : _('List'),
			iconCls : 'icon_large_list_view',
			ref : 'calendarList',
			valueView : Zarafa.calendar.data.Views.LIST,
			valueViewMode : Zarafa.calendar.data.ViewModes.LIST,
			valueDataMode : Zarafa.calendar.data.DataModes.ALL,
			handler : this.onContextSelectView,
			scope: this
		}];

		return defaultItems.concat(items);
	},

	/**
	 * Event handler which is fired when one of the View buttons
	 * has been pressed. This will call {@link #switchView switchView}
	 * to update the view.
	 * @param {Ext.Button} button The button which was pressed
	 * @private
	 */
	onContextSelectView : function(button)
	{
		this.switchView(button.valueView, button.valueViewMode);
		this.getModel().setDataMode(button.valueDataMode);
	},

	/**
	 * Determines whether the passed button has to be shown or not based on what
	 * {@link Zarafa.core.Context Context} is active. If no Context is supplied as an argument it
	 * will get that from the {@link Zarafa.core.Container container}.
	 * @param {Ext.Button} btn The button
	 * @param {Zarafa.core.Context} activeContext (Optionial} The active Context
	 * @private
	 */
	setVisiblityMainToolbarButton: function(btn, activeContext)
	{
		activeContext = activeContext || container.getCurrentContext();
		var viewId = activeContext.getCurrentView();
		if(activeContext === this && viewId == Zarafa.calendar.data.Views.BLOCKS){
			btn.show();
		}else{
			btn.hide();
		}
	},

	/**
	 * Create "New Appointment" button for the "New item" menu in the toolbar.
	 * @return {Object} The menu item for creating a new Appointment
	 * @static
	 */
	createNewAppointmentButton: function()
	{
		return {
			xtype: 'menuitem',
			id: 'zarafa-maintoolbar-newitem-appointment',
			tooltip: _('Appointment') + ' (Ctrl + Alt + A)',
			plugins : 'zarafa.menuitemtooltipplugin',
			text: _('Appointment'),
			handler: function()
			{
				Zarafa.calendar.Actions.openCreateAppointmentContent(this.getModel());
			},
			scope: this,
			iconCls: 'icon_new_appointment',
			newMenuIndex: 2,
			context: 'calendar'
		};
	},

	/**
	 * Create "New meeting request" button for the "New item" menu in the toolbar.
	 * @return {Object} The menu item for creating a new Meeting Request
	 * @static
	 */
	createNewMeetingRequestButton: function()
	{
		return {
			xtype: 'menuitem',
			id: 'zarafa-maintoolbar-newitem-meetingrequest',
			tooltip : _('Meeting request')+' (Ctrl + Alt + V)',
			plugins : 'zarafa.menuitemtooltipplugin',
			text: _('Meeting request'),
			handler: function()
			{
				Zarafa.calendar.Actions.openCreateMeetingRequestContent(this.getModel());
			},
			scope: this,
			iconCls: 'icon_new_meeting_request',
			newMenuIndex: 2
		};
	},

	/**
	 * Populates the View button in the main.toolbar.print.calendar insertion point
	 * @return {Object[]} items The configuration objects of the menu items available for printing in this context
	 */
	getMainToolbarPrintButtons : function()
	{
		var items = container.populateInsertionPoint('main.toolbar.print.calendar', this) || [];

		var defaultItems = [{
			xtype: 'zarafa.conditionalitem',
			id: 'zarafa-maintoolbar-print-selectedappointment',
			overflowText: _('Print selected appointment'),
			iconCls: 'icon_print_appt',
			tooltip : _('Print selected appointment') + ' (Ctrl + P)',
			plugins : 'zarafa.menuitemtooltipplugin',
			text: _('Print selected appointment'),
			hideOnDisabled: false,
			singleSelectOnly: true,
			handler: this.onPrintSelected,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			id: 'zarafa-maintoolbar-print-calendaroverview',
			overflowText: _('Print overview'),
			iconCls: 'icon_print',
			text: _('Print overview'),
			tooltip : _('Print overview') + ' (Ctrl + Alt + P)',
			plugins : 'zarafa.menuitemtooltipplugin',
			handler: this.onPrintView,
			scope: this,
			hideOnDisabled: false
		}];

		return defaultItems.concat(items);
	},

	/**
	 * Handler invoked when the 'print selected' button in the main toolbar is pressed.
	 * Prints the selected {@link Zarafa.core.data.MAPIRecord} record. Menu item is disabled if there is no record selected.
	 * Calls {@link Zarafa.common.Actions#openPrintDialog} openPrintDialog with the selected record.
	 * @private
	 */
	onPrintSelected : function ()
	{
		var records = this.getModel().getSelectedRecords();
		if (Ext.isEmpty(records)) {
			Ext.MessageBox.alert(_('Print'), _('No appointment selected'));
			return;
		}
		Zarafa.common.Actions.openPrintDialog(records);
	},

	/**
	 * Handler for printing the entire view. The current context is passed to {@link Zarafa.common.Actions#openPrintDialog}
	 * @private
	 */
	onPrintView : function ()
	{
		Zarafa.common.Actions.openPrintDialog(this);
	},

	/**
	 * Create the mail {@link Zarafa.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Zarafa.settings.SettingsContext}. This will create new
	 * {@link Zarafa.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Zarafa.calendar.ui.SettingsCalendarCategory Calendar}
	 * in the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Zarafa.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Zarafa.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createSettingCategories: function(insertionName, settingsMainPanel, settingsContext)
	{
		return [{
			xtype : 'zarafa.settingscalendarcategory',
			settingsContext : settingsContext
		}];
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
			tabOrderIndex: 3,
			context: this.getName(),
			id: 'mainmenu-button-calendar'
		};
	},

	/**
	 * Adds a new contextmenu item in the mail context, which converts an email to an appointment
	 * @return {Zarafa.core.ui.menu.ConditionalItem} The Action context menu item
	 * @private
	 */
	convertToAppointment : function()
	{
		return {
			xtype: 'zarafa.conditionalitem',
			text : _('Create Appointment'),
			iconCls : 'icon_new_appointment',
			hidden: true,
			handler: this.onContextItemCreateAppointment,
			beforeShow: this.onBeforeShowCreateAppointment,
			scope: this
		};
	},

	/**
	 * Event Handler triggered when {@link #convertToAppointment convert to
	 * appointment} context menu item is clicked.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item context menu item
	 * @private
	 */
	onContextItemCreateAppointment : function(menuItem)
	{
		Zarafa.calendar.Actions.createAppointmentFromMail(menuItem.getRecords(), this.getModel());
	},

	/**
	 * onBeforeShow handler which disables showing the convert to appointment menuitem
	 * when a single item is selected and it's a mail item.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item context menu item
	 * @private
	 */
	onBeforeShowCreateAppointment : function(menuItem)
	{
		var records = menuItem.getRecords();
		if (Array.isArray(records) && records.length === 1) {
			menuItem.setVisible(records[0].isMessageClass('IPM.Note'));
		} else {
			menuItem.setVisible(false);
		}
	}
});

Zarafa.onReady(function() {
	container.registerContext(new Zarafa.core.ContextMetaData({
		name : 'calendar',
		displayName: _('Calendar'),
		allowUserVisible : false,
		pluginConstructor : Zarafa.calendar.CalendarContext
	}));
});
