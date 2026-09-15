/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/BusyStatus.js
 */
Ext.namespace('Grommunio.calendar.data.busytime');

/**
 * @class Grommunio.calendar.data.busytime.BusyTimeRecordFields
 *
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.calendar.data.busytime.BusyTimeRecord BusyTimeRecord} object.
 */
Grommunio.calendar.data.busytime.BusyTimeRecordFields = [
	{name: 'startdate', type: 'date', dateFormat: 'timestamp'},
	{name: 'duedate', type: 'date', dateFormat: 'timestamp'},
	{name: 'busystatus', type: 'int', defaultValue: Grommunio.core.mapi.BusyStatus.FREE}
];

/**
 * @class Grommunio.calendar.data.busytime.BusyTimeRecord
 * A record with minimal data, used for determining days in the month that have appointments
 */
Grommunio.calendar.data.busytime.BusyTimeRecord = Ext.data.Record.create(Grommunio.calendar.data.busytime.BusyTimeRecordFields);
