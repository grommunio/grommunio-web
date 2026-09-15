/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.data');

/**
 * @class Grommunio.calendar.data.DayLayoutPosition
 * @extends Object
 *
 * The configuration object for Day Columns as used in the
 * {@link Grommunio.calendar.ui.AbstractCalendarDaysView CalendarDaysView}
 * for configuration of the individual Day Columns.
 */
Grommunio.calendar.data.DayLayoutPosition = Ext.extend(Object, {
	/**
	 * @constructor
	 * @param {Object} config Configrution object
	 */
	constructor: function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * The left offset for the Day Column from the left-side of the container
	 * in which this DayBox is being rendered.
	 * @property
	 * @type Number
	 */
	left: 0,

	/**
	 * The right offset for the Day Column from the right-side of the container
	 * in which this DayBox is being rendered.
	 * @property
	 * @type Number
	 */
	right: 0,

	/**
	 * The date which is being displayed in the Day Column
	 * @property
	 * @type Number
	 */
	date: undefined,

	/**
	 * Indicates if {@link #date} is today.
	 * @property
	 * @type Boolean
	 */
	today: false,

	/**
	 * Indicates if the {@link #date} is a working day.
	 * @property
	 * @type Boolean
	 */
	workingDay: false
});
