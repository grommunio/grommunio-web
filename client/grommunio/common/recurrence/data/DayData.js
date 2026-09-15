/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.recurrence.data');

/**
 * @class Grommunio.common.recurrence.data.DayData
 * @singleton
 */
Grommunio.common.recurrence.data.DayData = [
	{ name: _('Day'),			value: 127 },
	{ name: _('Weekday'),		value: 62 },
	{ name: _('Weekend Day'),	value: 65 },
	// The following are initialized empty,
	// because the order of the days is
	// depending on the 'grommunio/v1/main/week_start'
	// configuration option, which we cannot use
	// until the Document has been loaded.
	{ name: null,				value: 0 },
	{ name: null,				value: 0 },
	{ name: null,				value: 0 },
	{ name: null,				value: 0 },
	{ name: null,				value: 0 },
	{ name: null,				value: 0 },
	{ name: null,				value: 0 }
];

// With the document loaded, we can now access the 'grommunio/v1/main/week_start'
// configuration option, which we need to build the last 7 items from the
// Grommunio.common.recurrence.data.DayData structure.
Grommunio.onReady(function() {
	var weekStart = container.getSettingsModel().get('grommunio/v1/main/week_start');

	for (var i = 3; i < Grommunio.common.recurrence.data.DayData.length; i++) {
		var index = (weekStart + (i - 3)) % 7;
		Grommunio.common.recurrence.data.DayData[i].name = Date.dayNames[index];
		Grommunio.common.recurrence.data.DayData[i].value = Math.pow(2, index);
	}
}, undefined, { single: true });
