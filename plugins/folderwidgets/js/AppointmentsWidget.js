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
			height: this.get('widgetheight') || 300,
			autoScroll: true,
			layout: 'fit',
			folderType: 'calendar',
			store: store,
			items: [{
				xtype: 'zarafa.gridpanel',
				store: store,
				hideHeaders: true,
				loadMask: {
					msg: _('Loading appointments') + '...'
				},
				sm: new Ext.grid.RowSelectionModel({
					singleSelect: true
				}),
				viewConfig: {
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No appointments for today.') + '</div>',
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
						renderer: this.dummyColumnRenderer
					}]
				}),
				listeners: {
					'rowcontextmenu': this.onRowContextMenu,
					'rowdblclick': this.onRowDblClick,
					scope: this
				}
			}]
		});

		Zarafa.widgets.folderwidgets.AppointmentsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * This will {@link Ext.data.Store#load load} the {@link #store} using
	 * a restriction which only allows todays appointments.
	 * @private
	 */
	reloadStore: function ()
	{
		if (this.folder) {
			var now = new Date();
			var today = now.clearTime();
			var dueDate = today.add(Date.DAY, 10);

			this.store.load({
				folder: this.folder,
				params: {
					restriction: {
						startdate: now.getTime() / 1000,
						// FIXME: Create Config-Option for duedate
						duedate: dueDate.getTime() / 1000,
						// FIXME: Create Config-Option for limit
						limit: 10
					}
				}
			});
		}
	},

	/**
	 * Update the filter with the current time.  Items that end
	 * before now are removed.
	 * @private
	 */
	updateFilter: function ()
	{
		this.store.filterBy(function (record) {
			var now = new Date();
			var startdate = record.get('startdate') || now;
			var duedate = record.get('duedate') || now;
			return (startdate >= now || duedate >= now) && startdate < now.clearTime().add(Date.DAY, 1);
		}, this);
	},

	/**
	 * Just needed to make sure the 'columns'-object renders a line with height=0px
	 *
	 * @param {Mixed} value The subject of the appointment
	 * @param {Object} metaData Used to set style information to gray out appointments that occur now
	 * @param {Ext.data.Record} record The record being displayed, used to retrieve the start and end times
	 * @private
	 */
	dummyColumnRenderer: function (value, metaData, record)
	{
		metaData.attr = "style='padding:0; margin:0; height:0px; '";
		return "";
	},

	/**
	 * Apply custom style and content for the row body. This will color
	 * a task in red when its due-date is reached. If categories are applied
	 * to an appointment these categories will be displayed in a colored square naming
	 * the first letter of the category and its full name in a tooltip.
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @param {Number} rowIndex The row index
	 * @param {Object} rowParams A config object that is passed to the row template during
	 * rendering that allows customization of various aspects of a grid row.
	 * If enableRowBody is configured true, then the following properties may be set by this function,
	 * and will be used to render a full-width expansion row below each grid row.
	 * @param {Ext.data.Store} store The Ext.data.Store this grid is bound to
	 * @return {String} a CSS class name to add to the row
	 * @private
	 */
	viewConfigGetRowClass: function (record, rowIndex, rowParams)
	{

		var iconToString = function (icon) {
			return '<img src="' + icon.src + '" /> ';
		};

		var value = '<table width="100%"><tbody>';

		/**
		 * this.startdateArray is used to simulate some "grouping" in the table
		 * as 'this' is not in the context of this class, the array has to be
		 * initialized here.
		 */
		if (!this.startdateArray) {
			this.startdateArray = new Array();
		}

		var recordDate = record.get("startdate");
		var todaysDate = new Date;

		this.startdateArray[rowIndex] = recordDate;

		if ((!this.startdateArray[rowIndex - 1]) || (this.startdateArray[rowIndex - 1].add(Date.DAY, 1).clearTime() <= recordDate)) {
			// the appointment before was on another day then this appointment

			value += '<tr><td><div class="folderwidget-groupedview">';

			if (recordDate <= todaysDate.add(Date.DAY, 1).clearTime()) {
				value += _("Today");
			} else if (recordDate < todaysDate.add(Date.DAY, 2).clearTime()) {
				value += _("Tomorrow");
			} else if (recordDate <= todaysDate.add(Date.DAY, 7).clearTime()) {
				value += recordDate.format('l');
			} else {
				value += recordDate.format(_("d.m.Y"));
			}

			value += '</div></td></tr>';
		}

		// Row to display time + recurrance + location
		value += '<tr><td>';

		if (record.get('alldayevent')) {
			value += _('All Day');
		} else {
			value += record.get("startdate").format(_("G:i")) + ' - ' + record.get("duedate").format(_("G:i"));
		}

		var recurringPattern = record.get('recurring_pattern');
		if (recurringPattern) {
			if (record.get('exception') === true) {
				value += ' <span title="' + recurringPattern + '">' + iconToString(Zarafa.calendar.ui.IconCache.getExceptionIcon()) + '</span>';
			} else {
				value += ' <span title="' + recurringPattern + '">' + iconToString(Zarafa.calendar.ui.IconCache.getRecurringIcon()) + '</span>';
			}
		}

		// Row to display categories + subject + private-flag
		value += '</td></tr><tr><td>';

		value += Zarafa.widgets.folderwidgets.AppointmentsWidget.superclass.renderCategories(record);

		value += record.get("subject");

		if (record.get('private') === true) {
			value += ' ' + iconToString(Zarafa.calendar.ui.IconCache.getPrivateIcon());
		}

		value += '</td></tr></tbody></table>';

		rowParams.body = value;

		return "x-grid3-row-expanded ";
	},

	/**
	 * Render the subject, which is the time span + the subject of
	 * the appointment.  The passed value is the subject of the
	 * appointment, the rest of the data is retrieved through record.
	 *
	 * @param {Mixed} value The subject of the appointment
	 * @param {Object} metaData Used to set style information to gray out appointments that occur now
	 * @param {Ext.data.Record} record The record being displayed, used to retrieve the start and end times
	 * @param {Number} rowIndex The index of the rendered row
	 * @param {Number} colIndex The index of the rendered column
	 * @param {Ext.data.Store} store The store to which the record belongs
	 * @private
	 */
	subjectRenderer : function(value, metaData, record, rowIndex, colIndex, store) {
			var now = new Date();
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			var starttime = (record.get('startdate') || now).format(_("G:i"));
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			var duetime = (record.get('duedate') || now).format(_("G:i"));
			if ((record.get('startdate') || now) < now) {
				metaData.attr = "style='color: #888; font-weight: bold;'";
			} else {
				metaData.attr = "style='font-weight: bold;'";
			}

			var icons = '';
			var iconToString = function(icon) { return '<img src="' + icon.src + '" /> '; };

			if (record.get('private') === true) {
				icons += iconToString(Zarafa.calendar.ui.IconCache.getPrivateIcon());
			}
			if (record.get('recurring') === true) {
				if (record.get('exception') === true) {
					icons += iconToString(Zarafa.calendar.ui.IconCache.getExceptionIcon());
				} else {
					icons += iconToString(Zarafa.calendar.ui.IconCache.getRecurringIcon());
				}
			}

			if (record.get('alldayevent')) {
				// # TRANSLATORS: {0} is the subject of an all-day
				// # appointment, {1} is the html code to display
				// # icons.
				return String.format(_("Today: {1} {0}"), Ext.util.Format.htmlEncode(value), icons);
			}

			return String.format("{1}-{2}: {3} {0}", Ext.util.Format.htmlEncode(value), starttime, duetime, icons);
	},

	/**
	 * Add additional information to the row, in this case the location of
	 * the meeting.
	 * TODO: add a preview of the body here.
	 * The location is rendered in its own table for future use.
	 *
	 * @param record The record being displayed.  If it has no
	 * location set, then the table is omitted entirely.
	 * @param {Number} rowIndex The index of the rendered row
	 * @param {Object} rowParams The row parameters
	 * @param {Ext.data.Store} store The store in which the record is placed
	 * @returns A string containing a space separated list of css
	 * classes to apply.  It will always contain 'today-item', and a
	 * second class that indicates the intended busy state of the
	 * appointment.
	 * @private
	 */
	applyRowClass: function (record, rowIndex, rowParams, store)
	{
		var location = record.get('location');
		if (location) {
			rowParams.body = '<table style="width: 100%; padding: 0; border-spacing: 0;">';
			rowParams.body += String.format('<tr><td style="width: 100%; font-size: 80%;"><i>{0}</i></td></tr>',
				Ext.util.Format.htmlEncode(location));
			rowParams.body += '</table>';
		} else {
			rowParams.body = '';
		}

		var css = 'today-item ';
		var busystatus = record.get('busystatus');
		switch (busystatus) {
			case Zarafa.core.mapi.BusyStatus.FREE:
				return css + 'today-free';
			case Zarafa.core.mapi.BusyStatus.TENTATIVE:
				return css + 'today-tentative';
			case Zarafa.core.mapi.BusyStatus.BUSY:
				return css + 'today-busy';
			case Zarafa.core.mapi.BusyStatus.OUTOFOFFICE:
				return css + 'today-outofoffice';
			default:
				return css + 'today-unknown';
		}
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
		displayName : _('Today\'s Appointments'),
		widgetConstructor : Zarafa.widgets.folderwidgets.AppointmentsWidget
	}));
});
