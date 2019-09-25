Ext.namespace('Zarafa.widgets.folderwidgets');

/**
 * @class Zarafa.widgets.folderwidgets.AppointmentsWidget
 * @extends Zarafa.widgets.folderwidgets.AbstractFolderWidget
 *
 * Widget that displays the appointments for today, from the default
 * calendar.  It only displays appointments that occur on or after the
 * current time, so outdated information is never shown.
 *
 * Reload time is configurable per instance of the
 * widget (keys: 'reloadinterval', default 5 minutes).  These values are in
 * saved in miliseconds but displayed in seconds. The reload
 * interval is how often the calendar is fully reloaded from the
 * server, to show records that were added to the folder
 * outside of WebApp.
 */
Zarafa.widgets.folderwidgets.DatepickerWidget = Ext.extend(Zarafa.widgets.folderwidgets.AbstractFolderWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		var store = new Zarafa.calendar.AppointmentStore();

		Ext.applyIf(config, {
			autoScroll: false,
			autoHeight: true,
			layout: 'hbox',
			folderType: 'calendar',
			store: store,
			items: [{
				xtype: 'zarafa.datepicker',
				ref: 'datePicker',
				hideLabel: true,
				showWeekNumber: true,
				showToday: true,
				width: '100%',
				listeners: {
					scope: this
				},
				handler: this.datePickerHandler
			}]
		});


		Zarafa.widgets.folderwidgets.DatepickerWidget.superclass.constructor.call(this, config);

		// FIXME Workaround for KW-1812 (not rendering busy days bold when coming back to current month)
		Ext.TaskMgr.start({
			run: this.updateFilter,
			interval: 2000, // every 2 seconds
			scope: this
		});
	},

	/**
	 * FIXME React on clicks: switch to calendar-view + selected date
	 * Event handler which is triggered when user clicks on any date
	 * @param {DatePicker} DatePicker object
	 * @param {Date} Date that was clicker
	 * @private
	 */
	datePickerHandler: Ext.emptyFn,

	/**
	 * Update the DatePicker when the calender is changed
	 * @private
	 */
	updateFilter: function ()
	{
		if (this.datePicker) {
			this.datePicker.show();
		}

		return Zarafa.widgets.folderwidgets.DatepickerWidget.superclass.updateFilter.apply(this, arguments);
	}
});

Zarafa.onReady(function () {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name: 'datepicker',
		displayName: _('Datepicker'),
		widgetConstructor: Zarafa.widgets.folderwidgets.DatepickerWidget
	}));
});
