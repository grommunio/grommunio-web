/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.data');

/**
 * @class Grommunio.calendar.data.DataModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different data modes of the calendar context.
 *
 * @singleton
 */
Grommunio.calendar.data.DataModes = Grommunio.core.Enum.create({
	/**
	 * Load all appointments for a given day from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	DAY: 0,
	/**
	 * Load all appointments for a given workweek from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	WORKWEEK: 1,
	/**
	 * Load all appointments for a given week from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	WEEK: 2,
	/**
	 * Load all appointments for a given month from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	MONTH: 3,
	/**
	 * Load all appointments from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	ALL: 4,
	/**
	 * Search for appointments in the selected folder(s)
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 5
});
