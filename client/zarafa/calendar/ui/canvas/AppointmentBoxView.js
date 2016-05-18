Ext.namespace('Zarafa.calendar.ui.canvas');

/**
 * @class Zarafa.calendar.ui.canvas.AppointmentBoxView
 * @extends Zarafa.calendar.ui.canvas.AppointmentView
 *
 * Appointment view used in {@link Zarafa.calendar.ui.AbstractCalendarBoxView CalendarBoxView}. It represents each appointment as one
 * or more horizontal rectangles on one or more week rows.
 * <p>
 * The view tries to minimise the number of required HTML elements by using background images to represent the busy status
 * strips on the left side of appointments. The background of each view is implemented using a scaled IMG tag.
 */
Zarafa.calendar.ui.canvas.AppointmentBoxView = Ext.extend(Zarafa.calendar.ui.canvas.AppointmentView, {
	/**
	 * Array of objects containing the {@link Zarafa.calendar.data.AppointmentBounds bounds} for the
	 * {@link #body} elements which are part of the appointment. This field is initialized in
	 * {@link #layoutInBody} using the function
	 * {@link Zarafa.calendar.ui.AbstractCalendarBoxView#dateRangeToBodyBounds dateRangeToBodyBounds}.
	 * @property
	 * @type Array
	 */
	bounds : undefined,

	/**
	 * {@cfg {Number} appointmentRadius The radius which must be applied to the appointment body
	 * to generate a nicely rounded rectangular.
	 */
//	appointmentRadius : 5,

	/**
	 * @cfg {Number} leftPadding Left padding in pixels of the appointment text within the appointment body
	 */
//	leftPadding : 4,

	/**
	 * @cfg {Number} lineHeight The textheight for the text which will be rendered
	 */
//	lineHeight : 13,

	/**
	 * The main text which will be rendered into the body of the appointment. This field
	 * is initialized using the {@link #mainTextRenderer}.
	 * @property
	 * @type String
	 */
	mainRenderedText : '',

	/**
	 * The subtext which will be rendered alongside the {@link #mainRenderedText}. This field
	 * is initialized using the {@link #subTextRenderer}.
	 * @property
	 * @type String
	 */
	subRenderedText : '',

	/**
	 * This will mark the appointment as selected, and will draw the
	 * Selection Outline on the 3rd layer of the canvas {@link Zarafa.calendar.ui.canvas.CalendarBoxView calendar}.
	 * @param {Boolean} selected True iff the appointment should be marked as selected.
	 * @override
	 */
	setSelected : function(selected)
	{
		Zarafa.calendar.ui.canvas.AppointmentBoxView.superclass.setSelected.call(this, selected);

		if (selected && !Ext.isEmpty(this.bounds)) {
			this.drawBodySelectionOutline(this.bounds);

			// when selecting appointment set focus also so key shortcuts work properly
			this.focus();
		}
	},

	/**
	 * Tests whether a mouse event is over the body start (left) resize handle.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the resize handle.
	 * @override
	 */
	eventOverBodyStartHandle : function(event)
	{
		if (this.isHeaderRange() || !this.bounds || this.bounds.length === 0) {
			return false;
		}

		var position = this.getEventBodyPosition(event);
		var bounds = this.bounds[0];
		var element = {
			left	: bounds.left,
			right	: (bounds.left + this.dragHandleWidth),
			top		: bounds.top,
			bottom	: bounds.bottom
		};

		return this.isEventOverElement(position, element);
	},

	/**
	 * Tests whether a mouse event is over the body due (right) resize handle.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the resize handle.
	 * @override
	 */
	eventOverBodyDueHandle : function(event)
	{
		if (this.isHeaderRange() || !this.bounds || this.bounds.length === 0) {
			return false;
		}

		var position = this.getEventBodyPosition(event);
		var bounds = this.bounds[this.bounds.length - 1];
		var element = {
			left	: (bounds.right - this.dragHandleWidth),
			right	: bounds.right,
			top		: bounds.top,
			bottom	: bounds.bottom
		};

		return this.isEventOverElement(position, element);
	},

	/**
	 * Tests whether a mouse event is over the appointment when laid out in the calendar body.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the appointment.
	 * @override
	 */
	eventOverBody : function(event)
	{
		if (this.isHeaderRange() || !this.bounds || this.bounds.length === 0) {
			return false;
		}

		var position = this.getEventBodyPosition(event);

		for (var i = 0, len = this.bounds.length; i < len; i++) {
			if (this.isEventOverElement(position, this.bounds[i])) {
				return true;
			}
		}

		return false;
	},

	/**
	 * Lays out the header elements of the view.
	 * NOTE: this function does nothing as the boxView does not render
	 * any headers for an appointment.
	 * @override
	 * @private
	 */
	layoutInHeader : Ext.emptyFn,

	/**
	 * Creates elements to represent the range when shown in the header.
	 * NOTE: this function does nothing as the boxView does not render
	 * any headers for an appointment.
	 * @private
	 * @override
	 */
	createHeader : Ext.emptyFn,

	/**
	 * Destroys the header elements.
	 * NOTE: this function does nothing as the boxView does not render
	 * any headers for an appointment.
	 * @private
	 * @override
	 */
	destroyHeader : Ext.emptyFn,

	/**
	 * Draws the selection outline for the appointment inside the Calendar header.
	 * This is shown when the appointment is {@link #selected}.
	 * The draghandles are rendered using {@link #drawDragHandle}.
	 * @param {Zarafa.calendar.data.AppointmentBounds} bounds The bounds object containing
	 * the location of this body.
	 * @private
	 */
	drawBodySelectionOutline : function(bounds)
	{
		var context = this.parentView.getBodySelectionCanvas().dom.getContext('2d');
		var borderWidth = 1;

		// Draw a border on each of the bounds which indicate that the
		// appointment is selected.
		context.save();
		context.lineWidth = borderWidth;
		context.strokeStyle = 'black';

		for (var i = 0, len = bounds.length; i < len; i++) {
			var bound = bounds[i];

			// Get the left-top position of the appointment.
			// When drawing the border, our position will be the center
			// of the border. Thus update the coordinates, to move them
			// to the correct center.
			var x = bound.left + (borderWidth / 2);
			var y = bound.top + (borderWidth / 2);

			// Determine the exact dimensions of the appointment
			// When drawing the border, our position will be the center
			// of the border. The coordinates will have been moved to reflect
			// this, thus we must update our dimensions as well.
			var width = bound.right - bound.left - borderWidth;
			var height = bound.bottom - bound.top - borderWidth;

			context.strokeRect(x, y, width, height);

			if (bound.firstBox) {
				// Draghandles must be positioned in the center of the appointment.
				y += Math.ceil(height / 2);

				// Draw the top dragHandle
				this.drawDragHandle(context, x, y);
			}

			if (bound.lastBox) {
				// Draghandles must be positioned in the center of the appointment.
				// If this is also the firstBox, then we have already repositioned
				// the x coordinate to the center.
				if (!bound.firstBox) {
					y += Math.ceil(height / 2);
				}

				this.drawDragHandle(context, x + width, y);
			}
		}
		context.restore();
	},

	/**
	 * Draws a single body element for the appointment body on the Canvas context.
	 * @param {CanvasRenderingContext2D} context The canvas object on which we are drawing.
	 * @param {Zarafa.calendar.data.AppointmentBounds} bound The bounds of this element.
	 * @param {Number} index the index of bound.
	 * @private
	 */
	drawBodyElement : function(context, bound, index)
	{
		var width = bound.right - bound.left;
		var height = bound.bottom - bound.top;

		context.save();
		context.translate(bound.left, bound.top);

		context.lineWidth = 1;

		// Draw a white background for transparent appointment
		context.fillStyle = 'white';
		context.fillRect(3, 3, width-6, height-6);

		var colorScheme = this.getAppointmentColorScheme();

		// Check if we have a light or dark color scheme
		var rgbBackgroundColor = this.calendarColorScheme.startcolorappointmentbox;
		var hslBackgroundColor = Zarafa.core.ColorSchemes.rgbToHsl(rgbBackgroundColor);
		var isDarkColor = hslBackgroundColor[2] < 0.5;
		
		var appointmentOpacity = 1;
		if ( !this.isActive() ) {
			appointmentOpacity = this.opacityNonActiveAppointment;
		}

		var stripWidth = this.getStripWidth();

		context.globalAlpha = appointmentOpacity;

		// Draw the appointment box
		context.fillStyle = colorScheme.startcolorappointment;
		context.fillRect(3 + stripWidth, 3, width-6-stripWidth, height-6);
		
		var busyStatus = this.getBusyStatus();
		switch (busyStatus)
		{
			case Zarafa.core.mapi.BusyStatus.FREE:
				context.fillStyle = 'white';
				context.fillRect(3, 3, stripWidth, height - 6);
				context.strokeStyle = this.calendarColorScheme.startcolorappointmentbox;
				context.strokeRect(3.5, 3.5, stripWidth, height -7);
				break;
			case Zarafa.core.mapi.BusyStatus.TENTATIVE:
				context.fillStyle = this.calendarColorScheme.startcolorappointmentbox;
				context.fillRect(3, 3, stripWidth, height - 6);
				// For tentative we use an image to only show parts of the background. This
				// image should not be transparent otherwise the color behind that will show
				// in the places where it should not be shown. So we reset the alpha for this.
				context.globalAlpha = 1;
				context.fillStyle = context.createPattern(Zarafa.calendar.ui.IconCache.getDashedImage(), 'repeat');
				context.fillRect(3, 3, stripWidth, height - 6);
				break;
			case Zarafa.core.mapi.BusyStatus.OUTOFOFFICE:
				context.fillStyle = '#912787';
				context.fillRect(3, 3, stripWidth, height - 6);
				break;
			default :
				// Draw the busystatus box in the same color as the appointment
				context.fillStyle = '#0f70bd';
				context.fillRect(3, 3, stripWidth, height - 6);
				break;
		}

		var x = stripWidth + this.parentView.headerBackgroundCanvasStylingElement.getPadding('l');

		context.globalAlpha = this.isActive() ? 1.0 : this.opacityNonActiveAppointment;

		// Get the font
		var font = this.parentView.headerBackgroundCanvasStylingElement.getStyle('font');
		// Check if we have a light or dark color
		// We use the startcolorappointment property because colorschemes of labeled appointments don't have the base property!
		isDarkColor = Zarafa.core.ColorSchemes.getLuma(colorScheme.startcolorappointment) < 155;
		var fontColor = this.isActive() && isDarkColor ? 'white' : 'black';

		// First start drawing all icons
		var icons = this.iconRenderer();
		for (var i = 0, len = icons.length; i < len; i++) {
			var img = Zarafa.calendar.ui.IconCache['get' + Ext.util.Format.capitalize(icons[i]) + 'Icon' + (fontColor==='white'?'Active':'')]();
			context.drawImage(img, x, Math.ceil((height - img.height) / 2));
			x += img.width + 5;
		}

		// Set a clip so we won't draw text outside the box
		context.beginPath();
		context.rect(3, 3, width-6, height-6);
		context.clip();

		var stop = Math.min(1, Math.max(0.1, (width - x) / width));
		var gradient = context.createLinearGradient(0, 0, width, 0);
		gradient.addColorStop(0, this.isActive() ? 'black' : '#666666');
		gradient.addColorStop(stop, this.isActive() ? 'black' : '#666666');
		gradient.addColorStop(1, 'rgba(0,0,0,0)');
		context.fillStyle = gradient;

		context.lineWidth = 1;

		context.setFont(font);
		context.fillStyle = fontColor;

		// create an object which is used to show text on appointment.
		var drawTextObject = {
			xPosition : x,
			yPosition : height - Math.ceil((height-parseInt(this.parentView.headerBackgroundCanvasStylingElement.getStyle('font-size')))/2) - 2,
			width : width,
			showStartTime : false,
			showEndTime : false
		};

		// it will check that appointment was all day event then don't show
		// start and end time.
		if(!this.isAllDay()) {
			drawTextObject.startTimeText = Ext.util.Format.htmlDecode(this.startTimeTextRenderer());
			drawTextObject.endTimeText = Ext.util.Format.htmlDecode(this.endTimeTextRenderer());

			// it will check that bounds length more then one it means 
			// appointment is lies in to multiple weeks.
			if(this.bounds.length > 1) {
				// we have to show the start time and appointment title to first bounds.
				if(index === 0) {
					drawTextObject.showStartTime = true;
				} else if ((this.bounds.length - 1) === index) {
					// we have to show the end time and appointment title but
					// we don't have to show start time because it is last bounds for the appointment.
					drawTextObject.showEndTime = true;
				}
			} else if(this.bounds.length === 1) {
				// if bounds length was one it means appointment does not
				// lies in to multiple weeks. but it may possible that appointment 
				// lies in to multiple days 

				// it will check that appointment is more then
				// one day event. then show the start/end time and appointment title with 
				// its sub text.
				if(this.getDateRange().getNumDays() > 0) {
					drawTextObject.showStartTime = true;
					drawTextObject.showEndTime = true;
				} else {
					// appointment was less then one day event 
					// so we have to just show the start time and appointment title.
					drawTextObject.showStartTime = true;
				}
			}
		}

		this.drawTextOnAppointment(context, drawTextObject);
		context.restore();
	},

	/**
	 * Function is responsible to draw start time , end time and
	 * appointment title. it will draw the text based on the given object.
	 * 
	 * @param {CanvasRenderingContext2D} context The canvas object on which we are drawing.
	 * @param {Object} Obj the Obj contains the configuration option which used to draw the text 
	 * on appointment
	 * @private
	 */
	drawTextOnAppointment : function(context, obj)
	{
		var titleText = this.mainRenderedText + ' '+ this.subRenderedText;
		var endTimeWidth = context.textWidth(obj.endTimeText);
		var startTimeWidth = context.textWidth(obj.startTimeText + ' ');
		var rightFlot = obj.width - (endTimeWidth + this.leftPadding + this.getStripWidth());

		var perTextSize, size;
		// draw the end time and appointment title.
		if(obj.showEndTime && !obj.showStartTime) {
			// draw end time at extreme right position of appointment.
			context.drawText(obj.endTimeText, rightFlot, obj.yPosition);

			// find the character size and based on that character size find the 
			// approximated characters are draw in remaining width.
			perTextSize = endTimeWidth / obj.endTimeText.length;
			size = Math.floor(rightFlot/perTextSize);
			titleText = Ext.util.Format.ellipsis(titleText, size, false);

		} else if(obj.showStartTime && !obj.showEndTime) {
			// draw the start time and update the x position on which appointment title was draw.
			context.drawText(obj.startTimeText, obj.xPosition, obj.yPosition);
			obj.xPosition += startTimeWidth;

		} else if(obj.showStartTime && obj.showEndTime) {
			// draw the start and end time on respective appointment.

			// draw end time at extreme right position of appointment.
			context.drawText(obj.endTimeText, rightFlot, obj.yPosition);

			// draw the start time at left most position of appointment.
			context.drawText(obj.startTimeText, obj.xPosition, obj.yPosition);
			obj.xPosition += startTimeWidth;

			// find remaining width to draw the appointment title.
			var remainingWidth = rightFlot - obj.xPosition;

			// find the character size and based on that character size find the 
			// approximated characters are draw in remaining width.
			perTextSize = startTimeWidth / obj.startTimeText.length;
			size = Math.floor(remainingWidth/perTextSize);

			// apply ellipsis if text is bigger then remaining width.
			titleText = Ext.util.Format.ellipsis(titleText, size, false);
		}

		context.drawText(titleText, obj.xPosition, obj.yPosition);
	},

	/**
	 * Draws the elements for the appointment body on the Canvas context.
	 * @param {Array} bounds array of {@link Zarafa.calendar.data.AppointmentBounds bounds} objects.
	 * @private
	 */
	drawBodyElements : function(bounds)
	{
		// Obtain the context object on which we
		// will be drawing our appointment.
		var context = this.parentView.getBodyAppointmentCanvas().dom.getContext('2d');

		// Draw all bounds onto the context
		for (var i = 0, len = bounds.length; i < len; i++) {
			this.drawBodyElement(context, bounds[i], i);
		}

		if (this.isSelected()) {
			this.drawBodySelectionOutline(bounds);
		}
	},

	/**
	 * Lays out the body of the view. This will generate the Body bounts using the
	 * function {@link Zarafa.calendar.ui.AbstractCalendarBoxView.dateRangeToBodyBounds dateRangeToBodyBounds},
	 * the bounds will be used for laying out the body elements using {@link #layoutBodyElements}.
	 * @private
	 * @override
	 */
	layoutInBody : function()
	{
		// get an array of bounds (left, right, top, bottom) objects to represent the range on the calendar body
		this.bounds = this.parentView.dateRangeToBodyBounds(this.getDateRange(), this.slot, undefined, false);

		// Draw the body elements to match the bounds
		if (!Ext.isEmpty(this.bounds)) {
			this.drawBodyElements(this.bounds);
		}
	},

	/**
	 * Body start time text renderer. This will return the start time in string which
	 * must be displayed most prominently in the appointment when it has been rendered in the main contents
	 * section of the calendar. This applies to non-all-day appointments and while calender was
	 * {@link Zarafa.calendar.data.DataModes#MONTH month view} mode.
	 * @return {String} The start time text of appointment.
	 * @private
	 */
	startTimeTextRenderer : function()
	{
		return Ext.util.Format.htmlEncode(this.record.get('startdate').format(this.timeFormat));
	},

	/**
	 * Body end time text renderer. This will return the start time in string which
	 * must be displayed most prominently in the appointment when it has been rendered in the main contents
	 * section of the calendar. This applies to non-all-day appointments and while calender was
	 * {@link Zarafa.calendar.data.DataModes#MONTH month view} mode.
	 * @return {String} The end time text of appointment.
	 * @private
	 */
	endTimeTextRenderer : function()
	{
		return Ext.util.Format.htmlEncode(this.record.get('duedate').format(this.timeFormat));
	},

	/**
	 * Lays out the view. This function is called after {@link #render} and is used
	 * to update the view to the latest situation. When an appointment, or setting
	 * has been changed, the {@link #layout} function must change the look to reflect
	 * the new changes.
	 * @protected
	 */
	onLayout : function()
	{
		// The text Renderers deliver everything in HTML encoded strings. We must
		// decode it here, as Canvas doesn't need encoded text
		this.mainRenderedText = Ext.util.Format.htmlDecode(this.mainTextRenderer());
		this.subRenderedText = Ext.util.Format.htmlDecode(this.subTextRenderer());

		Zarafa.calendar.ui.canvas.AppointmentBoxView.superclass.onLayout.call(this);
	}
});
