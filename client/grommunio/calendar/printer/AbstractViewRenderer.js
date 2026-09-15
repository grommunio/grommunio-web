// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Grommunio.calendar.printer');

/**
 * @class Grommunio.calendar.printer.AbstractViewRenderer
 * @extends Grommunio.common.printer.renderers.BaseRenderer
 *
 * An abstract class which is used by the {@link Grommunio.calendar.printer.DaysViewRenderer DaysViewRenderer} and
 * {@link Grommunio.calendar.printer.MonthViewRenderer MonthViewRenderer} to render the layout for the print appointment.
 */
Grommunio.calendar.printer.AbstractViewRenderer = Ext.extend(Grommunio.common.printer.renderers.BaseRenderer, {
	/**
	 * @property customStylesheetPath
	 * @type Array of Strings
	 * The paths at which the print stylesheets can be found for a specific renderer
	 */
	customStylesheetPath: 'client/resources/css/external/print.calendar.css',

	/**
	 * @cfg {String} timeStyle The style attribute which must be applied to  the
	 * &lt;td&gt; element containing the timestamp for the appointment
	 */
	timeStyle: '',

	/**
	 * Add additional rendering into the newly created dom tree containing the processed template
	 *
	 * @param {Document} printDOM DOM containing processed print template
	 * @param {Grommunio.calendar.CalendarContextModel} context calendar context to render for printing
	 */
	postRender: function(printDOM, context)
	{
		var model = context.getModel();
		if(model.getCurrentDataMode() === Grommunio.calendar.data.DataModes.MONTH) {
			var daterange = model.getActiveDateRange();
			var left = daterange.getStartDate().clone();
			var right = daterange.getDueDate().clone();
		} else {
			var daterange = model.dateRange;
			var left = daterange.getStartDate().clone();
			var right = daterange.getDueDate().clone();

			right.setMonth(right.getMonth()+1);
		}

		/*
		 * Create the left and right date picker
		 */
		new Grommunio.calendar.ui.DatePicker({
			renderTo: printDOM.getElementById('datepicker_left'),
			value: left,
			showToday: false
		});

		new Grommunio.calendar.ui.DatePicker({
			renderTo: printDOM.getElementById('datepicker_right'),
			value: right,
			showToday: false
		});
	}
});
