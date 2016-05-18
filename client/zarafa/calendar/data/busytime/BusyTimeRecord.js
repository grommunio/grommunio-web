/*
 * #dependsFile client/zarafa/core/mapi/BusyStatus.js
 */
Ext.namespace('Zarafa.calendar.data.busytime');

/**
 * @class Zarafa.calendar.data.busytime.BusyTimeRecordFields
 *
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.calendar.data.busytime.BusyTimeRecord BusyTimeRecord} object.
 */
Zarafa.calendar.data.busytime.BusyTimeRecordFields = [
	{name: 'startdate', type: 'date', dateFormat: 'timestamp'},
	{name: 'duedate', type: 'date', dateFormat: 'timestamp'},
	{name: 'busystatus', type: 'int', defaultValue: Zarafa.core.mapi.BusyStatus.FREE}
];

/**
 * @class Zarafa.calendar.data.busytime.BusyTimeRecord
 * A record with minimal data, used for determining days in the month that have appointments
 */
Zarafa.calendar.data.busytime.BusyTimeRecord = Ext.data.Record.create(Zarafa.calendar.data.busytime.BusyTimeRecordFields);
