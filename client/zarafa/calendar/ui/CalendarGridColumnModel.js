Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.CalendarGridColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 * The {@link Zarafa.calendar.ui.CalendarGridColumnModel CalendarGridColumnModel
 * is the default {@link Ext.grid.ColumnModel ColumnModel} for the Calendar.
 */
Zarafa.calendar.ui.CalendarGridColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			columns: this.createColumns(),
			defaults: {
				sortable: true
			}
		});

		Zarafa.calendar.ui.CalendarGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createColumns : function()
	{
		return [{
			xtype : 'checkcolumn',
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_allday">&nbsp;<span class="title">' + _('All Day') + '</span></p>',
			dataIndex: 'alldayevent',
			tooltip : _('Sort by: All Day'),
			width : 24,
			fixed : true,
			// disable checkbox selection
			processEvent : Ext.emptyFn
		},{
			header : '<p class="icon_index">&nbsp;<span class="title">' + _('Icon') + '</span></p>',
			headerCls: 'zarafa-icon-column',
			dataIndex : 'icon_index',
			tooltip : _('Sort by: Icon'),
			width : 24,
			renderer : Zarafa.common.ui.grid.Renderers.icon,
			fixed : true
		},{
			header : '<p class="icon_recurring">&nbsp;<span class="title">' + _('Recurring') + '</span></p>',
			headerCls: 'zarafa-icon-column',
			dataIndex: 'recurring',
			tooltip : _('Sort by: Recurring'),
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.recurrence,
			fixed: true
		},{
			header : _('Subject'),
			dataIndex: 'subject',
			tooltip : _('Sort by: Subject'),
			width: 200,
			renderer : Zarafa.common.ui.grid.Renderers.subject
		},{
			header : _('Startdate'),
			dataIndex: 'startdate',
			tooltip : _('Sort by: Startdate'),
			width: 160,
			renderer : Zarafa.common.ui.grid.Renderers.datetime
		},{
			header : _('Enddate'),
			dataIndex: 'duedate',
			tooltip : _('Sort by: Enddate'),
			width: 160,
			renderer : Zarafa.common.ui.grid.Renderers.datetime
		},{
			header: _('Location'),
			dataIndex: 'location',
			tooltip : _('Sort by: Location'),
			width: 200,
			renderer : Zarafa.common.ui.grid.Renderers.subject
		},{
			header: _('Duration'),
			dataIndex: 'duration',
			tooltip : _('Sort by: Duration'),
			width: 160,
			renderer : Zarafa.common.ui.grid.Renderers.duration
		},{
			header: _('Meeting Status'),
			dataIndex: 'meeting',
			tooltip : _('Sort by: Meeting Status'),
			width: 160,
			renderer: Zarafa.common.ui.grid.Renderers.meetingstatus
		},{
			header: _('Show as'),
			dataIndex: 'busystatus',
			tooltip : _('Sort by: Show as'),
			width: 160,
			renderer: Zarafa.common.ui.grid.Renderers.busystatus,
			hidden: true
		},{
			header: _('Categories'),
			dataIndex: 'categories',
			tooltip : _('Sort by: Categories'),
			width: 160,
			renderer: Zarafa.common.ui.grid.Renderers.categories
		},{
			header: _('Created On'),
			dataIndex: 'creation_time',
			tooltip : _('Sort by: Created On'),
			width: 160,
			renderer : Zarafa.common.ui.grid.Renderers.datetime,
			hidden: true
		},{
			header: _('Due By'),
			dataIndex: 'duedate',
			tooltip : _('Sort by: Due By'),
			width: 160,
			renderer : Zarafa.common.ui.grid.Renderers.dueBy,
			hidden: true
		},{
			header: _('Label'),
			dataIndex: 'label',
			tooltip : _('Sort by: Label'),
			width: 160,
			renderer: Zarafa.common.ui.grid.Renderers.label,
			hidden: true
		},{
			header: _('Organizer'),
			dataIndex: 'sent_representing_name',
			tooltip : _('Sort by: Organizer'),
			hidden: true,
			renderer: Zarafa.common.ui.grid.Renderers.organizer
		},{
			header: _('Required Attendee'),
			dataIndex: 'display_to',
			tooltip : _('Sort by: Required Attendee'),
			hidden: true,
			renderer: Ext.util.Format.htmlEncode
		},{
			header: _('Optional Attendee'),
			dataIndex: 'display_cc',
			tooltip : _('Sort by: Optional Attendee'),
			hidden: true,
			renderer: Ext.util.Format.htmlEncode
		},{
			header: _('Resources'),
			dataIndex: 'display_bcc',
			tooltip : _('Sort by: Resources'),
			hidden: true,
			renderer: Ext.util.Format.htmlEncode
		},{
			header: _('Recurring Startdate'),
			dataIndex: 'startdate_recurring',
			tooltip : _('Sort by: Recurring Startdate'),
			width: 160,
			renderer : Zarafa.common.ui.grid.Renderers.date,
			hidden: true
		},{
			header: _('Recurring Enddate'),
			dataIndex: 'enddate_recurring',
			tooltip : _('Sort by: Recurring Enddate'),
			width: 160,
			renderer : Zarafa.common.ui.grid.Renderers.date,
			hidden: true
		},{
			header: _('Recurring Pattern'),
			dataIndex: 'recurring_pattern',
			tooltip : _('Sort by: Recurring Pattern'),
			width: 400,
			renderer: Zarafa.common.ui.grid.Renderers.subject,
			hidden: true
		},{
			header : '<p class="icon_reminder">&nbsp;<span class="title">' + _('Reminder') + '</span></p>',
			headerCls: 'zarafa-icon-column',
			dataIndex: 'reminder',
			tooltip : _('Sort by: Reminder'),
			width: 24,
			renderer: Zarafa.common.ui.grid.Renderers.reminder,
			fixed: true,
			hidden: true
		},{
			header: _('Sensitivity'),
			dataIndex: 'sensitivity',
			tooltip : _('Sort by: Sensitivity'),
			width: 160,
			renderer: Zarafa.common.ui.grid.Renderers.sensitivity,
			hidden: true
		}];
	}
});
