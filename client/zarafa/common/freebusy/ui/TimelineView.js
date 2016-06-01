Ext.namespace('Zarafa.common.freebusy.ui');

/**
 * @class Zarafa.common.freebusy.ui.TimelineView
 * @extends Ext.BoxComponent
 * @xtype zarafa.freebusytimelineview
 */
Zarafa.common.freebusy.ui.TimelineView = Ext.extend(Ext.BoxComponent,
{
	/**
	 * @cfg {Zarafa.common.freebusy.data.FreebusyModel} model
	 * <b>This is a required setting</b>. The {@link Zarafa.common.freebusy.data.FreebusyModel} holds the data for the
	 * Freebusy component.
	 */
	model: null,
	/**
	 * @cfg {Zarafa.common.freebusy.data.TimelineSelector} selector
	 * The used in the timeline.
	 */
	selector: null,
	/**
	 * @cfg {Number} headerHeight
	 * The height of the header (defaults to 50).
	 */
	headerHeight: 64,
	/**
	 * @cfg {Number} defaultHourCellWidth
	 * The width of the cells displaying an hour on the timeline at 100% zoomlevel (defaults to 60).
	 */
	defaultHourCellWidth: 60,
	/**
	 * @cfg {Number} bufferTimesViewportWidth
	 * To determine what range should be loaded this property is used to to see how many times the
	 * width of the viewport should be loaded in days. If the viewport is 100px wide and the
	 * bufferTimesViewportWidth is set to 5, the range that will be loaded is 500px.(defaults to 5).
	 */
	bufferTimesViewportWidth: 5,	// Times the width of viewport, not days
	/**
	 * The daysMap is an array mapping of all the days that the freebusy timeline will show. For
	 * each day there is an object defined with the following information.
	 * {
	 *   label: Label of the day "Tuesday 12 February 2010"(String)
	 *   currentDay: Indication whether this day is the current day (Boolean)
	 *   timestamp: Timestamp of the start of the day (Number)
	 *   displayNodeHeader: HTML node of the element that shows the day in the header, if not displayed set to false (HTML Element|boolean}
	 *   displayNodeBody: HTML node of the element that shows the day in the body, if not displayed set to false (HTML Element|boolean}
	 *   leftPos: The pixel offset for this day
	 * }
	 * This property is set by the buildDayMapping method.
	 */
	daysMap: null,
	/**
	 * The hoursEachDayMap is an array mapping of the hours that have to be shown for each day. Each
	 * day has the an object defined with the following information.
	 * {
	 *   label: Label of the hour "12:00"(String)
	 *   startDayOffset: Number of seconds since start of the day (Number)
	 *   workinghour: Indication whether this hour is a working hour(Boolean)
	 * }
	 * This property is set by the buildDayMapping method.
	 */
	hoursEachDayMap: null,
	/**
	 * @cfg {Number} daySpacing
	 * The spacing between two days in pixels (defaults to 10).
	 */
	daySpacing: 3,
	/**
	 * @cfg {Number} daySpacing
	 * The width of the borders. The cellspacing in the tables is used to create the borders (defaults to 1).
	 * Changing this property to another value alone is not witout issues.
	 */
	borderSpacing: 0,
	/**
	 * @cfg {Number} blockRowHeight
	 * The height of the block rows (defaults to 22).
	 */
	blockRowHeight: 30,
	/**
	 * @cfg {Number} sumBlockRowHeight
	 * The height of the sumblock rows (defaults to 10).
	 */
	sumBlockRowHeight : 12,
	/**
	 * @cfg {Number} extraBodyHeight
	 * Height that is added to the body container to match the height of the userlist body (defaults to 0).
	 */
	extraBodyHeight: 0,
	/**
	 * @cfg {Number} workingHoursStart
	 * Defines the first working hour. This is defined as the number of minutes
	 * since the start of the day. (defaults to the default settings value for
	 * 'zarafa/v1/main/start_working_hour').
	 */
	workingHoursStart: 0,
	/**
	 * @cfg {Number} workingHoursEnd
	 * Defines the hour the working hours range ends. This is defined as the number of minutes
	 * since the start of the day. (defaults to the default settings value for
	 * 'zarafa/v1/main/end_working_hour').
	 */
	workingHoursEnd: 24,
	/**
	 * @cfg {Array} workDays
	 * Defines the array of day numbers containing all working days (default to
	 * the default settings value for 'zarafa/v1/main/working_days').
	 */
	workDays: undefined,
	/**
	 * @cfg {String} blockSelector
	 * <b>This is a required setting</b>. A simple CSS selector (e.g. <tt>div.some-class</tt> or
	 * <tt>span:first-child</tt>) that will be used retrieve the block nodes this for TimelineView.
	 */
	blockSelector: 'div.x-freebusy-timeline-block',

	/**
	 * The height of the top row of the timeline header. In this row the date of the day is placed.
	 * This value is calculated based on the headerHoursHeight and the headerSumRowHeight which are
	 * subtracted from the total available headerHeight.
	 * @property
	 * @type Number
	 * @private
	 */
	headerDayHeight: 0,

	/**
	 * The height of the hours row in the timeline header.
	 * @property
	 * @type Number
	 * @private
	 */
	headerHoursHeight: 24,

	/**
	 * The height of the sum row (all attendees bar) in the timeline header.
	 * @property
	 * @type Number
	 * @private
	 */
	headerSumRowHeight: 10,

	/**
	 * Number of seconds per hour slot. Zoom of 100% will have 60 minutes per slot (in seconds).
	 * @property
	 * @type Number
	 * @private
	 */
	slotDuration: null,

	/**
	 * The width of a day, set by the buildDayMapping method.
	 * @property
	 * @type Number
	 * @private
	 */
	dayWidth: null,

	/**
	 * The width of an hour, set by the buildDayMapping method.
	 * @property
	 * @type Number
	 * @private
	 */
	hourWidth: null,

	/**
	 * The width of the entire timeline, set by the buildDayMapping method
	 * @property
	 * @type Number
	 * @private
	 */
	timelineWidth: null,

	/**
	 * List of block elements in a {@link Ext.CompositeElementLite}.
	 * @property
	 * @type Array
	 * @private
	 */
	all: null,

	/**
	 * The user store which contains all the users for which the freebusy data will be shown.
	 * This store is obtained from the {@link #model}.
	 * @property
	 * @type Ext.data.Store
	 * @private
	 */
	userStore: null,

	/**
	 * The block store which contains all the blocks which must be rendered on the row for the user to which the block belongs to
	 * This store is obtained from the {@link #model}.
	 * @property
	 * @type Ext.data.Store
	 * @private
	 */
	blockStore : null,

	/**
	 * The sumblock store which contains all the sumblocks which must be rendered at the top of the timeline.
	 * This store is obtained from the {@link #model}.
	 * @property
	 * @type Ext.data.Store
	 * @private
	 */
	sumBlockStore : null,

	/**
	 * Id prefix to make freebusy blocks on the timeline unique in combination with the record ID's
	 * from the block store records.
	 * @property
	 * @type String
	 * @private
	 */
	uniqueBlockId: null,

	/**
	 * @constructor
	 * @param {Object} config The configuration options.
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			workingHoursStart: container.getSettingsModel().get('zarafa/v1/main/start_working_hour'),
			workingHoursEnd: container.getSettingsModel().get('zarafa/v1/main/end_working_hour'),
			workDays: container.getSettingsModel().get('zarafa/v1/main/working_days')
		});

		// No working days, default back to the entire week.
		// FIXME: Not sure if this is the right location for this check,
		// we should consider a more appropriate location for validating
		// the settings.
		if (Ext.isEmpty(config.workDays)) {
			config.workDays = [ 0, 1, 2, 3, 4, 5, 6 ];
		}

		this.addEvents(
			/**
			 * @event bodyscroll
			 * Fires when the body of the timeline is scrolled.
			 * @param {Object} An object containing the scroll position in the format {left: (scrollLeft), top: (scrollTop)}
			 */
			'bodyscroll',
			/**
			 * @event mousedown
			 * Fires when a mousedown is detected within the timeline.
			 * @param {Ext.EventObject} e The {@link Ext.EventObject} encapsulating the DOM event.
			 * @param {HtmlElement} t The target of the event.
			 * @param {Object} o The options configuration passed to the {@link #addListener} call.
			 */
			'timelinemousedown',
			/**
			 * @event timelinemouseup
			 * Fires when a mouseup is detected within the timeline.
			 * @param {Ext.EventObject} e The {@link Ext.EventObject} encapsulating the DOM event.
			 * @param {HtmlElement} t The target of the event.
			 * @param {Object} o The options configuration passed to the {@link #addListener} call.
			 */
			'timelinemouseup',
			/**
			 * @event timelinemousemove
			 * Fires when a mousemove is detected with the timeline.
			 * @param {Ext.EventObject} e The {@link Ext.EventObject} encapsulating the DOM event.
			 * @param {HtmlElement} t The target of the event.
			 * @param {Object} o The options configuration passed to the {@link #addListener} call.
			 */
			'timelinemousemove',
			/**
			 * @event rendertimeline
			 * Fires when the timeline elements are rendered.
			 * @param {Zarafa.common.freebusy.ui.TimelineView} Reference to the TimelineView
			 */
			'rendertimeline',
			/**
			 * @event beforerefreshtimeline
			 * Fires before the timeline is refreshed.
			 * @param {Zarafa.common.freebusy.ui.TimelineView} Reference to the TimelineView
			 */
			'beforerefreshtimeline',
			/**
			 * @event afterrefreshtimeline
			 * Fires after the timeline is refreshed and the sizes of the timeline have been
			 * recalculated.
			 * @param {Zarafa.common.freebusy.ui.TimelineView} Reference to the TimelineView
			 */
			'afterrefreshtimeline'
		);

		Zarafa.common.freebusy.ui.TimelineView.superclass.constructor.call(this, config);

		this.daterange = this.model.getDateRange();
		this.mon(this.model, {
			'userstorechange': this.onUserStoreChange,
			'blockstorechange': this.onBlockStoreChange,
			'sumblockstorechange': this.onSumBlockStoreChange,
			'showworkinghourschange': this.onShowWorkingHoursChange,
			scope: this
		});
	},

	/**
	 * Sets up the required templates, prepares the list of freebusy blocks and seeks for the store.
	 * @private
	 */
	initComponent: function(){
		this.masterTpl = new Ext.XTemplate(
			'<div class="x-freebusy-header">',
				'<div class="x-freebusy-header-body"></div>',
				'<div class="x-freebusy-sumblockcontainer"></div>',
			'</div>',
			'<div class="x-freebusy-body">',
				'<div class="x-freebusy-background"></div>',
				'<div class="x-freebusy-blockcontainer"></div>',
				'<div class="x-freebusy-selectorcontainer"></div>',
			'</div>',
			{
				// Format functions like capitalize in the Ext.util.Format are not
				// used in this template anyways. Speeds up the apply time.
				disableFormats: true
			}
		);

		this.headerTemplate = new Ext.XTemplate(
			'<table class="x-freebusy-timeline-day-header" cellpadding="0" cellspacing="0" style="width: {dayWidth}px">',
				'<tr class="x-freebusy-timeline-day">',
					'<td colspan="{numHours}" style="height:{headerDayHeight}px;">',
					'{dayLabel}',
					'</td>',
				'</tr>',
				'<tr class="x-freebusy-timeline-hour">',
					'<tpl for="hours">',
						'<td style="width: {parent.hourWidth}px; height:{parent.headerHoursHeight}px;">{label}</td>',
					'</tpl>',
				'</tr>',
			'</table>',
			{ disableFormats: true }
		);
		this.headerSumTemplate = new Ext.XTemplate(
			'<table class="x-freebusy-timeline-day-sum" cellpadding="0" cellspacing="0" style="width: {dayWidth}px">',
				'<tr class="x-freebusy-timeline-hour x-freebusy-timeline-sum">',
					'<tpl for="hours">',
						'<td style="width: {parent.hourWidth}px; height:{parent.headerSumRowHeight}px;"></td>',
					'</tpl>',
				'</tr>',
			'</table>',
			{ disableFormats: true }
		);
		this.bodyBGTemplate = new Ext.XTemplate(
			'<table class="x-freebusy-timeline-day-body" cellpadding="0" cellspacing="0" style="width: {dayWidth}px">',
				'<tr class="x-freebusy-timeline-hour">',
					'<tpl for="hours">',
						'<td style="width: {parent.hourWidth}px">&nbsp;</td>',
					'</tpl>',
				'</tr>',
			'</table>',
			{ disableFormats: true }
		);
		this.blockTemplate = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-freebusy-timeline-block x-freebusy-timeline-block-{busyStatusName}" id="{blockId}" style="width: {blockWidth}px; left: {blockLeft}px; top:{blockTop}px; height: {blockHeight}px;"></div>',
			'</tpl>',
			{ disableFormats: true }
		);
		this.sumBlockTemplate = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-freebusy-timeline-sumblock x-freebusy-timeline-block-{busyStatusName}" style="width: {blockWidth}px; left: {blockLeft}px; height: {blockHeight}px;"></div>',
			'</tpl>',
			{ disableFormats: true }
		);

		this.uniqueBlockId = Ext.id();
		this.all = new Ext.CompositeElementLite();

		Zarafa.common.freebusy.ui.TimelineView.superclass.initComponent.call(this);

		if(this.selector){
			this.selector.init(this);
		}
	},

	/**
	 * Renders the background container and sets up the day and hour mappings.
	 * @private
	 */
	onRender: function(){
		this.autoEl = {
			cls: 'x-freebusy-timeline-container'
		};
		Zarafa.common.freebusy.ui.TimelineView.superclass.onRender.apply(this, arguments);

//TODO: The initial render should also contain a refresh call to directly put in all the blocks of the already loaded users.
		this.buildDayMapping();
		this.renderTimeline();
	},

	/**
	 * Called to re-render the entire TimelineView.
	 * @private
	 */
	refreshTimeline: function(){
		this.fireEvent("beforerefreshtimeline", this);

		// Capture the snapshot of the viewable area.
		var viewportSnapshot = this.captureViewportSnapshot();
		// Clearing the old HTML node references to the viewed days in the timeline background as
		// well as regenerating the list of hours and days shown on the timeline.
		this.buildDayMapping();
		// Rendering the HTML elements for the timeline (and discarding the old ones).
		this.renderTimeline();
		// Triggering the resizing of the timeline. Will also trigger the repainting of the timeline days.
		this.syncSize();
		// Restore the viewable area inside the viewport
		this.restoreViewportSnapshot(viewportSnapshot);
		// Triggers the repainting of the blocks on the timeline.
		this.refresh();

		this.fireEvent("afterrefreshtimeline", this);
	},

	/**
	 * Creates a snapshot object that will contain information to get the viewport of the timeline
	 * focussed on the same area.
	 * The object contains the following properties.
	 * <ul>
	 * <li>selectionInView {@link Boolean} indication whether the selection of the {@link #selectorRange}
	 * is visible inside the viewport.</li>
	 * <li>focusDateRange {@link Zarafa.core.DateRange} The period of time that is centered on in the
	 * viewport.</li>
	 * <li>diffOffset {@link Number} The number of pixels between the start of the selection of the
	 * {@link #selectorRange} and the center of the viewport. A negative values means the selection
	 * is before the center.</li>
	 * </ul>
	 * @return {Object} An object containing selectionInView, focussedDateRange and diffOffset properties.
	 */
	captureViewportSnapshot: function(){
		// Setup the viewportSnapshot
		var snapshot = {
			selectionInView: false,
			focusDateRange: null,
			diffOffset: null
		};

		// Check to see if the selection is inside the view
		var selectorRange = this.model.getSelectorRange();
		// FIXME check if we have a selectorRange (Freebusy without selection is possible)
		snapshot.selectionInView = this.getViewedDateRange().overlaps(selectorRange);

		// If selection is inside view calculate the offset between the start of the selection and
		// the center of the viewport in pixels
		if(snapshot.selectionInView){
			var selectionStart = selectorRange.getStartDate();
			var startOffset = this.findBlockPixelOffset(selectionStart.getTime()/1000);

			// Get the left side of the viewport
			var leftOffset = this.bodyElem.getScroll().left;
			// Use the half of the width of the viewport plus the leftOffset to get the center offset.
			var viewportSize = Ext.get(this.bodyElem).getViewSize();
			var centerOffset = leftOffset + (viewportSize.width/2);

			// Get difference between centerOffset(viewport) and the startOffset(start of selection)
			snapshot.diffOffset = startOffset - centerOffset;

		}else{
			// Retrieve the focus to be used after the refreshing has been done
			snapshot.focusDateRange = this.getFocusDateRange();
		}

		return snapshot;
	},

	/**
	 * Will restore the viewport based on the snapshot it will get passed. If the user selection was
	 * visible inside the viewport when the snapshot was created, than this method will keep the
	 * selection at the same place inside the viewport.
	 * If the selection is outside the viewable area than it will center on the time it was centered
	 * on when the snapshot was created.
	 * The difference between these two approaches is that when you have the selection in view it
	 * will not get scrolled away when it is visible near the edge of the viewport. Which would be
	 * the case if you were to center on the position that was in the middle of the viewport. If the
	 * selection was not visible then we do not need to go through all that trouble.
	 * @param {Object} snapshot Needs a snapshot that is returned by the
	 * {@link @createViewportSnapshot} method.
	 */
	restoreViewportSnapshot: function(snapshot){
		var focusDateRange;

		if(snapshot.selectionInView){
			// Get the start date of the selection
			var selectorRange = this.model.getSelectorRange();
			var selectionStart = selectorRange.getStartDate();

			// Use the start of the selection to get the offset in pixels from the start of the timeline.
			var startOffset = this.findBlockPixelOffset(selectionStart.getTime()/1000);
			// Based on the startOffset we now calculate the position the viewport should be centered on.
			var centerOffset = startOffset - snapshot.diffOffset;
			// Transform this center offset in pixels to a timestamp
			var centerTimestamp = this.findTimestampByTimelineXCoord(centerOffset);

			// Create a daterange to be used to focus the viewport on
			focusDateRange = new Zarafa.core.DateRange({ startDate : new Date(centerTimestamp*1000), dueDate : new Date(centerTimestamp*1000) });
		}else{
			// Just focus on the center when the selection was not visible
			focusDateRange = snapshot.focusDateRange;
		}

		// Scroll to the DateRange of the original focus
		this.scrollDateIntoView(focusDateRange);
	},

	/**
	 * Returns the {@link Zarafa.core.data.DateRange DateRange} that the focus is centered on. It
	 * looks for the hour slot that is in the center of the viewport. That slot will be returned in
	 * a DateRange.
	 * @return {Zarafa.core.DateRange} Range of the focus
	 */
	getFocusDateRange: function(){
		// Get the dimensions and scroll offset
		var leftOffset = this.bodyElem.getScroll().left;
		var viewportSize = Ext.get(this.bodyElem).getViewSize();

		// Get the offset of the center (focus) of the viewport
		var focusOffset = leftOffset + (viewportSize.width/2);
		// The dayWidth is excluding the spaces between the days so we have to include those too
		var dayIndex = focusOffset / (this.dayWidth + this.daySpacing);

		// Get the decimal part from the dayIndex, to be used for calculating what part of the day to focus on
		var dayRatioIndex = dayIndex % 1;
		dayIndex = Math.floor(dayIndex);

		var dayMap = this.daysMap[ dayIndex ];
		var numDisplayedHours = this.hoursEachDayMap.length;
		// Get the index of the hour the focus is centered on using the decimal part of the dayIndex
		var hourIndex = Math.floor(numDisplayedHours * dayRatioIndex);

		// Get the start and the end of the hour slot that is focus is centered on
		var focusStartTimestamp = dayMap.timestamp + this.hoursEachDayMap[ hourIndex ].startDayOffset;
		var focusEndTimestamp = focusStartTimestamp + this.slotDuration;

		return new Zarafa.core.DateRange({ startDate : new Date(focusStartTimestamp*1000), dueDate : new Date(focusEndTimestamp*1000) });
	},

	/**
	 * Returns the {@link Zarafa.core.data.DateRange DateRange} that the viewport is showing. The
	 * start date is set to the date that the left edge of the viewport is on and the due date is
	 * set to the date the right edge of the viewport is on.
	 * @return {Zarafa.core.DateRange} Range of the viewed area
	 */
	getViewedDateRange: function(){
		// Get scroll offset of the left and right edges of the viewport
		var leftOffset = this.bodyElem.getScroll().left;
		var viewportSize = Ext.get(this.bodyElem).getViewSize();
		var rightOffset = leftOffset + viewportSize.width;

		// Transform the scroll offsets to timestamps
		var startTimestamp = this.findTimestampByTimelineXCoord(leftOffset);
		var endTimestamp = this.findTimestampByTimelineXCoord(rightOffset);

		return new Zarafa.core.DateRange({ startDate : new Date(startTimestamp*1000), dueDate : new Date(endTimestamp*1000) });
	},

	/**
	 * Rendering the HTML elements needed for the TimelineView. Will also create references of to
	 * important HTML elements and will header and body elements.
	 * @private
	 */
	renderTimeline: function(){
		// Remove the old scroll event from the body and header
		if(this.bodyElem){
			this.mun(this.bodyElem, {
				scope: this,
				"scroll": this.onBodyScroll,
				"mousedown": this.onBodyMouseDown,
				"mousemove": this.onBodyMouseMove,
				"mouseup": this.onBodyMouseUp,
				"contextmenu": this.onBodyContextMenu
			});
		}
		if(this.headerElem) {
			this.mun(this.headerElem, {
				scope: this,
				"contextmenu": this.onHeaderContextMenu
			});
		}

		// Setup the HTML structure for the whole TimelineView
		this.masterTpl.overwrite(this.el);

		// Set references to the different elements in the timeline
		this.containerElem = Ext.get(this.el.dom);
		this.headerElem = Ext.get(this.containerElem.dom.firstChild);
		this.headerBodyElem = Ext.get(this.headerElem.dom.firstChild);
		this.headerSumContainer = Ext.get(this.headerElem.dom.childNodes[1]);
		this.bodyElem = Ext.get(this.containerElem.dom.childNodes[1]);
		this.bodyBackgroundElem = Ext.get(this.bodyElem.dom.firstChild);
		this.bodyBlockContainer = Ext.get(this.bodyElem.dom.childNodes[1]);
		this.bodySelectorContainer = Ext.get(this.bodyElem.dom.childNodes[2]);

		// Set scroll event on body to fire scroll event in this TimelineView
		this.mon(this.bodyElem, {
			scope: this,
			"scroll": this.onBodyScroll,
			"mousedown": this.onBodyMouseDown,
			"mousemove": this.onBodyMouseMove,
			"mouseup": this.onBodyMouseUp,
			"contextmenu": this.onBodyContextMenu
		});
		this.mon(this.headerElem, {
			scope: this,
			"contextmenu": this.onHeaderContextMenu
		});

		// Position and set width and height for header and body elements in timeline
		this.layoutTimelineElements();

		this.fireEvent("rendertimeline", this);
	},

	/**
	 * Set the correct width for the header, body background timeline and body block container
	 * elements. It will also calculate the correct height for the header of the timeline.
	 * @private
	 */
	layoutTimelineElements: function(){
		this.headerBodyElem.setWidth(this.timelineWidth);
		this.bodyBackgroundElem.setWidth(this.timelineWidth);
		this.bodyBlockContainer.setWidth(this.timelineWidth);

		// Calculate the height settings of the header elements.
		// Header consists of three rows. The day row and the hours row have no horizontal border-spacing.
		// The header sum row is a separate table and has two border-spacings (top & bottom).
		var heightSumRowBordersIncluded = this.headerSumRowHeight + (this.borderSpacing*2);
		this.headerDayHeight = (this.headerHeight - heightSumRowBordersIncluded - this.headerHoursHeight);

		// Calculating the top style for the sumblocks container in the header that contains the
		// cumulative freebusy blocks. For this we take the full height of the header and extract
		// the height of the sum row and the border that is at the bottom.
		var sumBlockContainerTopSpace = this.headerHeight - (this.headerSumRowHeight + this.borderSpacing);
		this.headerSumContainer.setTop(sumBlockContainerTopSpace);
	},

	/**
	 * Binding the blockStore and the userStore
	 * @private
	 */
	afterRender : function(){
		Zarafa.common.freebusy.ui.TimelineView.superclass.afterRender.apply(this, arguments);

		if (this.model.getBlockStore()) {
			this.bindBlockStore(this.model.getBlockStore(), true); 
		}
		if (this.model.getSumBlockStore()) {
			this.bindSumBlockStore(this.model.getSumBlockStore(), true);
		}
		if (this.model.getUserStore()) {
			this.bindUserStore(this.model.getUserStore(), true);
		}
	},

	/**
	 * Get the template target that is used to add the blocks to.
	 * @private
	 */
	getBlockTemplateTarget: function(){
		// We return the container that is used for the freebusy blocks.

		return this.bodyBlockContainer;
	},

	/**
	 * Get the template target for the background days.
	 * @private
	 */
	getBGTemplateTarget: function(){
		// In this container the background days are rendered.
		return this.bodyBackgroundElem;
	},

	/**
	 * Get the HTML Element that functions as the container for the selector.
	 * @return {HTMLElement} Selector container
	 * @private
	 */
	getSelectorContainer: function(){
		// In this container the selector can be rendered.
		return this.bodySelectorContainer;
	},

	/**
	 * Called after the component is resized, this method is empty by default but can be implemented by any
	 * subclass that needs to perform custom logic after a resize occurs.
	 * @param {Number} adjWidth The box-adjusted width that was set
	 * @param {Number} adjHeight The box-adjusted height that was set
	 * @param {Number} rawWidth The width that was originally specified
	 * @param {Number} rawHeight The height that was originally specified
	 * @protected
	 */
	onResize : function(adjWidth, adjHeight, rawWidth, rawHeight){
		this.headerElem.setHeight(this.headerHeight);

		this.bodyElem.setTop(this.headerHeight);
		var bodyElemHeight = adjHeight - this.headerHeight;
		this.bodyElem.setHeight(bodyElemHeight);

		this.sizeTimelineBackground();

		this.repaintTimeline();
	},

	/**
	 * Handles the actions that should take place when the user scrolls the body
	 * @private
	 */
	onBodyScroll: function(){
		this.repaintTimeline();

		this.fireEvent("bodyscroll", this.bodyElem.getScroll());
	},

	/**
	 * Called when the mousedown event is fired on the body.
	 * @param {Ext.EventObject} evt The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} target The target of the event.
	 * @param {Object} cfg The options configuration passed to the {@link #addListener} call.
	 * @private
	 */
	onBodyMouseDown: function(evt, target, cfg){
		this.fireEvent("timelinemousedown", evt, target, cfg);
	},

	/**
	 * Called when the mousemove event is fired on the body.
	 * @param {Ext.EventObject} evt The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} target The target of the event.
	 * @param {Object} cfg The options configuration passed to the {@link #addListener} call.
	 * @private
	 */
	onBodyMouseMove: function(evt, target, cfg){
		this.fireEvent("timelinemousemove", evt, target, cfg);
	},

	/**
	 * Called when the mouseup event is fired on the body.
	 * @param {Ext.EventObject} evt The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} target The target of the event.
	 * @param {Object} cfg The options configuration passed to the {@link #addListener} call.
	 * @private
	 */
	onBodyMouseUp: function(evt, target, cfg){
		this.fireEvent("timelinemouseup", evt, target, cfg);
	},

	/**
	 * Called when the contextmenu event is fired on the body.
	 * @param {Ext.EventObject} evt The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} target The target of the event.
	 * @param {Object} cfg The options configuration passed to the {@link #addListener} call.
	 * @private
	 */
	onBodyContextMenu : function(evt, target, cfg)
	{
		Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.freebusy.timelinebody'], undefined, { position : evt.getXY(), model : this.model });
	},

	/**
	 * Called when the contextmenu event is fired on the header.
	 * @param {Ext.EventObject} evt The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} target The target of the event.
	 * @param {Object} cfg The options configuration passed to the {@link #addListener} call.
	 * @private
	 */
	onHeaderContextMenu: function(evt, target, cfg)
	{
		Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.freebusy.timelineheader'], undefined, { position : evt.getXY(), model : this.model });
	},
	
	/**
	 * Regenerate the background image use for the day blocks
	 * These are the horizontal lines that border the user blocks in the day blocks 
	 * Basically we have a background image of a pixel in the color of the border color
	 * that we repeat in x-direction and we add it as many times as there are users in the userStore
	 * (CSS multiple backgrounds)
	 */
	restyleBodyBackground : function()
	{
		var backgroundStyle = 'url(data:image/gif;base64,R0lGODlhAQABAIABAObm5v///yH+EUNyZWF0ZWQgd2l0aCBHSU1QACwAAAAAAQABAAACAkQBADs=) repeat-x left top';
		for ( var i=0; i<=this.userStore.getCount(); i++ ){
			backgroundStyle += ', url(data:image/gif;base64,R0lGODlhAQABAIABAObm5v///yH+EUNyZWF0ZWQgd2l0aCBHSU1QACwAAAAAAQABAAACAkQBADs=) repeat-x left ' + (this.blockRowHeight*(i+1)) +'px';
		}
		var dayBlocks = this.bodyBackgroundElem.query('.x-freebusy-timeline-day');
		for ( i=0; i<dayBlocks.length; i++ ){
			Ext.get(dayBlocks[i]).setStyle('background', backgroundStyle);
		}
		
	},

	/**
	 * Resizes the vertical sizes based on the number of users that have been added. This needs to
	 * be recalculated because if the number of users exceeds the amount that can be shown in the
	 * viewport at one time the height of the timeline needs to be resized beyond the height of the
	 * viewport. Everytime a new user is added or one is removed this function can be called to
	 * resized the timeline to the correct height.
	 * @private
	 */
	sizeTimelineBackground: function(){
		if(this.bodyElem.dom.clientHeight <= 0) {
			// if height is zero that means timelineView is hidden, so we shouldn't do resizing
			return;
		}

		// Set the height of the timeline background based on the number of users in the user store.
		var userStore = this.userStore;
		var numRows = userStore.getCount();
		var bodyHeight = numRows * this.blockRowHeight + this.extraBodyHeight;

		/**
		 * The columns of the background timeline need to be sized to fill the body viewport. If
		 * there is an active scrollbar then they need to be sized even bigger to also show behind
		 * the blocks that are in the rows outside the viewport.
		 * this.bodyElem.clientHeight => height of body element without scrollbars
		 */
		this.bodyBackgroundElem.setHeight( Math.max( this.bodyElem.dom.clientHeight, bodyHeight ) );
		// Resize the bodybackground
		this.bodySelectorContainer.setHeight( Math.max( this.bodyElem.dom.clientHeight, bodyHeight ) );

		// Always scroll to the bottom of the page...
		this.bodyElem.scrollTo("top", this.bodyElem.dom.scrollHeight);
		
		// Reset the background image, because they are the horizontal lines
		this.restyleBodyBackground();
	},

	/**
	 * Everytime the user scrolls or when the component is resized the background needs to be
	 * redrawn. The background of the timeline only loads the days that are visible and their
	 * surrounding days. To determine what range should be loaded it looks for the
	 * bufferTimesViewportWidth to see how many times the width of the viewport should be loaded in
	 * days. If the viewport is 100px wide and the bufferTimesViewportWidth is set to 5, the range
	 * that will be loaded is 500px.
	 * It will map the range to the days that will need to be loaded. Next it will figure out what
	 * days need to be rendered and what days have to be cleaned up because they do no longer fall
	 * within the range.
	 * @private
	 */
	repaintTimeline: function(){
		// Get some basic values of the width of one day, the size of the
		// viewport and the position of the scrollbar.
		var viewportSize = Ext.get(this.bodyElem).getViewSize();
		var scrollPxls = this.bodyElem.getScroll();

		/**
		 * Next we need to decide what range needs to be buffered. We use the value of
		 * this.bufferTimesViewportWidth to calculate the number of pixels that need to be loaded
		 * outside of the visual area in the viewport. If you want to buffer five times the width of
		 * the viewport (100px) then there are 400px that are shown outside of the viewport.
		 */
		var visiblePxlsOutsideViewport = (this.bufferTimesViewportWidth-1)*viewportSize.width;
		// Calculate the offset in pixels for the start and end point of the visual range.
		var startOffsetPixels = scrollPxls.left - (visiblePxlsOutsideViewport / 2);
		var endOffsetPixels = scrollPxls.left + viewportSize.width + (visiblePxlsOutsideViewport / 2);

		// Calculate what the first and last day is that must be buffered.
		var startDayIndex = Math.floor(startOffsetPixels / this.dayWidth);
		var endDayIndex = Math.ceil(endOffsetPixels / this.dayWidth);

		// Make sure the indexes do not exceed the number of days available.
		startDayIndex = (startDayIndex < 0) ? 0 : startDayIndex;
		endDayIndex = (endDayIndex < this.daysMap.length) ? endDayIndex : (this.daysMap.length - 1);

		// Determine what days need to be loaded extra and what days can be removed.
		var loadDays = [];
		var cleanupDays = [];
		for(var i=0;i<this.daysMap.length;i++){
			// If day is between the range to visualize.
			if(i >= startDayIndex && i <= endDayIndex){
				// Only add to loadDays when it is not displayed yet
				if(!this.daysMap[ i ].displayNodeBody){
					loadDays[ loadDays.length ] = i;
				}
			// If day falls outside visual range
			}else{
				// If day is marked as displayed it needs to be cleaned up
				if(this.daysMap[ i ].displayNodeBody){
					cleanupDays[ cleanupDays.length ] = i;
				}
			}
		}

		// First render days, then scroll, then cleanup. This way no empty header should be shown.
		this.renderTimelineDays( loadDays );
		this.headerElem.scrollTo("left", this.bodyElem.getScroll().left );	// Sync the header
		this.cleanUpTimelineDays( cleanupDays );

		// Reset the background image, because they are the horizontal lines
		this.restyleBodyBackground();
	},

	/**
	 * Renders the background days that have been supplied in renderDays.
	 * @param renderDays {Array} List of indexes of this.daysMap that will be rendered.
	 * @private
	 */
	renderTimelineDays: function(renderDays){
		var headerElem = Ext.get(this.headerBodyElem);
		var bodyElem = Ext.get(this.bodyBackgroundElem);

		for(var i=0;i<renderDays.length;i++){
			var dayIndex = renderDays[i];
			var currDayCls = '';
			if(this.daysMap[ dayIndex ].currentDay){
				currDayCls = ' x-freebusy-timeline-day-current';
			}

			var bodyDayElem = bodyElem.createChild({
				cls: 'x-freebusy-timeline-day' + currDayCls
			});
			bodyDayElem.dom.style.left = this.daysMap[ dayIndex ].leftPos+"px";

			this.bodyBGTemplate.overwrite(bodyDayElem, {
				dayLabel: this.daysMap[ dayIndex ].label,
				hours: this.hoursEachDayMap,
				hourWidth: this.hourWidth,
				numHours: this.hoursEachDayMap.length,
				dayWidth: this.dayWidth
			});

			var headerDayElem = headerElem.createChild({
				cls: 'x-freebusy-timeline-day' + currDayCls
			});
			headerDayElem.dom.style.left = this.daysMap[ dayIndex ].leftPos+"px";

			this.headerTemplate.overwrite(headerDayElem, {
				dayLabel: this.daysMap[ dayIndex ].label,
				hours: this.hoursEachDayMap,
				hourWidth: this.hourWidth,
				numHours: this.hoursEachDayMap.length,
				dayWidth: this.dayWidth,
				headerDayHeight: this.headerDayHeight,
				headerHoursHeight: this.headerHoursHeight,
				borderSpacing: this.borderSpacing
			});
			this.headerSumTemplate.append(headerDayElem, {
				hours: this.hoursEachDayMap,
				hourWidth: this.hourWidth,
				numHours: this.hoursEachDayMap.length,
				dayWidth: this.dayWidth,
				headerSumRowHeight: this.headerSumRowHeight,
				borderSpacing: this.borderSpacing
			});

			this.daysMap[ dayIndex ].displayNodeHeader = headerDayElem;
			this.daysMap[ dayIndex ].displayNodeBody = bodyDayElem;
		}
	},

	/**
	 * Cleans up the background days that have been supplied in cleanupDays.
	 * @param cleanupDays {Array} List of indexes of this.daysMap that will be cleaned up.
	 * @private
	 */
	cleanUpTimelineDays: function(cleanupDays){
		var elem;

		for(var i=0;i<cleanupDays.length;i++){
			var dayIndex = cleanupDays[i];

			elem = this.daysMap[ dayIndex ].displayNodeHeader;
			Ext.removeNode( elem.dom );
			elem = this.daysMap[ dayIndex ].displayNodeBody;
			Ext.removeNode( elem.dom );

			this.daysMap[ dayIndex ].displayNodeHeader = false;
			this.daysMap[ dayIndex ].displayNodeBody = false;
		}
	},

	/**
	 * Scrolls the supplied date into view. It will be centered into the view.
	 * @param date {Date|Number|Zarafa.core.DateRange.js} Date to be scrolled into view.
	 * @private
	 */
	scrollDateIntoView: function(date){
		// Make a timestamp out of a date
		if(date instanceof Date){
			date = Math.ceil(date.getTime()/1000);
		// Make a timestamp out of a Daterange
		}else if(date instanceof Zarafa.core.DateRange){
			var start = date.getStartDate().getTime()/1000;
			var end = date.getDueDate().getTime()/1000;
			var duration = end - start;
			date = start + (duration/2);
		}

		var viewport = Ext.get(this.bodyElem);
		var viewportSize = Ext.get(this.bodyElem).getViewSize();

		var pixelOffsetLeft = this.findBlockPixelOffset(date, true);

		// Make sure the date will be centered in the viewport
		pixelOffsetLeft = pixelOffsetLeft - (viewportSize.width / 2);

		viewport.scrollTo('left', pixelOffsetLeft);
	},

	/**
	 * Creates a mapping for each day and a mapping for the hours that are displayed.
	 * It also calculates and sets the widths for the days and hour cells.
	 * @private
	 */
	buildDayMapping: function()
	{
		var currDay = new Date().clearTime();

		this.daysMap = [];
		this.hoursEachDayMap = [];
		this.slotDuration = 60*60;
		var availableSlotsPerDay = (24*60*60) / this.slotDuration;

		// Dirty way of assigning the working hours
		for(var i=0;i<availableSlotsPerDay;i++) {
			// FIXME: We should support minutes as well, so we shouldn't
			// round to entire hours but to 15 minutes for example.
			var startHour = Math.floor(this.workingHoursStart / 60);
			var endHour = Math.ceil(this.workingHoursEnd / 60);
			if (!this.model.showOnlyWorkingHours() || (i >= startHour && i < endHour)) {
				this.hoursEachDayMap[ this.hoursEachDayMap.length ] = {
					// Run the hour through a formatter
					label: Date.parseDate(i, 'G').format(_('G:i')),
					startDayOffset: i * this.slotDuration,
					workingHour: (i >= startHour && i < endHour) ? true : false
				};
			}
		}

		var numHourBlocks = this.hoursEachDayMap.length;
		this.hourWidth = this.defaultHourCellWidth;
		// Each hour has two borders (left and right) which it shares with it's neighbours.
		this.dayWidth = ( (this.hourWidth + this.borderSpacing) * numHourBlocks ) + this.borderSpacing;

		// Set clone flag in clearTime to prevent changing the time in the daterange
		// Use 12:00 as basetime, to prevent problems when the DST switch is at 00:00
		// like in Brasil.
		var startdate = this.daterange.getStartDate().clearTime(true);
		startdate.setHours(12);

		for (var i = 0; i < this.daterange.getNumDays(); i++) {
			var date = startdate.add(Date.DAY, i).clearTime();

			// Check whether this iterated day is the current day
			var currDayCheck = currDay.getTime() == date.getTime();
			var workDay = false;

			for (var j = 0, len = this.workDays.length; j < len; j++) {
				if (this.workDays[j] == date.getDay()) {
					workDay = true;
					break;
				}
			}

			if (!this.model.showOnlyWorkingHours() || workDay) {
				this.daysMap.push({
					// Run date through formatter
					// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
					label: date.format(_('l jS F Y')),
					currentDay: currDayCheck,
					timestamp: date.getTime() / 1000,
					displayNodeHeaderBody: false,
					displayNodeBody: false,
					// Left boundary are used for determining whether to show the day or not
					leftPos: (this.daysMap.length * (this.dayWidth + this.daySpacing))
				});
			}
		}

		var numDays = this.daysMap.length;
		this.timelineWidth = (this.dayWidth + this.daySpacing) * numDays - this.daySpacing;
	},

	/**
	 * Changes the data store bound to this view and refreshes it.
	 * @param {Store} store The store to bind to this view
	 * @private
	 */
	bindBlockStore : function(store, initial)
	{
		if(this.blockStore) {
			this.mun(this.blockStore, 'load', this.onBlockLoad, this);
		}
		this.blockStore = Ext.StoreMgr.lookup(store);
		if(this.blockStore){
			this.mon(this.blockStore, {
				scope: this,
				load: this.onBlockLoad
			});

			this.refresh();
		}
	},

	/**
	 * Changes the data store bound to this view and refreshes it.
	 * @param {Store} store The store to bind to this view
	 * @private
	 */
	bindSumBlockStore : function(store, initial)
	{
		if (this.sumBlockStore) {
			this.mun(this.sumBlockStore, 'load', this.onSumBlocksLoad, this);
		}
		this.sumBlockStore = Ext.StoreMgr.lookup(store);
		if(this.sumBlockStore){
			this.mon(this.sumBlockStore, {
				scope: this,
				load: this.onSumBlocksLoad
			});

			this.refresh();
		}
	},
	/**
	 * load block(s) to the UI.
	 * @param {Ext.data.Store} ds Store of the record
	 * @param {Ext.data.Record[]} records List of records that have to be loaded
	 * @param {Object} options The options used the load the blocks from the server
	 * @private
	 */
	onBlockLoad : function(ds, records, options){
		if(this.all.getCount() === 0){
			this.refresh();
			return;
		}
		var filteredRecords = this.filterRecords(records);

		var nodes = this.bufferBlockRender(filteredRecords);
		this.all.last().insertSibling(nodes, 'after', true);
		this.all.elements.push.apply(this.all.elements, nodes);
	},

	/**
	 * Called when the {@link #sumBlockStore} has loaded new data and we
	 * can update the top freebusy bar with summed blocks
	 *
	 * Renders the sum blocks that show the cumulative freebusy information for all the recipients.
	 * The data from the blocks is combined into cumulative blocks for all recipients. When this
	 * calculation is done it does it seperately for the different busy statuses. So you will get a
	 * different track for tentative, busy and outofoffice. By displaying them on top of eachother
	 * the outofoffice is more important than busy and busy more important than tentative.
	 *
	 * @param {Ext.data.Store} store The store which raised the event
	 * @oaram {Ext.data.Record[]} records The records which have been loaded
	 * @param {Object} options The options from the load event
	 * @private
	 */
	onSumBlocksLoad : function(store, records, options)
	{
		if (store.getCount() === 0) {
			// No sum records are available, simply empty the sumBlockTemplate
			this.sumBlockTemplate.overwrite(this.headerSumContainer.dom, []);
			return;
		}

		this.sumBlockTemplate.overwrite(this.headerSumContainer.dom, this.collectData(records, 0, true));
	},

	/**
	 * Remove block from the UI.
	 * @param {Ext.data.Store} ds Store of the record
	 * @param {Ext.data.Record} record Record begin removed
	 * @param {Number} index Index of the record that has to be removed
	 * @private
	 */
	onRemove : function(ds, record, index){
		var blockId = this.uniqueBlockId+"-"+record.id;
		this.all.removeElement(blockId, true);
		if (this.blockStore.getCount() === 0){
			this.refresh();
		}
	},

	/**
	 * Refreshes the view by reloading the data from the store and re-rendering the template.
	 * @private
	 */
	refresh : function(){
		// Empty the container of blocks
		this.bodyBlockContainer.update("");
		this.all.clear();

		if (this.blockStore) {
			var records = this.blockStore.getRange();

			if (records.length > 0) {
				var filteredRecords = this.filterRecords(records);
				this.blockTemplate.overwrite(this.bodyBlockContainer.dom, this.collectData(filteredRecords));
				var nodes = Ext.query(this.blockSelector, this.bodyBlockContainer.dom);
				this.all.fill(nodes);
			}
		}

		if (this.sumBlockStore) {
			var sumRecords = this.sumBlockStore.getRange();

			if (sumRecords.length > 0) {
				var filteredSumRecords = this.filterRecords(sumRecords);
				this.sumBlockTemplate.overwrite(this.headerSumContainer.dom, this.collectData(filteredSumRecords));
			}
		}
	},

	/**
	 * Render the HTML for the records and return the nodes.
	 * @param {Ext.data.Record[]} records Records
	 * @return {Array} List of HTML nodes
	 * @private
	 */
	bufferBlockRender : function(records){
		var div = document.createElement('div');
		this.blockTemplate.overwrite(div, this.collectData(records));
		var nodes = Ext.query(this.blockSelector, div);
		return nodes;
	},

	/**
	 * Call prepareData for all the records in the list and return the list of data for all records.
	 * @param {Ext.data.Record[]} records List of records
	 * @param {Number} startIndex Start index
	 * @param {Boolean} sumHeader True if the blocks will be positioned into the SumBlock header.
	 * @return {Array} List of data for all records
	 * @private
	 */
	collectData : function(records, startIndex, sumHeader){
		var r = [];
		for(var i = 0, len = records.length; i < len; i++){
			r[r.length] = this.prepareData(records[i].data, startIndex+i, records[i], sumHeader);
		}
		return r;
	},

	/**
	 * Function that provides the formatting needed for the freebusy blocks to be displayed
	 * properly. It determines what the left pixel offset should be and what the width should be.
	 * This function is used to provide custom formatting for each Record that is used by this
	 * {@link Ext.DataView}'s {@link #tpl template} to render each node.
	 * @param {Array/Object} data The raw data object that was used to create the Record.
	 * @param {Number} recordIndex the index number of the Record being prepared for rendering.
	 * @param {Record} record The Record being prepared for rendering.
	 * @param {Boolean} sumHeader True if the block will be positioned into the SumBlock header.
	 * @return {Array/Object} The formatted data in a format expected by the internal {@link #tpl template}'s overwrite() method.
	 * (either an array if your params are numeric (i.e. {0}) or an object (i.e. {foo: 'bar'}))
	 * @private
	 */
	prepareData: function(data, recordIndex, record, sumHeader){
		// Copy the data object to prevent adding properties to the Record object
		data = Ext.apply({}, data);

		data.blockId = this.uniqueBlockId + "-" + record.id;
		if(data.status != Zarafa.core.mapi.BusyStatus.UNKNOWN){
			data.busyStatusName = Zarafa.core.mapi.BusyStatus.getName(data.status) || 'busy';
			data.busyStatusName = data.busyStatusName.toLowerCase();
		}else{
			data.busyStatusName = 'blur';

			if(this.model.showOnlyWorkingHours()) {
				var day = new Date(data.start*1000).getDay();
				// if day is Saturday then add two day in current day and get time stamp of Monday
				if(day === 6) {
					data.start = new Date(data.start*1000).add(Date.DAY, 2).getTime()/1000;
				} else if(day === 0) {
					// if day is Sunday then add one day in current day and get time stamp of Monday
					data.start = new Date(data.start*1000).add(Date.DAY, 1).getTime()/1000;
				}
			}
			var dayIndex = this.findDayIndexByTimestamp(data.start,true);
			var timestamp = this.daysMap[dayIndex].timestamp;
			data.start = timestamp;
		}

		var startRowTopOffset = 1;
		var rowHeight;

		if (sumHeader === true) {
			rowHeight = this.sumBlockRowHeight;
		} else {
			rowHeight = this.blockRowHeight;

			// Find the index of the user record
			var userIndex = this.userStore.indexOfId(record.get('userid'));

			if (userIndex >= 0) {
				startRowTopOffset += userIndex * rowHeight;
			}
		}

		data.blockTop = startRowTopOffset;

		var periodStart = this.daterange.getStartDate().getTime()/1000;
		var periodEnd = this.daterange.getDueDate().getTime()/1000;
		// The start/end date from the record have to be parsed since they are in String format and
		// we will have to do some calculations with them.
		var blockStart = parseInt(data.start, 10);
		var blockEnd = parseInt(data.end, 10);

		// Filter out any records that for some reason are beyond the period range.
		if(blockStart < periodEnd && blockEnd > periodStart){

			data.blockHeight = rowHeight - 2;

			if(blockStart < periodStart){
				data.blockLeft = 0;
			}else{
				// Get the leftoffset of the start of the block
				var pixelOffset = this.findBlockPixelOffset(blockStart, true);
				data.blockLeft = pixelOffset;
			}

			if(blockEnd > periodEnd){
				// Run the block until the end of the timeline
				data.blockWidth = this.bodyBackgroundElem.getWidth() - data.blockLeft;
			}else{
				// Get the leftoffset of the end of the block
				var pixelOffset = this.findBlockPixelOffset(blockEnd, false);
				// Offset has to be transformed into a width
				data.blockWidth = pixelOffset - data.blockLeft;
			}
		}
		return data;
	},

	/**
	 * Filters the list of records by checking whether they are going to be visible on the timeline.
	 * @param {Ext.data.Record[]} records List of records
	 * @return {Ext.data.Record[]} Filtered list of records
	 * @private
	 */
	filterRecords : function(records){
		var filteredRecords = [];
		var periodStart = this.daterange.getStartDate().getTime()/1000;
		var periodEnd = this.daterange.getDueDate().getTime()/1000;

		for(var i=0;i<records.length;i++){
			var blockStart = parseInt( records[i].get("start"), 10);
			var blockEnd = parseInt( records[i].get("end"), 10);

			if(this.filterBlockData(blockStart, blockEnd, periodStart, periodEnd)){
				filteredRecords.push(records[i]);
			}
		}

		return filteredRecords;
	},

	/**
	 * Determines whether the block should be rendered or not. When based on the supplied data it
	 * should not be rendered it will return false. Otherwise it will return true.
	 * @param {Number} blockStart Timestamp of start of block (in seconds).
	 * @param {Number} blockEnd Timestamp of end of block (in seconds).
	 * @param {Number} periodStart Timestamp of start of period (in seconds).
	 * @param {Number} periodEnd Timestamp of end of period (in seconds).
	 * @return {Boolean} Returns false when block should be hidden, otherwise returns true
	 * @private
	 */
	filterBlockData: function(blockStart, blockEnd, periodStart, periodEnd){
		// Filter out any records that for some reason are beyond the period range.
		if(blockStart < periodEnd && blockEnd > periodStart){

			if (this.model.showOnlyWorkingHours()) {
				var blockDuration = blockEnd - blockStart;
				var hiddenHoursDuration = (this.workingHoursStart + ((24 * 60) - this.workingHoursEnd)) * 60;

				// Block duration is less than the hours that are hidden
				if(blockDuration <= hiddenHoursDuration){
					// Convert start and end minutes to seconds since start day
					var workStart= this.workingHoursStart * 60;
					var workEnd = this.workingHoursEnd * 60;

					// Convert the blockStart and blockEnd to seconds since start day
					var blockStartDate = new Date(blockStart*1000);
					var blockEndDate   = new Date(blockEnd*1000);
					var blockStartSecs = (blockStartDate.getHours()*60*60) +
					        (blockStartDate.getMinutes()*60) + (blockStartDate.getSeconds());
					var blockEndSecs = (blockEndDate.getHours()*60*60) +
					        (blockEndDate.getMinutes()*60) + (blockEndDate.getSeconds());

					// Check to see whether the start or end part of the block will show itself
					var startBlockShown = (blockStartSecs >= workStart && blockStartSecs < workEnd);
					var endBlockShown = (blockEndSecs > workStart && blockEndSecs <= workEnd);

					if(startBlockShown || endBlockShown){
						return true;
					}

				// Block duration is higher than the hours that are hidden
				}else{
					return true;
				}
			// No hours are hidden, so all blocks within the period duration are shown
			}else{
				return true;
			}
		}
		return false;
	},

	/**
	 * Get the pixel offset from the start of the day of the timestamp.
	 * The argument inclusive is used to determine when the supplied timestamp matches the start of
	 * the day whether the timestamp belongs to the that day or to the previous day. When dealing
	 * with a start date you have to set inclusive to true and when dealing with an end date you
	 * have to set it to false. By default inclusive is set to true.
	 * @param {Number} timestamp Timestamp
	 * @param {Boolean} inclusive Is used to determine if timestamp which is set to 0:00, is set to
	 * the start of the next day (true) or at the end of the day before (false).
	 * day or the day before.
	 * @return {Number} Pixel Offset since start of the timeline
	 * @private
	 */
	findBlockPixelOffset: function(timestamp, inclusive){
		// Get the index of the day the timestamp falls on
		var dayIndex = this.findDayIndexByTimestamp(timestamp, inclusive);

		/*
		 * If there is a difference of time between timestamp and day pointed by dayIndex then probably
		 * timestamp is lying on next day, this thing occurs for 'showing working hours only' setup.
		 * 
		 * if we are showing working hours only then appointments on saturday will have dayindex of
		 * friday so we need to set it's offset to end of the day so directlly settings it's offset
		 * to most end of the day.
		 */
		if(timestamp - this.daysMap[dayIndex].timestamp >= 86400) {
			return this.daysMap[dayIndex].leftPos + this.dayWidth;
		}

		/* Extract the hour and minutes from the timestamp. We need this to prevent DST issues when
		 * there is a DST change during a day. If that happens the number of seconds since the start
		 * of a day is no longer correct.
		 */
		var timestampDate = new Date(timestamp*1000);
		var DSTSafeHours = timestampDate.getHours();
		var DSTSafeMinutes = timestampDate.getMinutes();

		var startDayPixelOffset;
		/* If we have a timestamp that starts at 0:00 we need to determine whether this is at the start of
		 * a day or at the end of a day. We can determine this based on the inclusive argument. If the callee
		 * wants to have an inclusive pixel offset we should give the pixel offset of the start of the day.
		 * If it is not inclusive we have to give the pixel offset of the end of the day. This is not the
		 * same as there is a space between two days.
		 */
		if(DSTSafeHours === 0 && DSTSafeMinutes === 0 && !inclusive){
			// Set the pixel offset at the end of the current day
			startDayPixelOffset = this.dayWidth;
		}else{
			var secondsSinceStartOfDay = ( ( DSTSafeHours * 60 ) + DSTSafeMinutes ) * 60;
			startDayPixelOffset = this.findPixelOffsetStartOfDayBySecs(secondsSinceStartOfDay);
		}

		// Timestamp ends after last visible hour.
		if(startDayPixelOffset == -1){
			/* When the timestamp is after the last visible hour of that day then we should add the
			 * daySpacing to the pixel offset to make it start on the next day. When this is the
			 * last day on the timeline the daySpacing should not be added. Otherwise the timeline
			 * width would be stretched and the scroll width will get out-of-sync with the header.
			 */
			var lastDayOnTimeline = (dayIndex < this.daysMap.length-1);
			startDayPixelOffset = this.dayWidth + (lastDayOnTimeline ? this.daySpacing : 0);
		}

		// Adding the number of pixels from the start of the timeline till the start of the day to
		// the pixels since the start of the day till the timestamp.
		var pixelOffset = this.daysMap[dayIndex].leftPos + startDayPixelOffset;

		return pixelOffset;
	},

	/**
	 * Returns the number of pixels since the start of the day based on the number of seconds since
	 * the start of the day. It returns -1 if the number of seconds go beyond the last displayed
	 * hour. This can happen when only working hours are shown.
	 * @param {Number} secondsSinceStartDay Seconds since the start of the day
	 * @return {Number} Pixel Offset since start of the day
	 * @private
	 */
	findPixelOffsetStartOfDayBySecs: function(secondsSinceStartDay){
		var firstHourStartDayOffsetSecs = this.hoursEachDayMap[0].startDayOffset;
		var lastHourStartDayOffsetSecs = this.hoursEachDayMap[ this.hoursEachDayMap.length-1 ].startDayOffset;

		// Timestamp takes place after last visible hour
		if(lastHourStartDayOffsetSecs + this.slotDuration < secondsSinceStartDay){
			return -1;
		}

		// Timestamp takes place before or at the start of the first hour
		if(firstHourStartDayOffsetSecs >= secondsSinceStartDay){
			return 0;
		}

		var numVisibleSeconds = this.slotDuration * this.hoursEachDayMap.length;
		var secondsSinceFirstHour = secondsSinceStartDay - firstHourStartDayOffsetSecs;
		/**
		 * Use the secondsSinceFirstHour:numVisibleSeconds ratio to turn the number of seconds since
		 * the start of the first hour into the ammount of pixels since the start of the first hour.
		 */
		var pixelOffset = (secondsSinceFirstHour / numVisibleSeconds) * this.dayWidth;
		pixelOffset = Math.round(pixelOffset);
		return pixelOffset;

	},

	/**
	 * Get the dayIndex of the day in the daysMap table that the timestamp belongs to.
	 * The argument inclusive is used to determine when the supplied timestamp matches the start of
	 * the day whether the timestamp belongs to the that day or to the previous day. When dealing
	 * with a start date you have to set inclusive to true and when dealing with an end date you
	 * have to set it to false. By default inclusive is set to true.
	 * @param {Number} timestamp Timestamp
	 * @param {Boolean} inclusive Is used to determine if timestamp which is set to 0:00, is set to
	 * the start of the next day (true) or at the end of the day before (false).
	 * @return {Number} Index of the day as used in the this.daysMap.
	 * @private
	 */
	findDayIndexByTimestamp: function(timestamp, inclusive){
		if (!Ext.isDefined(inclusive)) {
			inclusive = true;
		}

		/**
		 * If date takes place before the start of te first day in the daysMap the selector will
		 * select from the first day in the daysMap.
		 */
		var dayIndex = 0;
		for (var i = 0; i < this.daysMap.length; i++){
			if (inclusive && this.daysMap[i].timestamp <= timestamp) {
				dayIndex = i;
			} else if (!inclusive && this.daysMap[i].timestamp < timestamp) {
				dayIndex = i;
			} else {
				break;
			}
		}

		return dayIndex;
	},

	/**
	 * Find the timestamp based on the supplied coordinate.
	 * @param {Number} coordX X coordinate
	 * @return {Number} Timestamp
	 * @private
	 */
	findTimestampByTimelineXCoord : function(coordX){
		var dayIndex = coordX / (this.dayWidth + this.daySpacing);
		var pixelsPastDayStart = (dayIndex % 1) * (this.dayWidth + this.daySpacing);

		// Calculate how far along the day the coordinate is (ratioDay)
		var ratioDay = pixelsPastDayStart / this.dayWidth;
		var timeSinceStartOfDay;
		if(ratioDay < 1){
			// Calculate the duration of the visible hours
			var durationVisHours = this.slotDuration * this.hoursEachDayMap.length;
			/**
			 * Calculate how many seconds past the start of the day is using the rationDay and the
			 * startDayOffset of the first hour.
			 */
			timeSinceStartOfDay = (ratioDay * durationVisHours) + this.hoursEachDayMap[0].startDayOffset;
		}else{
			// One slot duration past last shown hour slot
			timeSinceStartOfDay = this.hoursEachDayMap[ this.hoursEachDayMap.length-1 ].startDayOffset + this.slotDuration;
		}
		/* Use timestamp of the start of the day to make an date object that we can add the hour and
		 * minutes to. We devide the number of seconds since the start of the day to get the hour
		 * and minutes. This we will add to the Date object by using the setHours and setMinutes
		 * methods. This will prevent problems after Daylight Saving Time.
		 */
		var date = new Date( this.daysMap[ Math.floor(dayIndex) ].timestamp * 1000 );
		var hoursSinceStartOfDay = Math.floor(timeSinceStartOfDay/(60*60));
		var minutesSinceStartOfDay = Math.floor( (timeSinceStartOfDay%(60*60)) / 60 );
		/* NOTE: Using setHours/setMinutes will cause an issue right on the DST change. If you look
		 * at the Dutch DST change in March, the clock will move forward an hour at 02:00. Using
		 * these function it will switch 02:00 to 01:00 and 02:30 to 01:30. That might not be what
		 * the user expects, but it only happens during the DST change.
		 */
		date.setHours( hoursSinceStartOfDay );
		date.setMinutes( minutesSinceStartOfDay );
		return Math.floor( date.getTime()/1000 );
	},

	/**
	 * Binds the user store to the timeline.
	 * @param {Ext.data.Store} store Store
	 * @param {Boolean} initial Internally used to indicate that this is the first call after render.
	 * @private
	 */
	bindUserStore: function(store, initial){
		if(this.userStore){
			this.mun(this.userStore, {
				'datachanged': this.onUserRefresh,
				'add': this.onUserAdd,
				'remove': this.onUserRemove,
				'clear': this.onUserRefresh,
				scope: this
			});
		}

		this.userStore = Ext.StoreMgr.lookup(store);

		if(this.userStore){
			this.mon(this.userStore, {
				'datachanged': this.onUserRefresh,
				'add': this.onUserAdd,
				'remove': this.onUserRemove,
				'clear': this.onUserRefresh,
				scope: this
			});

			if(!initial){
				this.sizeTimelineBackground();
			}
		}
	},

	/**
	 * Called when the {@link Zarafa.common.freebusy.data.FreebusyModel model} fires the userstorechange event to indicate
	 * that another user store is set.
	 * @param {Ext.data.Store} store The new store
	 * @private
	 */
	onUserStoreChange: function(store)
	{
		this.bindUserStore(store);
		this.refresh();
		this.sizeTimelineBackground();
	},

	/**
	 * Called when the {@link Zarafa.common.freebusy.data.FreebusyModel model} fires the blockstorechange event to indicate
	 * that another block store is set.
	 * @param {Ext.data.Store} store The new store
	 * @private
	 */
	onBlockStoreChange : function(store)
	{
		this.bindBlockStore(store);
	},

	/**
	 * Called when the {@link Zarafa.common.freebusy.data.FreebusyModel model} fires the sumblockstorechange event to indicate
	 * that another sum block store is set.
	 * @private
	 */
	onSumBlockStoreChange : function(store)
	{
		this.bindSumBlockStore(store);
	},

	/**
	 * Fires when the visibility of the non-working hours has been changed
	 * @param {Boolean} hideNonWorkingHours True to hide the non-working hours
	 * @private
	 */
	onShowWorkingHoursChange : function(hideNonWorkingHours)
	{
		this.refreshTimeline();
	},

	/**
	 * Called when the userStore fires the datachanged or clear event. This TimelineView will sync
	 * the timeline background scrolling height with the user list based on the new amount of users
	 * in the userStore.
	 * @private
	 */
	onUserRefresh: function(){
		this.refresh();
		this.sizeTimelineBackground();
	},

	/**
	 * Called when the userStore fires the add event. This TimelineView will sync the timeline
	 * background scrolling height with the user list based on the new amount of users in the
	 * userStore.
	 * @private
	 */
	onUserAdd: function(){
		this.sizeTimelineBackground();
	},

	/**
	 * Called when the userStore fires the remove event. This TimelineView will sync the timeline
	 * background scrolling height with the user list based on the new amount of users in the
	 * userStore.
	 * @param {Ext.data.Store} store Store
	 * @param {Ext.data.Record} userRecord Record of the user that is removed
	 * @param {Number} index Index of the user record in the store
	 * @private
	 */
	onUserRemove: function(store, userRecord, index){
		this.refresh();
		this.sizeTimelineBackground();
	}
});

Ext.reg('zarafa.freebusytimelineview', Zarafa.common.freebusy.ui.TimelineView);
