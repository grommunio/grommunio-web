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
Zarafa.widgets.folderwidgets.AppointmentsWidget = Ext.extend(Zarafa.widgets.folderwidgets.AbstractFolderWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		var store = new Zarafa.calendar.AppointmentStore();

		Ext.applyIf(config, {
			autoScroll: true,
			layout: 'fit',
			folderType: 'calendar',
			store: store,
			items: [{
				xtype: 'zarafa.gridpanel',
				cls: 'k-appointmentwidget',
				store: store,
				hideHeaders: true,
				loadMask: {
					msg: _('Loading appointments...')
				},
				sm: new Zarafa.common.ui.grid.RowSelectionModel({
					singleSelect: true
				}),
				viewConfig: {
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No appointments') + '</div>',
					forceFit: true,
					enableRowBody: true,
					rowSelectorDepth: 15,
					getRowClass: this.viewConfigGetRowClass,
					scope: this
				},
				colModel: new Ext.grid.ColumnModel({
					columns: [{
						header: _('Time'),
						dataIndex: 'startdate',
						renderer: this.timeRenderer,
						scope: this
					}]
				}),
				listeners: {
					'rowcontextmenu': this.onRowContextMenu,
					'rowdblclick': this.onRowDblClick,
					scope: this
				}
			}]
		});

		// Customize the configuration of the settings window
		this.configurationConfig = {
			height: 180
		};

		Zarafa.widgets.folderwidgets.AppointmentsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Adds a field to configure the number of days for which appointments will be shown
	 * @return {array} An array of configuration objects for {@link Ext.Component components}
	 */
	getConfigurationItems: function()
	{
		return [{
			xtype: 'zarafa.spinnerfield',
			fieldLabel: _('Number of days'),
			name: 'numdays',
			boxLabel: _('day(s)'),
			width: 60,
			minValue: 1, // 1 day
			maxValue: 365, // 1 year
			incrementValue: 1, // 1 day
			defaultValue: this.get('numdays') || 5,
			listeners: {
				'change': this.onNumDaysChange,
				scope: this
			},
			plugins: ['zarafa.numberspinner']
		}];
	},

	/**
	 * Event handler which is fired when 'Number of Days' field in the Configuration dialog
	 * has been changed. This will update the corresponding option in the settings.
	 * @param {Ext.form.Field} field The field which fired the event
	 * @param {Mixed} newValue The new value which was applied
	 * @param {Mixed} oldValue The old value which was applied
	 * @private
	 */
	onNumDaysChange: function (field, newValue, oldValue)
	{
		this.set(field.getName(), newValue);
		this.reloadStore();
	},

	/**
	 * Initialize the event handlers for the {@link #store} and {@link Zarafa.hierarchy.data.HierarchyStore Hierarchy}.
	 * @protected
	 */
	initEvents: function ()
	{
		Zarafa.widgets.folderwidgets.AppointmentsWidget.superclass.initEvents.apply(this, arguments);

		// Wait for the store to be loaded, so we can activate
		// the filter task.
		this.mon(this.store, 'load', this.startFilterTask, this, {single: true});
	},

	/**
	* Starts a filter task for the store. Will make sure that the filter is updated at
	* every 30 seconds so old appointments will be filtered out.
	* @private
	*/
	startFilterTask: function ()
	{
		Ext.TaskMgr.start({
			run: this.updateFilter,
			interval: 30000,
			scope: this
		});
	},

	/**
	 * This will {@link Ext.data.Store#load load} the {@link #store} using
	 * a restriction which only allows todays appointments.
	 * @private
	 */
	reloadStore: function ()
	{
		if (!this.folder) {
			return;
		}

		var numDays = this.get('numdays') || 5;

		var startdate = new Date().clearTime().getTime() / 1000;
		var duedate = new Date().clearTime().add(Date.DAY, numDays).getTime() / 1000;

		this.store.load({
			folder: this.folder,
			params: {
				restriction: {
					startdate: startdate,
					duedate: duedate
				}
			}
		});
	},

	/**
	 * Update the filter with the current time. Items that end
	 * before now are removed.
	 * @private
	 */
	updateFilter: function ()
	{
		var now = new Date().getTime() / 1000;
		this.store.filterBy(function (record) {
			var dueDate = record.get('duedate').getTime() / 1000;
			return !dueDate || dueDate >= now;
		}, this);
	},

	/**
	 * Renderer for the time column. Adds a recurrence icon and a private icon if applicable
	 *
	 * @param {Mixed} value The subject of the appointment
	 * @param {Object} metaData Used to set style information to gray out appointments that occur now
	 * @param {Ext.data.Record} record The record being displayed, used to retrieve the start and end times
	 * @private
	 */
	timeRenderer: function (value, metaData, record)
	{
		var recurringIcon = '';
		var recurringPattern = record.get('recurring_pattern');
		if (recurringPattern) {
			if (record.get('exception') === true) {
				recurringIcon =
					'&nbsp;<span ext:qwidth="300" ext:qtip="' + recurringPattern + '">' +
						'<img src="' + Zarafa.calendar.ui.IconCache.getExceptionIcon().src + '"/>' +
					'</span>';
			} else {
				recurringIcon =
					'&nbsp;<span ext:qwidth="300" ext:qtip="' + recurringPattern + '">' +
						'<img src="' + Zarafa.calendar.ui.IconCache.getRecurringIcon().src + '"/>' +
					'</span>';
			}
		}

		var privateIcon = '';
		if (record.get('private') === true) {
			privateIcon = '&nbsp;<img src="' + Zarafa.calendar.ui.IconCache.getPrivateIcon().src + '"/>';
		}

		var dayStart = new Date().clearTime();
		var dayEnd = new Date().add(Date.DAY, 1).clearTime();
		var start = value;
		var end = record.get('duedate');
		var allDayEvent = record.get('alldayevent');

		if ( start >= dayStart && end <= dayEnd ) {
			if ( !allDayEvent ) {
				return String.format(_('Today {0} - {1}'), start.format(_('G:i')), end.format(_('G:i'))) + recurringIcon + privateIcon;
			}

			return _('Today (all day)') + recurringIcon + privateIcon;
		}

		if ( !allDayEvent ) {
			return String.format(_('{0} - {1}'), start.format(_('d/m/y G:i')), end.format(_('d/m/y G:i'))) + recurringIcon + privateIcon;
		}

		return String.format(_('{0} - {1} (all day)'), start.format(_('d/m/y')), end.format(_('d/m/y'))) + recurringIcon + privateIcon;
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex index of row
	 * @param {Ext.EventObject} event event object of the event
	 * @private
	 */
	onRowContextMenu: function (grid, rowIndex, event)
	{
		// check row is already selected or not, if its not selected then select it first
		var selectionModel = grid.getSelectionModel();
		if (!selectionModel.isSelected(rowIndex)) {
			selectionModel.selectRow(rowIndex);
		}

		// The ContextMenu needs the ContextModel for cases where we want to reply the mail.
		var model;
		if (this.folder) {
			var context = container.getContextByFolder(this.folder);
			if (context) {
				model = context.getModel();
				Zarafa.core.data.UIFactory.openDefaultContextMenu(selectionModel.getSelections(), {
					position: event.getXY(),
					model: model
				});
			}
		}
	},

	/**
	 * Called when the user double-clicks on an appointment.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The row which was double clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onRowDblClick: function (grid, rowIndex, event)
	{
		var record = grid.getSelectionModel().getSelected();
		if (!Ext.isEmpty(record)) {
			// FIXME what about recurring series records ?
			if (record.isRecurringOccurence()) {
				record = record.convertToOccurenceRecord();
			}
		}
		Zarafa.core.data.UIFactory.openViewRecord(record);
	}
});

Zarafa.onReady(function () {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'appointments',
		displayName : _('Upcoming Appointments'),
		widgetConstructor : Zarafa.widgets.folderwidgets.AppointmentsWidget
	}));
});
