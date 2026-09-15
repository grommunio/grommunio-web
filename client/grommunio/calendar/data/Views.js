/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.data');

/**
 * @class Grommunio.calendar.data.Views
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different views of the calendar context.
 *
 * @singleton
 */
Grommunio.calendar.data.Views = Grommunio.core.Enum.create({
	/**
	 * View all appointments for a given day(s) from the selected folder(s)
	 * inside blocks view.
	 *
	 * @property
	 * @type Number
	 */
	BLOCKS: 0,
	/**
	 * View all appointments for a given day(s) from the selected folder(s)
	 * inside the grid view.
	 *
	 * @property
	 * @type Number
	 */
	LIST: 1,
	/**
	 * View all found appointments in the selected folder(s)
	 * inside the grid view.
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 2
});
