Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.AbstractCalendarView
 * @extends Zarafa.core.ui.View
 *
 * Base class for calendar views. It supports containing multiple {@link Zarafa.hierarchy.data.MAPIFolderRecord folders},
 * and can display the different folders side-by-side using {@link Zarafa.calendar.ui.CalendarTabView tabs}.
 *
 * TODO refactor the use of separate startDate, dueDate parameters in the events to use the DateRange object.
 */
Zarafa.calendar.ui.AbstractCalendarView = Ext.extend(Zarafa.core.ui.View, {
	/**
	 * @cfg {Zarafa.calendar.ui.DateRangeSelectionModel} rangeSelectionModel The selection model
	 * used for selecting a particular {@link Zarafa.core.DateRange daterange}.
	 */
	rangeSelectionModel : undefined,

	/**
	 * @cfg {Zarafa.calendar.ui.AppointmentSelectionModel} selectionModel The selection model
	 * used for selecting {@link Zarafa.core.data.IPMRecord records}.
	 */
	selectionModel : undefined,

	/**
	 * @cfg {Zarafa.calendar.CalendarContextModel} contextModel A reference to the context model of the parent view
	 */
	contextModel : undefined,

	/**
	 * The array of {@link Zarafa.hierarchy.data.MAPIFolderRecord folders} which are opened
	 * by this {@link Zarafa.core.ui.View view}.
	 * @property
	 * @type Array
	 */
	folders : undefined,

	/**
	 * The currently selected {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} within
	 * this {@link Zarafa.core.ui.View view}. If set, this must be an element
	 * from the {@link #folders} array.
	 * @property
	 * @type Zarafa.hierarchy.data.MAPIFolderRecord
	 */
	selectedFolder : undefined,

	/**
	 * The array of {@link Zarafa.calendar.ui.CalendarTabView tabs} which
	 * are visible within this {@link Zarafa.core.ui.View view}. Each
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} from the {@link #folders} array
	 * will have one {@link Zarafa.calendar.ui.CalendarTabView tab} assigned
	 * to it.
	 * @property
	 * @type Zarafa.calendar.ui.CalendarTabView
	 */
	tabs : undefined,

	/**
	 * The {@link Zarafa.calendar.ui.SelectionRangeView view} element which displays
	 * the currently selected period in this calendar {@link Zarafa.core.ui.View view}.
	 * @property
	 * @type Zarafa.calendar.ui.SelectionRangeView
	 */
	selectionView : undefined,

	/**
	 * The {@link Zarafa.calendar.ui.TextEditView view} which is enabled when the
	 * user starts typing after selecting a period. Using this view we add support
	 * for the quick-appointments which are placed into the calendar.
	 * @property
	 * @type Zarafa.calendar.ui.TextEditView
	 */
	textEditView : undefined,

	/**
	 * The array of {@link Zarafa.calendar.ui.AppointmentView appointments} which
	 * are visible within this calendar view.
	 * @property
	 * @type Array
	 */
	appointments : undefined,

	/**
	 * The offset all elements must have from the left side of the {@link #container}. This
	 * offset is configured before {@link #layout} by {@link #setLeftMargin}.
	 * @property
	 * @type Number
	 */
	leftOffset : 0,

	/**
	 * The total with for the tab to use. This must at least be the result of {@link #getMinimumWidth}.
	 * This is configured before {@link #layout} by {@link #setWidth}.
	 * @property
	 * @type Number
	 */
	width: 0,

	/**
	 * @cfg {Number} appointmentBodyLeftMargin The left margin which must be applied to
	 * the {@link Zarafa.calendar.ui.AppointmentView appointments} which are renderd within this
	 * calendar when the 'useMargin' argument to {@link #dateRangeToBodyBounds} is true.
	 */
	appointmentBodyLeftMargin : 0,

	/**
	 * @cfg {Number} appointmentBodyRightMargin The right margin which must be applied to
	 * the {@link Zarafa.calendar.ui.AppointmentView appointments} which are rendered within this
	 * calendar when the 'useMargin' argument to {@link #dateRangeToBodyBounds} is true.
	 */
	appointmentBodyRightMargin : 0,

	/**
	 * @cfg {Number} appointmentHeaderLeftMargins The left margin which must be applied to
	 * the {@link Zarafa.calendar.ui.AppointmentView appointments} which are rendered within
	 * the header of this calendar when the 'useMargin' argument to {@link #dateRangeToHeaderBounds} is true.
	 */
	appointmentHeaderLeftMargin : 6,

	/**
	 * @cfg {Number} appointmentHeaderRightMargins The right margin which must be applied to
	 * the {@link Zarafa.calendar.ui.AppointmentView appointments} which are rendered within
	 * the header of this calendar when the 'useMargin' argument to {@link #dateRangeToHeaderBounds} is true.
	 */
	appointmentHeaderRightMargin : 6,

	/**
	 * The body part of the calendar. This contains the view in which all {@link #appointments}
	 * are displayed. This field is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	body : undefined,

	/**
	 * The header part of the calendar. This contains extra information (like the day, or weekday).
	 * This field is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	header : undefined,

	/**
	 * The left border of the {@link #header}.
	 * This field is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	headerBorderLeft : undefined,

	/**
	 * The right border of the {@link #header}.
	 * This field is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	headerBorderRight : undefined,

	/**
	 * The left border of the {@link #body}.
	 * This field is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	borderLeft : undefined,

	/**
	 * The right border of the {@link #body}.
	 * This field is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	borderRight : undefined,

	/**
	 * The bottom border of the {@link #body}.
	 * This field is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	borderBottom : undefined,

	/**
	 * The tab area in which the {@link #tabs} will be rendered.
	 * This field is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	tabArea : undefined,

	/**
	 * @cfg {Boolean} enableDD true to enable drag & drop in both body and header
	 */
	enableDD : false,

	/**
	 * @cfg {Boolean} enableBodyDD true to enable drag and drop in the body
	 */
	enableBodyDD : false,

	/**
	 * @cfg {Boolean} enableHeaderDD true to enable drag and drop in the header
	 */
	enableHeaderDD : false,

	/**
	 * @cfg {Boolean} enableBodyDrag true to enable just drag in the body
	 */
	enableBodyDrag : false,

	/**
	 * @cfg {Boolean} enableHeaderDrag true to enable just drag in the header
	 */
	enableHeaderDrag : false,

	/**
	 * @cfg {Boolean} enableBodyDrop true to enable just drop in the body
	 */
	enableBodyDrop : false,

	/**
	 * @cfg {Boolean} enableHeaderDrop true to enable just drop in the body
	 */
	enableHeaderDrop : false,

	/**
	 * @cfg {String} ddGroup The DD group this TreePanel belongs to
	 */
	ddGroup : 'AppointmentDD',

	/**
	 * The DragZone which will be installed on the {@link #body}. This is initialized
	 * when either {@link #enableBodyDD} or {@link #enableBodyDrag} is enabled. It can optionally
	 * be configured using {@link #bodyDragConfig}.
	 * @property
	 * @type Zarafa.calendar.ui.CalendarViewDragZone
	 * @private
	 */
	bodyDragZone : undefined,

	/**
	 * @cfg {Object} bodyDragConfig Configuration object which will be used to initialize
	 * the {@link #bodyDragZone} when either {@link #enableBodyDD} or {@link #enableBodyDrag} is enabled.
	 */
	bodyDragConfig : undefined,

	/**
	 * The DropZone which will be installed on the {@link #body}. This is initialized
	 * when either {@link #enableBodyDD} or {@link #enableBodyDrop} is enabled. It can optionally
	 * be configured using {@link #bodyDropConfig}.
	 * @property
	 * @type Zarafa.calendar.ui.CalendarViewDropZone
	 * @private
	 */
	bodyDropZone : undefined,

	/**
	 * @cfg {Object} bodyDropConfig Configuration object which will be used to initialize
	 * the {@link #bodyDropZone} when either {@link #enableBodyDD} or {@link #enableBodyDrop} is enabled.
	 */
	bodyDropConfig : undefined,

	/**
	 * The DragZone which will be installed on the {@link #header}. This is initialized
	 * when either {@link #enableHeaderDD} or {@link #enableHeaderDrag} is enabled. It can optionally
	 * be configured using {@link #headerDragConfig}.
	 * @property
	 * @type Zarafa.calendar.ui.CalendarViewDragZone
	 * @private
	 */
	headerDragZone : undefined,

	/**
	 * @cfg {Object} headerDragConfig Configuration object which will be used to initialize
	 * the {@link #headerDragZone} when either {@link #enableHeaderDD} or {@link #enableHeaderDrag} is enabled.
	 */
	headerDragConfig : undefined,

	/**
	 * The DropZone which will be installed on the {@link #header}. This is initialized
	 * when either {@link #enableHeaderDD} or {@link #enableHeaderDrop} is enabled. It can optionally
	 * be configured using {@link #headerDropConfig}.
	 * @property
	 * @type Zarafa.calendar.ui.CalendarViewDropZone
	 * @private
	 */
	headerDropZone : undefined,

	/**
	 * @cfg {Object} headerDropConfig Configuration object which will be used to initialize
	 * the {@link #headerDropZone} when either {@link #enableHeaderDD} or {@link #enableHeaderDrop} is enabled.
	 */
	headerDropConfig : undefined,

	/**
	 * @cfg {String} groupId The unique identifier for the {@link Zarafa.core.MultiFolderContextModel#getGroupings group}
	 * which refers to this calendar and the group of {@link #folders}.
	 */
	groupId : undefined,

	/**
	 * @cfg {Boolean} active Flag whether this view is the currently active one inside the {@link Zarafa.calenaar.CalendarMultiView}
	 * There is one active group, but each group has a selected calendar in it
	 */
	active : false,

	/**
	 * The active tab stroke which will show stroke on top of the active calendar tabs
	 * This field is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	activeTabStroke : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			baseCls : 'zarafa-calendar'
		});

		// define drag/drop events
		this.addEvents(
			/**
			 * @event appointmentcalendardrop
			 * Fires when an appointment is dragged from this calendar component onto another.
			 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
			 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} source The calendar from where the appointment was dragged
			 * @param {Zarafa.calendar.AppointmentRecord} appointment the appointment record that was dropped
			 * @param {Zarafa.core.DateRange} dateRange The new daterange for the appointment
			 * @param {Ext.EventObject} event The original event object
			 */
			'appointmentcalendardrop',
			/**
			 * @event appointmentmouseover
			 * Fires when the mouse is being mover over an appointment.
			 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
			 * @param {Zarafa.calendar.AppointmentRecord} record The appointment over which the mouse is moving
			 * @param {Ext.EventObject} event The original event object
			 */
			'appointmentmouseover',
			/**
			 * @event appointmentmouseover
			 * Fires when the mouse is being mover away from an appointment.
			 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
			 * @param {Zarafa.calendar.AppointmentRecord} record The appointment over which the mouse has moved out
			 * @param {Ext.EventObject} event The original event object
			 */
			'appointmentmouseout',
			/**
			 * @event appointmentmove
			 * Fires when an appointment has been moved.
			 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
			 * @param {Zarafa.calendar.AppointmentRecord} appointment the appointment record that was moved
			 * @param {Zarafa.core.DateRange} dateRange The new daterange for the appointment
			 * @param {Ext.EventObject} event The original event object
			 */
			'appointmentmove',
			/**
			 * @event appointmentresize
			 * Fires when an appointment has been resized. Resizing in this context means that either the start
			 * date or the due date has been changed.
			 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
			 * @param {Zarafa.calendar.AppointmentRecord} appointment the appointment record that was resized
			 * @param {Zarafa.core.DateRange} dateRange The new daterange for the appointment
			 * @param {Ext.EventObject} event The original event object
			 */
			'appointmentresize',
			/**
			 * @event appointmentcreate
			 * Fires when an appointment has been created.
			 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
			 * @param {Zarafa.core.DateRange} appointment date range.
			 * @param {String} text appointment description text
			 */
			'appointmentcreate',

			/**
			 * @event appointmentinitdrag
			 * Fired when the user has started dragging an appointment
			 * This means that the user held the mouse down over an appointment
			 * either for a long enough period, or started dragging with the mouse down
			 * This event is passed up to the {@link Zarafa.calendar.ui.CalendarPanel}
			 *
			 * @param {Zarafa.calendar.ui.CalendarMultiView} multiview The Calendar MultiView which fired the event
			 * @param {Ext.EventObject} event The mouse event
			 * @param {Zarafa.calendar.ui.AppointmentView} The appointment on which the event occurred
			 */
			'appointmentinitdrag',

			/**
			 * @event appointmentenddrag
			 * Fired when the user drops a previously dragged appointment
			 * i.e. released the mouse.
			 *
			 * @param {Zarafa.calendar.ui.CalendarMultiView} multiview The Calendar MultiView which fired the event
			 * @param {Ext.EventObject} event The mouse event
			 * @param {Zarafa.calendar.ui.AppointmentView} The appointment on which the event occurred
			 */
			'appointmentenddrag',

			/**
			 * @event contextmenu
			 * Fires when the user right-clicks on an appointment
			 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar Calendar view
			 * @param {Ext.EventObject} event right-click event.
			 * @param {Ext.Record} appointment record
			 * @param {Zarafa.core.DateRange} range The Datarange on which the contextmenu
			 * was invoked. This is only provided when the event didn't occur on a record.
			 */
			'contextmenu',
			/**
			 * @event dblclick
			 * Fires when the user double-clicks on on an appointment.
			 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar Calendar view
			 * @param {Ext.EventObject} event right-click event.
			 * @param {Ext.data.Record} record appointment record.
			 */
			'dblclick',
			/**
			 * @event dayclick
			 * Fires when a user clicks on the header of a day, or on the expand button in the box view.
			 * @param {Zarafa.core.ui.View} source event source
			 * @param {Date} date date of the day.
			 */
			'dayclick',
			/**
			 * @event activate
			 * Fires when the user clicks the tab body, indicating that the corresponding tab must be activated.
			 * @param {Zarafa.core.ui.View} source event source
			 * @param {MAPIFolder} folder The activated folder.
			 */
			'activate',
			/**
			 * @event merge
			 * Fires when the user clicks the left arrow in a tab, indicating that the corresponding folder should be merged left.
			 * @param {Zarafa.core.ui.View} source event source
			 * @param {MAPIFolder} folder The folder which is being merged
			 */
			'merge',
			/**
			 * @event merge
			 * Fires when the user clicks the right arrow in a tab, indicating that the corresponding folder should be separated and placed into a new view.
			 * @param {Zarafa.core.ui.View} source event source
			 * @param {MAPIFolder} folder The folder which is being separated
			 */
			'separate',
			/**
			 * @event close
			 * Fires when the user clicks the close icon in a tab.
			 * @param {Zarafa.core.ui.View} source event source
			 * @param {MAPIFolder} folder The folder which is being closed
			 */
			'close'
		);

		Zarafa.calendar.ui.AbstractCalendarView.superclass.constructor.call(this, config);
	},

	/**
	 * Initialises the view.
	 * @protected
	 */
	init : function()
	{
		// super.init
		Zarafa.calendar.ui.AbstractCalendarView.superclass.init.call(this);

		this.folders = [];
		this.tabs = {};
		this.appointments = [];

		// create a selection view
		this.selectionView = this.createAppointmentProxy();
		this.selectionView.setVisible(false);
		this.addChildView(this.selectionView);

		// create a text edit view
		this.textEditView = new Zarafa.calendar.ui.TextEditView();
		this.mon(this.textEditView, 'textentered', this.onTextEntered, this);
		this.addChildView(this.textEditView);

		// hook selection model
		this.mon(this.selectionModel, 'appointmentselect', this.onAppointmentSelect, this);
		this.mon(this.selectionModel, 'appointmentdeselect', this.onAppointmentDeselect, this);
		this.mon(this.selectionModel, 'selectionclear', this.onAppointmentSelectionClear, this);
		this.mon(this.rangeSelectionModel, 'selectionchange', this.onRangeSelectionChange, this);

	},

	/**
	 * Adds a MAPI folder to this calendar view. A new tab view is automatically created and added to
	 * the tab strip at the top of the view.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to add to this view.
	 */
	addFolder : function(folder)
	{
		// Add the folder to the list.
		this.folders.push(folder);

		// Create a new Tab view to visually represent the new folder in the tab strip at the
		// top of the calendar view.
		var tab = new Zarafa.calendar.ui.CalendarTabView({
			parentView: this,
			folder : folder
		});

		// Hook event handlers to the newly created tab view.
		this.mon(tab, 'merge', this.onTabMerge, this);
		this.mon(tab, 'separate', this.onTabSeparate, this);
		this.mon(tab, 'close', this.onTabClose, this);
		this.mon(tab, 'click', this.onTabClick, this);

		// If this view has been rendered, render the tab. If the view has not been rendered yet,
		// the tab will be rendered automatically in the render() method through Zarafa.core.ui.View::renderChildren().
		if (this.rendered) {
			tab.render(this.container);
		}

		// Finally add the tab view to the local tab view hash.
		this.tabs[folder.get('entryid')] = tab;

		this.setSelectedFolder(folder);
	},

	/**
	 * Removes a MAPI folder from this calendar view. Automatically removes and destroys the associated tab view.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to remove from this view.
	 */
	removeFolder : function(folder)
	{
		return this.removeFolderById(folder.get('entryid'));
	},

	/**
	 * Removes a MAPI folder from this calendar view. Automatically removes and destroys the associated tab view.
	 * @param {string} id MAPI ID of the folder to remove from this view.
	 */
	removeFolderById : function(id)
	{
		// Remove the folder from the list.
		this.folders.remove(this.getFolderById(id));

		// Get the tab view and unhook the event handlers.
		var tab = this.tabs[id];
		this.mun(tab, 'merge', this.onTabMerge, this);
		this.mun(tab, 'separate', this.onTabSeparate, this);
		this.mun(tab, 'close', this.onTabClose, this);
		this.mun(tab, 'click', this.onTabClick, this);

		// Remove the tab view as a child view and destroy.
		this.removeChildView(tab, true);

		// Remove the tab view from the tab view hash.
		delete this.tabs[id];
	},

	/**
	 * Gets a list of MAPI folder IDs currently in this view.
	 * @return {String}[] MAPI folders IDs currently in this view.
	 */
	getFolderIds : function()
	{
		var ret = [];
		for (var i = 0, folder; folder = this.folders[i]; i++) {
			ret[i] = folder.get('entryid');
		}
		return ret;
	},

	/**
	 * Gets a MAPI folder by its MAPI ID.
	 * @param {string} id folder MAPI ID.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} folder object if the folder was found, or undefined otherwise.
	 */
	getFolderById : function(id)
	{
		// Find folder object to go with the folder ID.
		for (var i=0, folder; folder = this.folders[i]; i++) {
			if (Zarafa.core.EntryId.compareEntryIds(folder.get('entryid'), id)) {
				return folder;
			}
		}
	},

	/**
	 * Gets a list of MAPI folders currently in this view. Is filled by the onLoad event.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord[]} MAPI folders currently in this view.
	 */
	getFolders : function()
	{
		return this.folders;
	},

	/**
	 * Updates the currently {@link #selectedFolder selected folder}. If {@link #rendered} it will
	 * also {@link #layout relayout} the view.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which is currently selected
	 */
	setSelectedFolder : function(folder)
	{
		this.selectedFolder = folder;
		if (this.rendered) {
			this.layout();
		}
	},

	/**
	 * Gets the currently selected folder.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} currently selected MAPI folder.
	 */
	getSelectedFolder : function()
	{
		// Check if selected folder is available in the folders array. This could be false when
		// settings haven't been updated properly.
		if ( this.folders.indexOf(this.selectedFolder) < 0 ){
			// Set the first folder in the list as the selected one
			this.setSelectedFolder(this.folders[0]);
		}

		return this.selectedFolder;
	},

	/**
	 * Checks if this view is currently showing the given MAPI folder.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folders currently in this view.
	 * @return true iff this view contains the given folder.
	 */
	containsFolder : function(folder)
	{
		return this.containsFolderId(folder.get('entryid'));
	},

	/**
	 * Checks if this view is currently showing the given MAPI folder.
	 * @param {string} id folder MAPI ID.
	 * @return true iff this view contains the given folder.
	 */
	containsFolderId : function(id)
	{
		return Ext.isDefined(this.getFolderById(id));
	},

	/**
	 * Sorts the calendar folders based on the order of the input folder list. It is assumed that the folders argument
	 * is a superset of the folder list currently active in this view.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folders Folder list.
	 */
	sortFolders : function(folders)
	{
		var sortedFolders = [];
		for (var i = 0, folder; folder = folders[i]; i++) {
			if (this.containsFolderId(folder.get('entryid'))) {
				sortedFolders.push(folder);
			}
		}

		this.folders = sortedFolders;
	},

	/**
	 * Returns the current date range for this calendar view. This value is retrieved
	 * from the parent view.
	 * @return {Zarafa.core.DateRange} The daterange
	 */
	getDateRange : function()
	{
		return this.parentView.getDateRange();
	},

	/**
	 * Returns the begin date for this calendar value. This value is retrieved
	 * from the parent view.
	 * @return {Date} calendar start date.
	 */
	getStartDate : function()
	{
		return this.getDateRange().getStartDate();
	},

	/**
	 * Returns the due date for this calendar value. This value is retrieved
	 * from the parent view.
	 * @return {Date} calendar due date.
	 */
	getDueDate : function()
	{
		return this.getDateRange().getDueDate();
	},

	/**
	 * The {@link Zarafa.calendar.ui.CalendarMultiView CalendarMultiView} view has a header area that automatically
	 * resizes when its child views require more space. In the days view for instance, appointments that span
	 * more than 24 hours are laid out in the header.
	 * @return {Number} height in pixels the calendar view needs to properly lay out its header.
	 */
	getDesiredHeaderHeight : function()
	{
		return 0;
	},

	/**
	 * The {@link Zarafa.calendar.ui.CalendarMultiView CalendarMultiView} view has a tab area that is visible when there
	 * are multiple calendars open.
	 * @return {Number} height in pixels of the tab area of the calendar view.
	 */
	getTabHeight : function()
	{
		return this.parentView.getTabHeight();
	},

	/**
	 * Finds an appointment view by record.
	 * @param {Ext.data.Record} record to look for
	 * @return {Zarafa.calendar.ui.AppointmentView} an appointment view iff found, undefined otherwise
	 */
	findAppointment : function(record)
	{
		for (var i=0, appointment; appointment=this.appointments[i]; i++) {
			if (appointment.getRecord().equals(record)) {
				return appointment;
			}
		}

		// not found
		return undefined;
	},

	/**
	 * Tests if an appointment view exists on this calendar view that represents the given record.
	 * @param {Ext.data.Record} record to look for
	 * @return {Boolean} true iff an appointment view exists that represents the given record.
	 */
	containsAppointment : function(record)
	{
		return Ext.isDefined(this.findAppointment(record));
	},

	/**
	 * Create a new {@link Zarafa.calendar.ui.AppointmentView Appointment} object
	 * for the given {@link Zarafa.core.data.IPMRecord record}.
	 * Subclasses must override this function to make the appointments visible
	 * in this view.
	 * @param {Zarafa.core.data.IPMRecord} record The record for which the AppointmentView
	 * must be created.
	 * @return {Zarafa.calendar.ui.AppointmentView} The new appointmentview
	 * @protected
	 */
	createAppointment : Ext.emptyFn,

	/**
	 * Create an Appointment Proxy object which can represent the selected text
	 * Must be implemented by the subclasses.
	 * @return Zarafa.calendar.ui.AbstractDateRangeView
	 * @protected
	 */
	createAppointmentProxy : Ext.emptyFn,

	/**
	 * Adds a new appointment to the view.
	 * @param {Ext.data.Record} record a record with the appointment data
	 * @param {Boolean} layout (optional) if true layout() will be called after the appointment was added. Defaults to true.
	 * @return {Boolean} True if an appointment was added, false otherwise.
	 */
	addAppointment : function(record, layout)
	{
		// Don't add anything that is not an appointment
		if ( Zarafa.core.MessageClass.getDefaultFolderTypeFromMessageClass(record.get('message_class')) !== 'calendar' ){
			return false;
		}

		var appointment = this.createAppointment(record);

		appointment.render(this.container);
		this.appointments.push(appointment);

		if (layout !== false) {
			this.layout();
		}

		return true;
	},

	/**
	 * Removes an appointment from the view.
	 * @param {Ext.data.Record} record appointment record
	 * @param {Boolean} layout (optional) if true layout() will be called after the appointment was added. Defaults to true.
	 * @return {Boolean} true if an appointment was removed, false otherwise (the appointment was not found in this view)
	 */
	removeAppointment : function(record, layout)
	{
		var appointment;
		if (appointment = this.findAppointment(record)) {
			this.appointments.remove(appointment);
			this.removeChildView(appointment, true);

			if (layout !== false) {
				this.layout();
			}
			return true;
		}

		return false;
	},

	/**
	 * Removes all appointments from the view and destroys them.
	 * @param {Boolean} destroy if true, destroy the appointments. Defaults to true.
	 * @param {Boolean} layout (optional) if true layout() will be called after the appointment was added. Defaults to true.
	 * @return {Zarafa.calendar.ui.AppointmentView[]} a list of appointments that were removed.
	 */
	clearAppointments : function(destroy, layout)
	{
		for (var i=0, appointment; appointment=this.appointments[i]; i++) {
			this.removeChildView(appointment, destroy);
		}

		// Save the appointments list so we can return it from the function.
		var ret = this.appointments;

		// Clear the appointments list.
		this.appointments = [];

		// Optionally layout the view.
		if (layout !== false) {
			this.layout();
		}

		return ret;
	},

	/**
	 * Gets a list of appointment records currently on the view.
	 * @return {Zarafa.core.data.IPMRecord[]} records.
	 */
	getAppointmentRecords : function()
	{
		var ret = [];

		for (var i=0, appointment; appointment=this.appointments[i]; i++) {
			ret.push(appointment.getRecord());
		}

		return ret;
	},

	/**
	 * Converts a date range ([startDate, dueDate>) to zero or more (left, right, top, bottom) bounds objects.
	 * This method is used to lay out appointments (and proxies) on the calendar body.
	 * @param {Zarafa.core.DateRange} dateRange date range
	 * @param {Number} column (optional) when several appointments are overlapping a column may be assigned
	 * @param {Number} columnCount (optional) the number of overlapping appointments in an overlap dependency graph
	 * @param {Boolean} useMargin (optional) True to apply margins to the appointments to prevent them from
	 * filling up the entire width of a daybox (This applies {@link #appointmentBodyLeftMargin} and
	 * {@link #appointmentBodyRightMargin}).
	 */
	dateRangeToBodyBounds : function(dateRange, column, columnCount, useMargin)
	{
		return [];
	},

	/**
	 * Converts a date range ([startDate, dueDate>) a (left, right, top, bottom) box.
	 * This method is used to lay out appointments (and proxies) on the calendar header.
	 * @param {Zarafa.core.DateRange} dateRange date range
	 * @param {Number} column (optional) when several appointments are overlapping a column may be assigned
	 * @param {Number} columnCount (optional) the number of overlapping appointments in an overlap dependency graph
	 * @param {Boolean} useMargin (optional) True to apply margins to the appointments to prevent them
	 * from filling up the entire width of the header (This applies {@link #appointmentHeaderLeftMargin} and
	 * {@link #appointmentHeaderRightMargin}).
	 */
	dateRangeToHeaderBounds : function(dateRange, row, rowCount, useMargin)
	{
		return {
			left : 0,
			right : 0,
			top : 0,
			bottom : 0
		};
	},

	/**
	 * Tests if the date range should be laid out in the header. Should be overridden by child classes. For example,
	 * the days view lays out appointments in the header if they span > 24 hours, but the box view never lays out
	 * appointments on the header.
	 * @return {Boolean} true iff the date range should be laid out on the calendar header.
	 */
	isHeaderRange : function(dateRange)
	{
		return false;
	},

	/**
	 * Sets the tab minimum offset from the left. Called by the parent
	 * {@link Zarafa.calendar.ui.CalendarMultiView CalendarMultiView} before layout.
	 * @param {Number} left The offset from the left
	 */
	setLeftMargin : function(left)
	{
		this.leftOffset = left;
	},

	/**
	 * Sets the tab width. Called by the parent
	 * {@link Zarafa.calendar.ui.CalendarMultiView CalendarMultiView} before layout.
	 * @param {Number} width tab width.
	 */
	setWidth : function(width)
	{
		this.width = width;
	},

	/**
	 * Sets whether this view can merge left. If the view is the leftmost on screen, this will be set to true by the
	 * parent multiview. This information is used to hide/show the merge icon on the tabs in the view.
	 * @param {Boolean} canMerge
	 */
	setCanMerge : function(canMerge)
	{
		this.canMerge = canMerge;
	},

	/**
	 * Sets whether this view can be closed. If the view is the only one on screen, this will be set to true by the
	 * parent multiview. This information is used to hide/show the close icon on the tabs in the view.
	 * @param {Boolean} canClose
	 */
	setCanClose : function(canClose)
	{
		this.canClose = canClose;
	},

	/**
	 * Converts a location in page coordinates to a corresponding date.
	 * @param {Number} x horizontal component of the location
	 * @param {Number} y vertical component of the location
	 * @return {Date} a Date object that corresponds to the given location
	 */
	screenLocationToDate : Ext.emptyFn,

	/**
	 * Converts a location in page coordinates to a corresponding daterange.
	 * @param {Number} x horizontal component of the location
	 * @param {Number} y vertical component of the location
	 * @return {Zarafa.core.DateRange} A DateRange object that corresponds to the given location
	 */
	screenLocationToDateRange : Ext.emptyFn,

	/**
	 * The border width in pixels. Retrieved from the parent view.
	 * If this calendar component is the only calendar on the view it will return 0.
	 * @return {Number} border width in pixels
	 * @private
	 */
	getBorderWidth : function()
	{
		return this.parentView.getBorderWidth();
	},

	/**
	 * Zoom level. Retrieved from the parent view.
	 * @return {Number} zoom level in minutes.
	 * @private
	 */
	getZoomLevel : function()
	{
		return this.parentView.zoomLevel;
	},

	/**
	 * @return {Ext.Element} the calendar body element
	 */
	getCalendarBody : function()
	{
		return this.body;
	},

	/**
	 * @return {Ext.Element} the calendar header element
	 */
	getCalendarHeader : function()
	{
		return this.header;
	},

	/**
	 * Compares two appointments. Used for sorting appointments by start date. If the start dates of both
	 * appointments are equal, further distinction is made by due date and entryId. Note that the tie
	 * breaker here is entryId because the quick sort used by JavaScript is not stable, so the user might
	 * experience appointments with equal start and due dates swapping places on updates without it.
	 *
	 * @param {Zarafa.calendar.ui.AppointmentView} a appointment A
	 * @param {Zarafa.calendar.ui.AppointmentView} b appointment B
	 * @return {Number} 1 if appointment A starts before appointment B, 0 if they are equal, -1 if appointment A
	 * starts after appointment B.
	 */
	appointmentCompare : function(a, b)
	{
		var dateComp = a.getDateRange().compare(b.getDateRange());
		if (dateComp === 0) {
			return a.getRecord().get('entryid')>b.getRecord().get('entryid')?1:-1;
		} else {
			return dateComp;
		}
	},

	/**
	 * Performs greedy coloring for a set of overlapping appointments. Each appointment is assigned a slot
	 * and the total slot count (number of required slots to lay out the set) is assigned to the appointment
	 * in the form of the 'slotCount' property.
	 * <p>
	 * The algorithm can lay out appointments by time (as in the body) or by whole days (as in the header).
	 * In the latter case if two appointments start or end on the same day they will always overlap, regardless
	 * of the time within that day.
	 * @param {Boolean} wholeDays if true the overlap test is for whole days rather than time
	 */
	doGreedyColoring : function(appointments, wholeDays)
	{
		// sort appointments by start date
		appointments.sort(this.appointmentCompare);

		// create the to do list. We'll remove fitted appointments from this list and continue until it is empty
		var todoList = [];

		// fill the to do list with start/due values (numbers). In the case of fitting by day we'll fill it
		// with day numbers. In the normal case it will be filled with milliseconds since epoch
		if (wholeDays) {
			Ext.each(appointments, function(appointment) {
				var calendarStartTime = this.getDateRange().getStartTime();
				todoList.push({
					appointment : appointment,
					start : Math.floor((appointment.getDateRange().getStartTime() - calendarStartTime) / Date.dayInMillis),
					due : Math.ceil((appointment.getDateRange().getDueTime() - calendarStartTime) / Date.dayInMillis)
				});
			}, this);
		} else {
			Ext.each(appointments, function(appointment) {
				todoList.push({
					appointment : appointment,
					start : appointment.getAdjustedDateRange().getStartTime(),
					due : appointment.getAdjustedDateRange().getDueTime()
				});
			});
		}

		// simple greedy lay out
		var slot = 0;
		while (todoList.length > 0) {
			// first element can always go into the empty slot
			var first = todoList.shift();
			first.appointment.slot = slot;

			// the slot now spans start-due
			var due = first.due;

			// look for appointments that are outside the start-due range, and can therefore
			// go into the current slot
			for (var i = 0; i < todoList.length; i++) {
				if (todoList[i].start >= due) {
					// add the selected item to the current slot
					todoList[i].appointment.slot = slot;

					// update the span to include the new appointment
					due = todoList[i].due;

					// remove the selected item from the to do list
					todoList.splice(i, 1);
					i--;
				}
			}

			// next slot
			slot++;
		}

		Ext.each(appointments, function(appointment) { appointment.slotCount = slot; } );
	},

	/**
	 * Renders the view. This class provides a this.header and this.body div that can be used
	 * to attach elements to the header and body areas respectively.
	 * <p>
	 * This class also provides a border with a tab (shown when there are more than one calendar
	 * in the parent view).
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 */
	render : function(container)
	{
		// FIXME: This should _never_ be true...
		if (this.rendered) {
			return;
		}

		// create tab, header and body divs
		this.createDiv(this.parentView.scrollable, 'body');
		this.createDiv(this.parentView.header, 'header', 'zarafa-calendar-header');

		// border divs
		this.createDiv(this.parentView.header, 'headerBorderLeft');
		this.createDiv(this.parentView.header, 'headerBorderRight');
		this.createDiv(this.parentView.scrollable, 'borderLeft');
		this.createDiv(this.parentView.scrollable, 'borderRight');
		this.createDiv(this.parentView.bottom, 'borderBottom');

		this.createDiv(this.parentView.tab, 'tabArea');
		this.createDiv(this.tabArea, 'activeTabStroke');

		Zarafa.calendar.ui.AbstractCalendarView.superclass.render.call(this, container);
		this.renderChildren();

		this.mon(this.selectionView, 'keypress', this.onKeyPress, this);
		this.mon(this.selectionView, 'keydown', this.onKeyPress, this);

		if (this.enableDD || this.enableBodyDD || this.enableBodyDrag) {
			if (!this.bodyDragZone && this.body) {
				this.bodyDragZone = new Zarafa.calendar.ui.CalendarViewDragZone(this, this.bodyDragConfig || {
					ddGroup : this.ddGroup || 'AppointmentDD',
					headerMode : false
				});
			}
		}

		if (this.enableDD || this.enableHeaderDD || this.enableHeaderDrag) {
			if (!this.headerDragZone && this.header) {
				this.headerDragZone = new Zarafa.calendar.ui.CalendarViewDragZone(this, this.headerDragConfig || {
					ddGroup : this.ddGroup || 'AppointmentDD',
					headerMode : true
				});
			}
		}

		if (this.enableDD || this.enableBodyDD || this.enableBodyDrop) {
			if (!this.bodyDropZone && this.body) {
				this.bodyDropZone = new Zarafa.calendar.ui.CalendarViewDropZone(this, this.bodyDropConfig || {
					ddGroup : this.ddGroup || 'AppointmentDD',
					headerMode : false,
					selectingSnapMode : Zarafa.calendar.data.SnapModes.ZOOMLEVEL,
					draggingSnapMode : Zarafa.calendar.data.SnapModes.ZOOMLEVEL
				});
				this.bodyDropZone.proxy = this.selectionView;
			}
		}

		if (this.enableDD || this.enableHeaderDD || this.enableHeaderDrop) {
			if (!this.headerDropZone && this.header) {
				this.headerDropZone = new Zarafa.calendar.ui.CalendarViewDropZone(this, this.headerDropConfig || {
					ddGroup : this.ddGroup || 'AppointmentDD',
					headerMode : true,
					selectingSnapMode : Zarafa.calendar.data.SnapModes.DAY,
					draggingSnapMode : Zarafa.calendar.data.SnapModes.DAY
				});
				this.headerDropZone.proxy = this.selectionView;
			}
		}
	},

	/**
	 * Event handler which is triggered when the user pressed a key after selection a
	 * time range with the {@link #rangeSelectionModel}. If the first character is
	 * {@link Ext.form.VTypes.alphanum alphanumeric} then the {@link #textEditView} will be enabled for creating
	 * a quick-appointment.
	 * @param {Object} event The event object for this event
	 * @private
	 */
	onKeyPress : function(event)
	{
		// If the key is not alphanumeric (a-z, A-Z, 0-9) ignore the event
		if (!Ext.form.VTypes.alphanum(String.fromCharCode(event.getKey()))) {
			return;
		}

		if (this.rangeSelectionModel.isActive() && this.rangeSelectionModel.getCalendarView() == this && !this.textEditView.isVisible())
		{
			var range = this.rangeSelectionModel.getDateRange();

			// Clear the range selection. Note that this causes the 'rangeSelectionChange' to fire, which in
			// turn causes the textEditView to be made invisible. Therefore we do this before making the
			// textEditView visible through the select(); method.
			this.rangeSelectionModel.clearSelections();

			// Show the text edit view.
			this.textEditView.setDateRange(range);
			this.textEditView.select();
		}

	},

	/**
	 * Event handler which is raised when the user has used the {@link #textEditView} to write
	 * the subject for a quick-appointment. If this subject is not empty, the {@link #appointmentcreate}
	 * event will be fired for creating a new appointment.
	 * @param {Zarafa.calendar.ui.TextEditView} view The view which raised the event.
	 * @param {String} text The text which was entered into the view.
	 * @private
	 */
	onTextEntered : function(view, text)
	{
		// Don't fire event on empty text
		if (Ext.isEmpty(text.trim())) {
			return;
		}

		this.fireEvent('appointmentcreate', this, view.getDateRange(), text);
	},

	/**
	 * Handles layout of the individual divs that make up the border around the calendar view.
	 * @private
	 */
	layoutBorder : function()
	{
		var selectedFolder = this.getSelectedFolder();
		var colorScheme = this.contextModel.getColorScheme(selectedFolder.get('entryid'));
		if (this.parentView.showBorder) {
			var borderWidth = this.getBorderWidth();

			// border divs in the header area
			var headerHeight = this.parentView.getHeaderAreaHeight();

			this.headerBorderLeft.dom.className = this.getClassName('border', 'left');
			this.headerBorderLeft.setLeftTop(this.leftOffset, 0);
			this.headerBorderLeft.setSize(borderWidth, headerHeight);
			this.headerBorderLeft.applyStyles({
				'background-color' : colorScheme.header,
				'border-color' : colorScheme.header
			});
			this.headerBorderLeft.show();

			this.headerBorderRight.dom.className = this.getClassName('border', 'right');
			this.headerBorderRight.setLeftTop(this.leftOffset + this.width - borderWidth, 0);
			this.headerBorderRight.setSize(borderWidth, headerHeight);
			this.headerBorderRight.applyStyles({
				'background-color' : colorScheme.header,
				'border-color' : colorScheme.header
			});
			this.headerBorderRight.show();

			// border divs in the body area
			var bodyHeight = this.parentView.getHourHeight() * this.parentView.numHours;

			this.borderLeft.dom.className = this.getClassName('border', 'left');
			this.borderLeft.setLeftTop(this.leftOffset, 0);
			this.borderLeft.setSize(borderWidth, bodyHeight);
			this.borderLeft.applyStyles({
				'background-color' : colorScheme.header,
				'border-color' : colorScheme.header
			});
			this.borderLeft.show();

			this.borderRight.dom.className = this.getClassName('border', 'right');
			this.borderRight.setLeftTop(this.leftOffset + this.width - borderWidth, 0);
			this.borderRight.setSize(borderWidth, bodyHeight);
			this.borderRight.applyStyles({
				'background-color' : colorScheme.header,
				'border-color' : colorScheme.header
			});
			this.borderRight.show();

			// border div in the bottom area
			this.borderBottom.dom.className = this.getClassName('border', 'bottom');
			this.borderBottom.setLeftTop(this.leftOffset, 0);
			this.borderBottom.setSize(this.width, borderWidth);
			this.borderBottom.applyStyles({
				'background-color' : colorScheme.header,
				'border-color' : colorScheme.header
			});
			this.borderBottom.show();
		} else {
			this.headerBorderLeft.hide();
			this.headerBorderRight.hide();
			this.borderLeft.hide();
			this.borderRight.hide();
			this.borderBottom.hide();
		}
	},

	/**
	 * Handles layout of the individual {@link #tabs}. This will also obtain the desired width
	 * for each individual tab, as to calculate how much width each tab could be assigned with.
	 * @private
	 */
	layoutTabs : function()
	{
		var tabs = [];
		var tabsThatNeedResizing = [];
		var tabsThatNeedNoResizing = [];

		// Update the settings of the tabs and calculate the total desired width.
		// Layout the tabs.
		var totalDesiredWidth = 0;

		for (var i=0, folder; folder=this.folders[i]; i++) {
			var tab = this.tabs[folder.get('entryid')];
			tab.setSelected(this.selectedFolder == folder, this.active);
			tab.setShowMergeIcon(this.canMerge);
			tab.setShowSeparateIcon(this.folders.length > 1);
			tab.setShowCloseIcon(this.canClose);

			tabs.push(tab);
			tab.desiredWidth = tab.getDesiredWidth();
			tab.lrmargins = tab.tabContents.getMargins('lr');

			totalDesiredWidth += tab.desiredWidth + tab.lrmargins;
		}

		// If the width of all the tabs together is more than the width of this control,
		// the tabs will have to be shrunk.
		if ( totalDesiredWidth > this.width ){
			for ( i=0; i<tabs.length; i++ ){
				if ( (tabs[i].getDesiredWidth() + tabs[i].tabContents.getMargins('lr')) < this.width/tabs.length ){
					tabsThatNeedNoResizing.push(tabs[i]);
				}else{
					tabsThatNeedResizing.push(tabs[i]);
				}
			}

			var totalAvailableWidthForTabsThatNeedResizing = this.width;
			var totalWidthOfTabsThatNeedResizing = 0;
			for ( i=0; i<tabsThatNeedNoResizing.length; i++ ){
				totalAvailableWidthForTabsThatNeedResizing -= tabsThatNeedNoResizing[i].desiredWidth + tabsThatNeedNoResizing[i].lrmargins;
			}
			for ( i=0; i<tabsThatNeedResizing.length; i++ ){
				totalWidthOfTabsThatNeedResizing += tabsThatNeedResizing[i].desiredWidth + tabsThatNeedResizing[i].lrmargins;
			}

			if ( tabsThatNeedResizing.length === 1 ){
				tabsThatNeedResizing[0].desiredWidth = totalAvailableWidthForTabsThatNeedResizing - tabsThatNeedResizing[0].lrmargins;
			} else {
				while ( totalWidthOfTabsThatNeedResizing > totalAvailableWidthForTabsThatNeedResizing ){
					// find the largest two tabs
					var tab0 = tabsThatNeedResizing[0].desiredWidth > tabsThatNeedResizing[1].desiredWidth ? tabsThatNeedResizing[0] : tabsThatNeedResizing[1];
					var tab1 = tabsThatNeedResizing[0].desiredWidth > tabsThatNeedResizing[1].desiredWidth ? tabsThatNeedResizing[1] : tabsThatNeedResizing[0];
					for ( i=2; i<tabsThatNeedResizing.length; i++ ){
						if ( tabs[i].desiredWidth > tab0.desiredWidth ){
							tab0 = tabs[i];
						} else if ( tabs[i].desiredWidth > tab1.desiredWidth ){
							tab1 = tabs[i];
						}
					}

					if ( tab0.desiredWidth - tab1.desiredWidth > totalWidthOfTabsThatNeedResizing - totalAvailableWidthForTabsThatNeedResizing ){
						// Easy one: just shrink the biggest tab and we're good to go.
						tab0.desiredWidth -= totalWidthOfTabsThatNeedResizing - totalAvailableWidthForTabsThatNeedResizing + tab0.lrmargins;
						totalWidthOfTabsThatNeedResizing = totalAvailableWidthForTabsThatNeedResizing;
					} else {
						// Just make the largest tab smaller than the second largest tab and start all over (iterating until we are small enough)
						totalWidthOfTabsThatNeedResizing -= (tab0.desiredWidth-tab1.desiredWidth) + 1;
						tab0.desiredWidth = tab1.desiredWidth - 1;
					}
				}
			}
		}

		// Layout the tabs.
		for (var i=0, folder; folder=this.folders[i]; i++) {
			var tab = this.tabs[folder.get('entryid')];

			var width = tab.desiredWidth;

			// Check if we don't get conflicts with a possible min-width set in the css-files
			tab.tabContents.dom.style.removeProperty('min-width');
			var cssMinWidth = parseInt(tab.tabContents.getStyle('min-width')) + tab.tabContents.getPadding('lr');

			if ( cssMinWidth > width ){
				tab.tabContents.setStyle('min-width', 0);
				if ( totalDesiredWidth <= this.width ){
					width = cssMinWidth;
				}
			}

			tab.setWidth(width);
		}
	},

	/**
	 * Lays out the view.
	 * @protected
	 */
	onLayout : function()
	{
		// Update the themeCls, this will be used when assigning
		// the CSS class names to all objects.
		if ( this.getSelectedFolder() ) {
			var colorScheme = this.contextModel.getColorScheme(this.getSelectedFolder().get('entryid'));
			if(colorScheme) {
				this.calendarColorScheme = colorScheme;
			}
		}else{
			return Zarafa.calendar.ui.AbstractCalendarView.superclass.onLayout.call(this);
		}

		// layout border and tab
		this.layoutBorder();

		// layout body and header containers
		var dayStripHeight = this.parentView.getHourHeight() * this.parentView.numHours;

		this.body.dom.className = this.getClassName('container', 'body');
		this.body.setLeftTop(this.leftOffset + this.getBorderWidth(), 0);
		this.body.setSize(this.width - this.getBorderWidth() * 2, dayStripHeight);

		this.header.dom.className = this.getClassName('container', 'header');
		this.header.setLeftTop(this.leftOffset + this.getBorderWidth(), 0);
		this.header.setSize(this.width - this.getBorderWidth() * 2, this.parentView.getHeaderAreaHeight());

		this.tabArea.dom.className = this.getClassName('container', 'tabarea');
		this.tabArea.setLeftTop(this.leftOffset, 0);
		this.tabArea.setSize(this.width, this.parentView.getTabAreaHeight());

		this.activeTabStroke.dom.className = this.getClassName('tabarea', 'stroke');
		this.activeTabStroke.setSize(this.width, this.parentView.tabStrokeHeight);

		if (this.parentView.showBorder) {
			this.tabArea.show();
		} else {
			this.tabArea.hide();
		}

		// Determine the color scheme of the appointments
		for (var i=0, appointment; appointment=this.appointments[i]; i++) {
			var folderId = appointment.getRecord().get('parent_entryid');
			appointment.calendarColorScheme = this.contextModel.getColorScheme(folderId);

			var folder = this.getFolderById(folderId);
			appointment.setActive(folder == this.selectedFolder);
		}

		Zarafa.calendar.ui.AbstractCalendarView.superclass.onLayout.call(this);

		this.layoutTabs();
	},

	/**
	 * This will call {@link Zarafa.core.ui.View#layout layout} on all the
	 * {@link #children}.
	 * @protected
	 */
	onAfterLayout : function()
	{
		this.layoutChildren();
	},

	/**
	 * Called by the {@link #parentView} when the {@link Zarafa.core.data.IPMStore#beforeload beforeload} event
	 * has been fired from the appointment {@link Zarafa.calendar.ui.CalendarMultiView#store store}.
	 * @param {Zarafa.core.data.IPMStore} store store that fired the event.
	 * @param {Object} options the options (parameters) with which the load was invoked.
	 */
	beforeAppointmentsLoad : function(store, options)
	{
		// Destroy all appointments.
		this.clearAppointments(true);
	},

	/**
	 * Called by the {@link #parentView} when the {@link Zarafa.core.data.IPMStore#load load} event
	 * has been fired from the appointment {@link Zarafa.calendar.ui.CalendarMultiView#store store}.
	 * @param {Zarafa.core.data.IPMStore} store store that fired the event.
	 * @param {Zarafa.core.data.IPMRecord[]} records loaded record set
	 * @param {Object} options the options (parameters) with which the load was invoked.
	 */
	onAppointmentsLoad : function(store, records, options)
	{
		// Destroy all appointments.
		this.clearAppointments(true);

		// Create an appointment for each record.
		Ext.each(records, function(record) {
			if (this.containsFolderId(record.get('parent_entryid')) && record.isValid()) {
				this.addAppointment(record, false);
			}
		}, this);

		// Keeping the selection can be achieved properly by using 'recordselectionchange'
		// event of respective context instance in case of any GridView.
		// But we need to keep selection manually for this particular calendar view.
		var selectedRecords = this.contextModel.selectedRecords;
		if (!Ext.isEmpty(selectedRecords)) {
			this.selectionModel.selectRecord(selectedRecords[0], false);
		}
	},

	/**
	 * Called by the {@link #parentView} when the {@link Zarafa.core.data.IPMStore#add add} event
	 * has been fired from the appointment {@link Zarafa.calendar.ui.CalendarMultiView#store store}.
	 * Checks if the record belongs to this view (by checking the parent id)
	 * and adds a new AppointmentView to the calendar if required.
	 * @param {Ext.data.Store} store data store
	 * @param {Ext.data.Record} record that was added
	 * @param {String} operation mutation operation key. Equals 'add'
	 */
	onAppointmentAdd : function(store, record, operation)
	{
		if (this.containsFolderId(record.get('parent_entryid')) && !this.containsAppointment(record) && record.isValid()) {
			this.addAppointment(record);
		}
	},

	/**
	 * Called by the {@link #parentView} when the {@link Zarafa.core.data.IPMStore#remove remove} event
	 * has been fired from the appointment {@link Zarafa.calendar.ui.CalendarMultiView#store store}.
	 * Checks if an AppointmentView displaying the record exists on this calendar and removes it.
	 * @param {Ext.data.Store} store data store
	 * @param {Ext.data.Record} record that was added
	 * @param {String} operation mutation operation key. Equals 'remove'
	 */
	onAppointmentRemove : function(store, record, operation)
	{
		if (this.containsAppointment(record)) {
			this.removeAppointment(record);
		}
	},

	/**
	 * Called by the {@link #parentView} when the {@link Zarafa.core.data.IPMStore#remove remove} event
	 * has been fired from the appointment {@link Zarafa.calendar.ui.CalendarMultiView#store store}.
	 * This event is usually fired twice, once to signal that the data of a record has been changed (operation=='update'),
	 * and once to signal that the data has been successfully committed to the store (operation=='commit').
	 * The 'commit' operation means that the changed record has been written to the database back-end.
	 * @param {Ext.data.Store} store data store
	 * @param {Ext.data.Record} record that was added
	 * @param {String} operation mutation operation key. Equals 'update'
	 */
	onAppointmentUpdate : function(store, record, operation)
	{
		var appointment = this.findAppointment(record);

		if (!appointment) {
			// Appointment doesn't exist. We don't care about the update.
			return;
		}

		var dateRange = appointment.getDateRange();

		if (dateRange.getStartDate() !== record.get('startdate') || dateRange.getDueDate() !== record.get('duedate')) {
			// If the appointment start and/or duedate have been changed, then we must do a layout
			// of all appointments (appointments can now overlap which could cause the appointments
			// to be resized).
			appointment.updateDateRange(record);
			this.layout();
		} else {
			// The appointment presence nor size in this calendar has changed,
			// we can simply update the appointment with the new data.
			appointment.layout();
		}
	},

	/**
	 * Event handler which is fired when the {@link #selectionModel} fires the
	 * {@link Zarafa.calendar.ui.AppointmentSelectionModel#appointmentselect appointmentselect} event.
	 * This will lookup which {@link Zarafa.calendar.ui.AppointmentView appointment} belongs to the
	 * given {@link Zarafa.core.data.IPMRecord record} and will use
	 * {@link Zarafa.calendar.ui.AppointmentView#setSelected setSelected} to mark the appointment
	 * as selected.
	 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} selectionModel The selection model which
	 * fired the event.
	 * @param {Zarafa.core.data.IPMRecord} record The record which was selected.
	 * @private
	 */
	onAppointmentSelect : function(selectionModel, record)
	{
		var appointment = this.findAppointment(record);

		// If the text edit view is still visible, hide it.
		if (this.textEditView.isVisible()) {
			this.textEditView.hide();
		}

		if (appointment) {
			appointment.setSelected(true);
		}
	},

	/**
	 * Event handler which is fired when the {@link #selectionModel} fires the
	 * {@link Zarafa.calendar.ui.AppointmentSelectionModel#appointmentdeselect appointmentdeselect} event.
	 * This will lookup which {@link Zarafa.calendar.ui.AppointmentView appointment} belongs to the
	 * given {@link Zarafa.core.data.IPMRecord record} and will use
	 * {@link Zarafa.calendar.ui.AppointmentView#setSelected setSelected} to mark the appointment
	 * as unselected.
	 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} selectionModel The selection model which
	 * fired the event.
	 * @param {Zarafa.core.data.IPMRecord} record The record which was deselected.
	 * @private
	 */
	onAppointmentDeselect : function(selectionModel, record)
	{
		var appointment = this.findAppointment(record);

		// If the text edit view is still visible, hide it.
		if (this.textEditView.isVisible()) {
			this.textEditView.hide();
		}

		if (appointment) {
			appointment.setSelected(false);
		}
	},

	/**
	 * Event handler which is fired when the {@link #selectionModel} fires the
	 * {@link Zarafa.calendar.ui.AppointmentSelectionModel#selectionclear selectionclear} event.
	 * This will call {@link Zarafa.calendar.ui.AppointmentView#setSelected setSelected} for
	 * each {@link #appointments appointment} to mark them as unselected.
	 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} selectionModel The selection model which
	 * fired the event.
	 * @private
	 */
	onAppointmentSelectionClear : function(selectionModel)
	{
		// If the text edit view is still visible, hide it.
		if (this.textEditView.isVisible()) {
			this.textEditView.hide();
		}

		for (var i = 0, len = this.appointments.length; i < len; i++) {
			this.appointments[i].setSelected(false);
		}
	},

	/**
	 * Fires when the selection range has changed. This means the selection range my have been cleared or
	 * set.
	 * @param {Zarafa.calendar.ui.DateRangeSelectionModel} selectionModel range selection model firing the event.
	 * @param {Zarafa.core.DateRange} dateRange selected date range, or undefined if not active.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendarView the calendar view the selection was made on.
	 * @param {Boolean} active true iff the selection is active (set).
	 * @private
	 */
	onRangeSelectionChange : function(selectionModel, dateRange, calendarView, active)
	{
		// Make sure the selection view has been created.
		if (!this.selectionView) {
			return;
		}

		// If the text edit view is still visible, hide it.
		if (this.textEditView.isVisible()) {
			this.textEditView.hide();
			this.textEditView.inputText = '';
		}

		// Check if the selected range is active and belongs to this calendar view, and
		// show the selection if so.
		if (active && calendarView == this) {
			this.selectionView.setDateRange(dateRange);
			this.selectionView.setVisible(true);
		} else {
			// Otherwise hide the selection view
			if (this.selectionView.isVisible()) {
				this.selectionView.setVisible(false);
			}
		}
	},

	/**
	 * Handles the 'merge' event of a tab, which is fired when the user clicks the left arrow (merge) button.
	 * Fires the 'merge' event.
	 * @param {MAPIFolder} folder MAPI folder.
	 * @private
	 */
	onTabMerge : function(folder)
	{
		this.fireEvent('merge', this, folder);
	},

	/**
	 * Handles the 'merge' event of a tab, which is fired when the user clicks the right arrow (separate) button.
	 * Fires the 'separate' event.
	 * @param {MAPIFolder} folder MAPI folder.
	 * @private
	 */
	onTabSeparate : function(folder)
	{
		this.fireEvent('separate', this, folder);
	},

	/**
	 * Handles the 'close' event of a tab, which is fired when the user clicks the tab itself.
	 * Fires the 'close' event.
	 * @param {MAPIFolder} folder MAPI folder.
	 * @private
	 */
	onTabClose : function(folder)
	{
		this.fireEvent('close', this, folder);
	},

	/**
	 * Handles the 'click' event of a tab, which is fired when the user clicks the tab itself.
	 * @param {MAPIFolder} folder MAPI folder.
	 * @private
	 */
	onTabClick : function(folder)
	{
		this.setSelectedFolder(folder);
		this.fireEvent('activate', this, folder);
	},

	/**
	 * Called by the {@link Zarafa.calendar.ui.CalendarViewDragZone} to determine the text
	 * of the {@link Zarafa.calendar.ui.AppointmentView appointment} which is being dragged.
	 * @return {String} The string which must be shown while dragging the appointment
	 */
	getDragDropText : function()
	{
		var count = this.selectionModel.getCount();
		return String.format(ngettext('{0} selected item', '{0} selected items', count), count);
	},

	/**
	 * Event handler for the D&D proxy, which is called when the appointment was dropped.
	 * This will fire the {@link #appointmentcalendardrop} event.
	 * @param {Ext.EventObject} event The event object
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendar The calendar from where the appointment was dragged
	 * @param {Zarafa.calendar.ui.AppointmentView} appointment The appointment which was dropped
	 * @param {Zarafa.core.DateRange} dateRange The daterange for the appointment
	 * @private
	 */
	onDrop : function(event, calendar, appointment, dateRange)
	{
		//Make sure this view gets the focus by calling the onTabClick event handler
		this.onTabClick(this.getSelectedFolder());

		this.fireEvent('appointmentcalendardrop', this, calendar, appointment.getRecord(), dateRange, event);
		this.selectionModel.clearSelections();
	},

	/**
	 * Event handler for the D&D proxy, which is called when the appointment was moved.
	 * This will fire the {@link #appointmentmove} event.
	 * @param {Ext.EventObject} event The event object
	 * @param {Zarafa.calendar.ui.AppointmentView} appointment The moved appointment
	 * @param {Zarafa.core.DateRange} dateRange The daterange for the appointment
	 * @private
	 */
	onMove : function(event, appointment, dateRange)
	{
		this.fireEvent('appointmentmove', this, appointment.getRecord(), dateRange, event);
		this.selectionModel.clearSelections();
	},

	/**
	 * Event handler for the D&D proxy, which is called when the appointment was resized.
	 * This will fire the {@link #appointmentresize} event.
	 * @param {Ext.EventObject} event The event object
	 * @param {Zarafa.calendar.ui.AppointmentView} appointment The resized appointment
	 * @param {Zarafa.core.DateRange} dateRange The daterange for the appointment
	 * @private
	 */
	onResize : function(event, appointment, dateRange)
	{
		this.fireEvent('appointmentresize', this, appointment.getRecord(), dateRange, event);
		this.selectionModel.clearSelections();
	},

	/**
	 * Generic implementation for handling mousemove events on the calendar, this needs to be
	 * implemented by subclasses to correctly delegate the event to the proper location in
	 * the calendar.
	 * @param {Ext.EventObject} event The event object
	 */
	onMouseMove : Ext.emptyFn,

	/**
	 * Event handler for the D&D proxy, which is called when the mousedown event has been fired.
	 * Depending if the Ctrl key was presed the previously selected record will remain selected
	 * or will be deselected.
	 * @param {Object} event The event object
	 * @param {Zarafa.calendar.ui.AppointmentView} appointment The appointment object
	 * @private
	 */
	onMouseDown : function(event, appointment)
	{
		// Make sure this view gets the focus by calling the onTabClick event handler.
		// Only call onTabClick when we actually change the selected folder group, to
		// avoid firing off an unrequired 'activate' event.
		if (this.groupId != this.contextModel.active_group) {
			this.onTabClick(this.getSelectedFolder());
		}

		if (appointment) {
			var record = appointment.getRecord();

			if (event.ctrlKey) {
				if (this.selectionModel.isSelected(record)) {
					this.selectionModel.deselectRecord(record);
				} else {
					this.selectionModel.selectRecord(record, true);
				}
			} else {
				this.selectionModel.selectRecord(record, false);
			}

			this.rangeSelectionModel.clearSelections();
		} else {
			this.selectionModel.clearSelections();
			var xy = event.getXY();
			var range = this.screenLocationToDateRange(xy[0], xy[1]);

			// Manage selection into selection model if range is defined
			if (range) {
				this.rangeSelectionModel.set(range, this);
			}
		}
	},

	/**
	 * Event handler for the D&D proxy, which is called when the mouseup event has been fired.
	 * If an {@link Zarafa.calendar.ui.AppointmentView appointment} was selected and moved this will mark
	 * the given appointment as selected.
	 * @param {Object} event The event object
	 * @param {Zarafa.calendar.ui.AppointmentView} appointment The selected appointment
	 * @private
	 */
	onMouseUp : function(event, appointment)
	{
		if (appointment && (appointment.isAllDay() ? appointment.eventOverHeader(event) : appointment.eventOverBody(event))) {
			this.selectionModel.deselectRecord(appointment.getRecord());
		}
	},

	/**
	 * Method called from {@link Zarafa.calendar.ui.CalendarViewDragZone#onInitDrag} when the user starts dragging
	 *
	 * @param {Ext.EventObject} event The mouse event
	 * @param {Zarafa.calendar.ui.AppointmentView} appointment The appointment on which the event occurred
	 * @private
	 */
	onInitDrag : function(event, appointment)
	{
		this.fireEvent('appointmentinitdrag', this, event, appointment);
	},

	/**
	 * Method called from {@link Zarafa.calendar.ui.CalendarViewDragZone#onInitDrag} when the user releases an appointment they had been dragging.
	 *
	 * @param {Ext.EventObject} event The mouse event
	 * @param {Zarafa.calendar.ui.AppointmentView} The appointment on which the event occurred
	 * @private
	 */
	onEndDrag : function(event, appointment)
	{
		this.fireEvent('appointmentenddrag', this, event, appointment);
	},

	/**
	 * Event handler for the D&D proxy, which is called when an given {@link Zarafa.core.DateRange dateRange}
	 * has been selected. This will update the {@link #rangeSelectionModel}
	 * @param {Object} event The event object
	 * @param {Zarafa.core.DateRange} dateRange The dateRange which was selected.
	 * @private
	 */
	onSelect : function(event, dateRange)
	{
		this.rangeSelectionModel.set(dateRange, this);
	},

	/**
	 * Destroy all elements which were created by this calendar view. Note that all
	 * cleaned up by the superclass.
	 * @override
	 */
	destroy : function()
	{
		Ext.destroy(this.bodyDragZone, this.bodyDropZone);
		Ext.destroy(this.headerDragZone, this.headerDropZone);

		Zarafa.calendar.ui.AbstractCalendarView.superclass.destroy.call(this);
	},

	/**
	 * Set this view to the currently active one in the {@link Zarafa.calendar.CalendarMultiView}
	 * @param {Boolean} active
	 */
	setActive : function(active)
	{
		this.active = active;
	}
});
