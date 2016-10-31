Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.ToolTip
 * @extends Ext.ToolTip
 *
 * This tooltip is shown when an appointment in the calendar (not the grid) is hovered.
 * Because we will only show one tooltip at a time, only one instance of this class will
 * be created by the {@link Zarafa.calendar.ui.CalendarMultiView calendar view} and that
 * instance will be used for all appointments.
 */
Zarafa.calendar.ui.ToolTip = Ext.extend(Ext.ToolTip, {
	/**
	 * @cfg {Zarafa.calendar.ui.CalendarMultiView} view The view for which
	 * this tooltip is used
	 */
	view : undefined,

	/**
	 * An id that identifies the appointment for which the
	 * tooltip is shown. (will be the entryid of the appointment)
	 *
	 * @property
	 * @type String
	 * @private
	 */
	appointmentId : undefined,

	/**
	 * A delayed task that is used to hide the tooltip with
	 * a delay.
	 *
	 * @property
	 * @type Ext.util.DelayedTask
	 * @private
	 */
	hideTask : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls: 'zarafa-appointment-tooltip',
			width: 250,
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
	 * @param {Object} config The properties used for creating the tooltop, this should at least contain
	 * either a 'title' or 'text' property.
	 * @param {Ext.EventObject} event The event object
	 */
	show : function(id, config, event)
	{
		// We only show a tooltip when we hover over an appointment, but since
		// the calender view is a canvas element the appointments aren't html elements
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

		var html = '';

		if ( !Ext.isEmpty(config.title) ){
			html += '<h2>' + config.title + '</h2>';
		}
		if ( !Ext.isEmpty(config.text) ){
			html += '<p>' + config.text.replace("\n", '<br>') + '</p>';
		}
		if ( !Ext.isEmpty(config.categories) ){
			html += Zarafa.common.categories.Util.getCategoriesHtml(config.categories);
		}

        this.body.dom.innerHTML = html;

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
	 * Hides the tooltip with the given delay or 500ms if none is given.
	 * @param {Number} delay The delay for hiding the tooltip in milliseconds.
	 */
	hide : function(delay)
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
	onAfterRender : function()
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