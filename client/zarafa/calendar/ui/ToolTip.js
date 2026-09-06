Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.ToolTip
 * @extends Ext.ToolTip
 *
 * This tooltip is shown when an appointment in the calendar (not the grid) is hovered.
 * Because we will only show one tooltip at a time, only one instance of this class will
 * be created by the {@link Zarafa.calendar.ui.CalendarMultiView calendar view} and that
 * instance will be used for all appointments.
 *
 * The tip is a card: the header carries the calendar colour with the subject and the
 * date, the body lists the details on the theme surface, so the text stays readable
 * whatever colour the calendar has.
 */
Zarafa.calendar.ui.ToolTip = Ext.extend(Ext.ToolTip, {
	/**
	 * @cfg {Zarafa.calendar.ui.CalendarMultiView} view The view for which
	 * this tooltip is used
	 */
	view: undefined,

	/**
	 * An id that identifies the appointment for which the
	 * tooltip is shown. (will be the entryid of the appointment)
	 *
	 * @property
	 * @type String
	 * @private
	 */
	appointmentId: undefined,

	/**
	 * A delayed task that is used to hide the tooltip with
	 * a delay.
	 *
	 * @property
	 * @type Ext.util.DelayedTask
	 * @private
	 */
	hideTask: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls: 'zarafa-appointment-tooltip',
			width: 322,
			target: Ext.get(document.body),
			autoHide: true, // Needed to not hide on click
			dismissDelay: 0,
			renderTo: Ext.getBody(),
			listeners: {
				afterrender: this.onAfterRender,
				scope: this
			}
		});

		Zarafa.calendar.ui.ToolTip.superclass.constructor.call(this, config);
	},

	/**
	 * Show the Tooltip, this will {@link Ext.Element#show show} the {@link #el tooltip}.
	 *
	 * @param {String} id The Object id referring to the Object on which we are showing the Tooltip
	 * @param {Object} config The properties used for creating the tooltip. Either a 'record'
	 * ({@link Zarafa.calendar.AppointmentRecord}) or a 'title' and/or 'text', and optionally
	 * the 'color' of the calendar the appointment belongs to.
	 * @param {Ext.EventObject} event The event object
	 */
	show: function(id, config, event)
	{
		// We only show a tooltip when we hover over an appointment, but since
		// the calendar view is a canvas element the appointments aren't html elements
		// and so we cannot use those as delegate elements. Hence the Ext will try to
		// show the tooltip for every mouse hover over the calendar view. When
		// The config is not set, we know this method was called by Ext and not by
		// our own code. We will not show the tooltip when Ext calls this method.
		if ( !Ext.isObject(config) ){
			return;
		}

		if ( Ext.isDefined(this.hideTask) ){
			this.hideTask.cancel();
		}

		// No need to rebuild and reposition the tooltip when it is already shown
		if ( id === this.appointmentId && this.isVisible() ){
			return;
		}

		this.appointmentId = id;
		this.body.dom.innerHTML = this.buildHtml(config);

		Zarafa.calendar.ui.ToolTip.superclass.show.call(this);

		// Reposition tooltip if needed
		var body = Ext.getBody();
		var bodyHeight = body.getHeight();
		var bodyWidth = body.getWidth();
		var tipHeight = this.getHeight();
		var tipWidth = this.getWidth();
		var position = this.getPosition();
		var newPosition = position.slice();

		if ( position[0] + tipWidth > bodyWidth ){
			newPosition[0] = bodyWidth - tipWidth;
		}
		if ( position[1] + tipHeight > bodyHeight ){
			newPosition[1] = bodyHeight - tipHeight;
		}
		this.setPosition(newPosition[0], newPosition[1]);
	},

	/**
	 * Build the markup of the card.
	 * @param {Object} config The config passed to {@link #show}
	 * @return {String} html
	 * @private
	 */
	buildHtml: function(config)
	{
		var color = Ext.isEmpty(config.color) ? undefined : config.color;
		// The header text follows the luminance of the calendar colour; without
		// a colour the header keeps the neutral tone of the theme.
		var tone = '';
		if ( color ) {
			tone = Zarafa.core.ColorSchemes.isDark(color) ? ' k-dark' : ' k-light';
		}
		var head = '';
		var body = '';

		if ( config.record ) {
			head = this.renderTitle(config.record) +
				'<div class="k-appt-tip-when">' + this.formatWhen(config.record) + '</div>';
			body = this.renderRows(config.record);
			if ( body ) {
				body = '<div class="k-appt-tip-body">' + body + '</div>';
			}
		} else {
			if ( !Ext.isEmpty(config.title) ){
				head = '<div class="k-appt-tip-title"><span>' + config.title + '</span></div>';
			}
			if ( !Ext.isEmpty(config.text) ){
				body += '<div class="k-appt-tip-text">' + config.text.replace(/\n/g, '<br>') + '</div>';
			}
			if ( !Ext.isEmpty(config.categories) ){
				body += '<div class="k-appt-tip-cats">' + Zarafa.common.categories.Util.getCategoriesHtml(config.categories) + '</div>';
			}
			if ( body ) {
				body = '<div class="k-appt-tip-body k-appt-tip-plain">' + body + '</div>';
			}
		}

		var style = color ? ' style="background-color:' + Ext.util.Format.htmlEncode(color) + '"' : '';

		return '<div class="k-appt-tip' + tone + '">' +
			'<div class="k-appt-tip-head"' + style + '>' + head + '</div>' +
			body +
		'</div>';
	},

	/**
	 * Render the subject with the icons the appointment shows in the calendar.
	 * @param {Zarafa.calendar.AppointmentRecord} record The appointment
	 * @return {String} html
	 * @private
	 */
	renderTitle: function(record)
	{
		var icons = [];
		if ( record.get('private') === true ) {
			icons.push('icon_private');
		}
		if ( record.get('importance') === Zarafa.core.mapi.Importance.URGENT ) {
			icons.push('icon_importance');
		}
		if ( Ext.isFunction(record.isRecurringOccurrence) && record.isRecurringOccurrence() ) {
			icons.push(record.isRecurringException() ? 'icon_exception' : 'icon_calendar_appt_recurring');
		}

		var html = '<div class="k-appt-tip-title">';
		if ( icons.length ) {
			html += '<span class="k-appt-tip-icons">';
			Ext.each(icons, function(icon) {
				html += '<span class="k-icon ' + icon + '" aria-hidden="true"></span>';
			});
			html += '</span>';
		}
		html += '<span>' + Ext.util.Format.htmlEncode(record.get('subject') || '') + '</span></div>';

		return html;
	},

	/**
	 * Format the date and time of the appointment.
	 * @param {Zarafa.calendar.AppointmentRecord} record The appointment
	 * @return {String} html
	 * @private
	 */
	formatWhen: function(record)
	{
		var start = record.get('startdate');
		var due = record.get('duedate');
		if ( !Ext.isDate(start) || !Ext.isDate(due) ) {
			return '';
		}

		// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
		var dateFormat = _('jS F Y');
		var separator = ' · ';

		if ( record.get('alldayevent') === true ) {
			// The due date of an all-day event is the midnight after its last day.
			var last = due.add(Date.HOUR, -1);
			var dates = start.format(dateFormat) + ' – ' + last.format(dateFormat);
			if ( Date.diff(Date.DAY, last, start) <= 1 ) {
				dates = this.formatDay(start, dateFormat);
			}

			return Ext.util.Format.htmlEncode(dates + separator + _('All Day'));
		}

		if ( start.clearTime(true).getTime() === due.clearTime(true).getTime() ) {
			return Ext.util.Format.htmlEncode(this.formatDay(start, dateFormat) + separator +
				start.formatDefaultTime() + ' – ' + due.formatDefaultTime());
		}

		return Ext.util.Format.htmlEncode(start.format(dateFormat) + ' ' + start.formatDefaultTime() +
			' – ' + due.format(dateFormat) + ' ' + due.formatDefaultTime());
	},

	/**
	 * Format a date with its weekday.
	 * @param {Date} date The date
	 * @param {String} dateFormat The translated date format
	 * @return {String} the formatted date
	 * @private
	 */
	formatDay: function(date, dateFormat)
	{
		// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
		return date.format(_('l')) + ', ' + date.format(dateFormat);
	},

	/**
	 * Render the detail rows of the appointment.
	 * @param {Zarafa.calendar.AppointmentRecord} record The appointment
	 * @return {String} html, empty when there is nothing to show
	 * @private
	 */
	renderRows: function(record)
	{
		var rows = '';
		var location = record.get('location');
		var online = record.get('onlinemeetingurl');

		if ( !Ext.isEmpty(location) ) {
			rows += this.renderRow(_('Location'), this.formatPlace(location));
		}
		if ( !Ext.isEmpty(online) && online !== location ) {
			rows += this.renderRow(_('Online meeting'), this.formatPlace(online));
		}

		if ( record.get('meeting') !== Zarafa.core.mapi.MeetingStatus.NONMEETING ) {
			var organizer = record.get('sent_representing_name') || record.get('sender_name');
			if ( !Ext.isEmpty(organizer) ) {
				rows += this.renderRow(_('Organizer'), Ext.util.Format.htmlEncode(organizer));
			}
			var attendees = this.formatPeople(record.get('display_to'), organizer);
			if ( attendees ) {
				rows += this.renderRow(_('Attendees'), attendees, 'k-clamp');
			}
			var optional = this.formatPeople(record.get('display_cc'));
			if ( optional ) {
				rows += this.renderRow(_('Optional attendees'), optional, 'k-clamp');
			}
		}

		if ( !Ext.isEmpty(record.get('recurring_pattern')) ) {
			rows += this.renderRow(_('Recurrence'), Ext.util.Format.htmlEncode(record.get('recurring_pattern')));
		}

		var busy = record.get('busystatus');
		if ( busy !== Zarafa.core.mapi.BusyStatus.BUSY ) {
			rows += this.renderRow(_('Show as'), '<span class="k-appt-tip-chip">' +
				Ext.util.Format.htmlEncode(Zarafa.core.mapi.BusyStatus.getDisplayName(busy)) + '</span>');
		}

		var categories = Zarafa.common.categories.Util.getCategories(record);
		if ( !Ext.isEmpty(categories) ) {
			rows += '<div class="k-appt-tip-cats">' + Zarafa.common.categories.Util.getCategoriesHtml(categories) + '</div>';
		}

		return rows;
	},

	/**
	 * Render one labelled row.
	 * @param {String} label The (translated) label
	 * @param {String} html The value, already encoded
	 * @param {String} cls Optional class for the value cell
	 * @return {String} html
	 * @private
	 */
	renderRow: function(label, html, cls)
	{
		return '<div class="k-appt-tip-row">' +
			'<span class="k-appt-tip-label">' + Ext.util.Format.htmlEncode(label) + '</span>' +
			'<span class="k-appt-tip-value' + (cls ? ' ' + cls : '') + '">' + html + '</span>' +
		'</div>';
	},

	/**
	 * Format a location. A web address becomes a link showing only the
	 * part after the scheme, on one line.
	 * @param {String} value The location
	 * @return {String} html
	 * @private
	 */
	formatPlace: function(value)
	{
		value = String(value).trim();
		if ( !/^https?:\/\/\S+$/i.test(value) ) {
			return Ext.util.Format.htmlEncode(value);
		}

		var url = Ext.util.Format.htmlEncode(value);
		return '<a class="k-appt-tip-link" href="' + url + '" title="' + url + '" target="_blank" rel="noopener noreferrer">' +
			Ext.util.Format.htmlEncode(value.replace(/^https?:\/\//i, '')) + '</a>';
	},

	/**
	 * Format a list of recipients as it is stored in display_to/display_cc.
	 * @param {String} value The names separated by semicolons
	 * @param {String} exclude Optional name to leave out (the organizer)
	 * @return {String} html, empty when nobody remains
	 * @private
	 */
	formatPeople: function(value, exclude)
	{
		if ( Ext.isEmpty(value) ) {
			return '';
		}

		var names = [];
		Ext.each(String(value).split(';'), function(name) {
			name = name.trim();
			if ( name && name !== exclude ) {
				names.push(name);
			}
		});

		return Ext.util.Format.htmlEncode(names.join(', '));
	},

	/**
	 * Hides the tooltip with the given delay or 500ms if none is given.
	 * @param {Number} delay The delay for hiding the tooltip in milliseconds.
	 */
	hide: function(delay)
	{
		if ( !Ext.isDefined(this.hideTask) ){
			this.hideTask = new Ext.util.DelayedTask(function(){
				Zarafa.calendar.ui.ToolTip.superclass.hide.call(this);
			}, this);
		}

		delay = Ext.isDefined(delay) ? delay : 500;
		this.hideTask.delay(delay);
	},

	/**
	 * Event handler for the afterender event of the tooltip. Will add a click
	 * handler to the tooltip's underlying element that will close the tooltip
	 * so users can click on the tooltip to close it if it gets in the way.
	 */
	onAfterRender: function()
	{
		this.el.on('mouseover', function(){
			if ( Ext.isDefined(this.hideTask) ){
				this.hideTask.cancel();
			}
		}, this);

		this.el.on('mouseout', function(){
			// Remove the appointmentOver property of all calendar views
			// That way the appointmentmouseover event will be triggered
			// again when we leave the tooltip and the mouse is still
			// hovering an appointment
			Ext.each(this.view.calendars, function(calendar){
				calendar.appointmentOver = null;
			}, this);
			this.hide();
		}, this);
	}
});
