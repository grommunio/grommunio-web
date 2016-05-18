Ext.namespace('Zarafa.common.freebusy.data');

/**
 * @class Zarafa.common.freebusy.data.TimelineSelector
 * @extends Ext.util.Observable
 */
Zarafa.common.freebusy.data.TimelineSelector = Ext.extend(Ext.util.Observable, 
{
	// Private
	// Properties used to identify the mouse position.
	MOUSE_ON_EDGE_LEFT: 1,
	MOUSE_ON_CENTER: 2,
	MOUSE_ON_EDGE_RIGHT: 3,

	// Private
	// When set to true the user is in the middle of a selection.
	selecting: false,
	// Private
	// Timestamp of the start of the selection (not necessarily the start date).
	selectionStart: null,
	// Private
	// Timestamp of the end of the selection (necessarily the end date).
	selectionEnd: null,
	// Private
	// DateRange used by the TimelineSelector
	selectorRange: null,

	/**
	 * @cfg {Number} dragSelectionEdgeArea
	 * The number of pixels from the edge the cursor snaps to the edge of the selection and drags 
	 * either the start date or end date. If the cursor is further away from the either egdge than 
	 * the supplied number than the a click will create a whole new selection (defaults to 10).
	 */
	dragSelectionEdgeArea: 10,

	/**
	 * @constructor
	 * @param {Object} config The configuration options.
	 */
	constructor: function(config)
	{
		Ext.apply(this, config || {});
		Zarafa.common.freebusy.data.TimelineSelector.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the selector
	 * @param {Zarafa.common.freebusy.ui.TimelineView} parent Object of the parent TimelineView
	 */
	init: function(parent){
		this.parent = parent;

		this.masterTpl = new Ext.XTemplate(
			'<div class="x-freebusy-selector">',
			'</div>',
			{
				// Format functions like capitalize in the Ext.util.Format are not 
				// used in this template anyways. Speeds up the apply time.
				disableFormats: true
			}
		);

		/**
		 * We can only render the selector when the TimelineView has been rendered. The TimelineView
		 * can also rerender the timeline to show/hide the non-working hours. In that case the 
		 * render event is not called, but the rendertimeline event is always called when rendering
		 * the timeline HTML. 
		 */
		this.parent.on("rendertimeline", this.onParentRenderTimeline, this);
		this.parent.on("timelinemousedown", this.onParentTimelineMouseDown, this);
		this.parent.on("timelinemousemove", this.onParentTimelineMouseMove, this);
		this.parent.on("timelinemouseup", this.onParentTimelineMouseUp, this);

		this.bindSelectorRange(this.parent.model.getSelectorRange(), true);
	},

	/**
	 * Registers update event to trigger visualizing changes in TimelineSelector
	 * @param {Zarafa.core.DateRange} selectorRange selectorRange
	 * @param {Boolean} initial Internally used to indicate that this is the first call after render.
	 */
	 bindSelectorRange: function(selectorRange, initial)
	{
		if(this.selectorRange && !initial){
			this.selectorRange.un('update', this.onSelectorRangeUpdate, this);
		}
		this.selectorRange = selectorRange;
		if(this.selectorRange){
			this.selectorRange.on({
				scope: this,
				// Listening in to updates in the selector daterange.
				update: this.onSelectorRangeUpdate
			});
		}
	},

	/**
	 * Renders the HTML needed for the selector and positions it. The parent is accessed to get the 
	 * HTML Element to render the selector in.
	 */
	render: function(){
		// The parent contains a container to render the selector in
		var parentSelectorContainer = this.parent.getSelectorContainer();

		// Render the HTML Elements
		this.masterTpl.overwrite(parentSelectorContainer);
		this.selectorElem = Ext.get(parentSelectorContainer.dom.firstChild);
		this.selectorElem.setVisibilityMode(Ext.Element.DISPLAY);

		this.selectorElem.on('mousemove', this.onMouseMoveSelector, this);

		// Position the selector by using the selector daterange
		this.positionSelector(this.selectorRange);
	},

	/**
	 * @todo Perhaps this function does not need that argument any more?
	 * Position the selector on the start and end dates. When the selector indicates a daterange 
	 * that is not visible on the timeline, the selector will be hidden.
	 * @param {Zarafa.core.DateRange} selectorRange Daterange for the new position of the selector.
	 */
	positionSelector: function(selectorRange){
		// Check whether the selector has to be shown inside the daterange of the timeline
		if(this.parent.model.getDateRange().overlaps(selectorRange)){
			// Transform start/end date into timestamps
			var start = selectorRange.getStartDate().getTime()/1000;
			var end = selectorRange.getDueDate().getTime()/1000;

			// Get the leftoffset of the start of the selector
			var pixelOffsetLeft = this.parent.findBlockPixelOffset(start, true);
			this.selectorElem.setLeft(pixelOffsetLeft);

			// Get the leftoffset of the end of the selector
			var pixelOffset = this.parent.findBlockPixelOffset(end, false);
			this.selectorElem.setWidth( pixelOffset - pixelOffsetLeft );
			this.selectorElem.setVisible(true);
		}else{
			// Hide the element when it is outside the visible period
			this.selectorElem.setVisible(false);
		}
	},

	/**
	 * Scrolls the timelineView to the date that is selected in the selectorRange.
	 */
	scrollTimelineToSelection: function(){
		this.parent.scrollDateIntoView( this.selectorRange );
	},

	/**
	 * Fired when the selector daterange is modified. When the daterange is changed the selector 
	 * needs to update UI component to visualize the change.
	 * @param {Zarafa.core.DateRange} selectorRange Changed daterange.
	 */
	onSelectorRangeUpdate: function(daterange){
		this.positionSelector(daterange);

		if(!this.selecting){
			this.scrollTimelineToSelection();
		}
	},

	/**
	 * Fired when the parent TimelineView renders the timeline. When the TimelineView renders the UI
	 * the selector needs to render the UI part.
	 * @param {Zarafa.common.freebusy.ui.TimelineView} timelineView TimelineView
	 */
	onParentRenderTimeline: function(timelineView){
		this.render();
	},

	/**
	 * Fired when the parent TimelineView detects a mousedown event.
	 * @param {Ext.EventObject} evt The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} target The target of the event.
	 * @param {Object} cfg The options configuration passed to the {@link #addListener} call.
	 */
	onParentTimelineMouseDown: function(evt, target, cfg){
		// Check to see if the mouse event is not done on the scrollbar
		if(this.isMouseEventOnScrollbar(evt, target)) {
			return true;
		}

		this.selecting = true;

		//Normalize the coordinate to the correct coordinate for the timeline and not the page
		var timelineElem = this.parent.bodyElem;
		var timestampCoordX = evt.getPageX() - timelineElem.getLeft() + timelineElem.getScroll().left;

		// Get the position of the mouse to determine wether it is on the outer edges or in the center.
		var mousePos = this.getMousePosition(evt.getPageX());

		// Transform X coordinate into a timestamp by using the TimelineView's methods.
		var selectionClick = this.parent.findTimestampByTimelineXCoord(timestampCoordX);

		var startDate, endDate;
		switch(mousePos){
			case this.MOUSE_ON_EDGE_LEFT:
				// Leave the end date as the start point for the selection
				endDate = this.selectorRange.getDueDate();
				this.selectionStart = endDate.getTime()/1000;
				break;
			case this.MOUSE_ON_EDGE_RIGHT:
				// Leave the start date as the start point for the selection
				startDate = this.selectorRange.getStartDate();
				this.selectionStart = startDate.getTime()/1000;
				break;
			default:
				// Snap the timestamp for the start to a half hour slot
				startDate = new Date(selectionClick*1000);
				startDate.round(Date.MINUTE, 30);
				this.selectionStart = startDate.getTime() / 1000;
				// Make the appointment duration 30 minutes by default
				endDate = startDate.add(Date.MINUTE, 30);
				this.selectorRange.set(startDate, endDate);
		}
		evt.preventDefault();
	},

	/**
	 * Fired when the parent TimelineView detects a mousemove event.
	 * @param {Ext.EventObject} evt The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} target The target of the event.
	 * @param {Object} cfg The options configuration passed to the {@link #addListener} call.
	 */
	onParentTimelineMouseMove: function(evt, target, cfg){
		if(this.selecting){
			//Normalize the coordinate to the correct coordinate for the timeline and not the page
			var timelineElem = this.parent.bodyElem;
			var timestampCoordX = evt.getPageX() - timelineElem.getLeft() + timelineElem.getScroll().left;

			this.selectionEnd = this.parent.findTimestampByTimelineXCoord(timestampCoordX);

			// Snap the timestamp to a half hour slot
			var endDate = new Date(this.selectionEnd*1000);
			endDate.round(Date.MINUTE, 30);
			this.selectionEnd = endDate.getTime() / 1000;

			// Check if the range does not have a duration of zero 
			if(this.selectionStart !== this.selectionEnd){
				var selectorStartDate, selectorEndDate;

				// Check if the start date is before the end date and swap if needed
				if(this.selectionStart <= this.selectionEnd){
					selectorStartDate = new Date(this.selectionStart*1000);
					selectorEndDate = endDate;
				}else{
					selectorStartDate = endDate;
					selectorEndDate = new Date(this.selectionStart*1000);
				}

				// Check if the start date or end date have been changed
				var startDateChanged = (this.selectorRange.getStartDate().getTime() !== selectorStartDate.getTime());
				var dueDateChanged = (this.selectorRange.getDueDate().getTime() !== selectorEndDate.getTime());
				if(startDateChanged || dueDateChanged){
					this.selectorRange.set(selectorStartDate, selectorEndDate);
				}
			}

			evt.preventDefault();
		}
	},

	/**
	 * Fired when the parent TimelineView detects a mouseup event.
	 * @param {Ext.EventObject} evt The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} target The target of the event.
	 * @param {Object} cfg The options configuration passed to the {@link #addListener} call.
	 */
	onParentTimelineMouseUp: function(evt, target, cfg){
		if(this.selecting){
			this.selecting = false;
			evt.preventDefault();
		}
	},

	onMouseMoveSelector: function(evt, target, cfg)
	{
		if(!this.selecting){
			var mousePos = this.getMousePosition(evt.getPageX());
			switch(mousePos){
				case this.MOUSE_ON_EDGE_LEFT:
				case this.MOUSE_ON_EDGE_RIGHT:
					this.selectorElem.setStyle('cursor', 'w-resize');
					break;
				default:
					this.selectorElem.setStyle('cursor', '');
			}
		}
	},

	getMousePosition: function(clickX)
	{
		var selectorX = this.selectorElem.getXY()[0];
		var rightSelectorY = selectorX + this.selectorElem.getWidth();

		if(Math.abs(clickX - selectorX) < this.dragSelectionEdgeArea){
			return this.MOUSE_ON_EDGE_LEFT;
		}else if(Math.abs(rightSelectorY - clickX) < this.dragSelectionEdgeArea){
			return this.MOUSE_ON_EDGE_RIGHT;
		}else{
			return this.MOUSE_ON_EDGE_CENTER;
		}
	},

	/**
	 * Checks whether the mouse event takes place on a scrollbar or whether it takes place inside 
	 * the element. Returns true if it takes plae on the scrollbar.
	 * @param {Ext.EventObject} evt The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} target The target of the event.
	 * @return {Boolean} When mouse clicked on scrollbar returns true, otherwise false.
	 * @private
	 */
	isMouseEventOnScrollbar: function(evt, target){
		// Get the bodyElem of the TimelineView because this is the element that contains the scrollbars
		var scrollContainer = this.parent.bodyElem.dom;
		// Prevent the selector from making a selection when you are only dragging the scrollbar.
		if(evt && evt.browserEvent && scrollContainer){ 
			var topleft = Ext.get(scrollContainer).getXY(); 
			if(evt.browserEvent.clientX-topleft[0] > scrollContainer.clientWidth || evt.browserEvent.clientY-topleft[1] > scrollContainer.clientHeight) { 
				// Clicking outside viewable area -> must be a click in the scrollbar, allow default action. 
				return true; 
			} 
		} 
		return false;
	}
});
