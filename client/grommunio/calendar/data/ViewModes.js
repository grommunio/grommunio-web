/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.data');

/**
 * @class Grommunio.calendar.data.ViewModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different viewing modes of the calendar context.
 *
 * @singleton
 */
Grommunio.calendar.data.ViewModes = Grommunio.core.Enum.create({
	/**
	 * View all appointments for a given day(s) from the selected folder(s)
	 * inside the Days view (every day has its own column).
	 *
	 * @property
	 * @type Number
	 */
	DAYS: 0,
	/**
	 * View all appointments for a given day(s) from the selected folder(s)
	 * inside the Box view (every day is a Box within a table).
	 *
	 * @property
	 * @type Number
	 */
	BOX: 1,
	/**
	 * View all appointments for a given period in a simple list.
	 * @property
	 * @type Number
	 */
	LIST: 2,
	/**
	 * View the search results for the appointments in a simple list.
	 * @property
	 * @type Number
	 */
	SEARCH: 3
});
