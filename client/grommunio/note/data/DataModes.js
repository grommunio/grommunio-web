/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.note.data');

/**
 * @class Grommunio.note.data.DataModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different data modes of the note context.
 *
 * @singleton
 */
Grommunio.note.data.DataModes = Grommunio.core.Enum.create({
	/**
	 * View all note items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	ALL: 0,
	/**
	 * View all note items from the selected folder(s) from last seven days.
	 *
	 * @property
	 * @type Number
	 */
	LAST_7_DAYS: 1,
	/**
	 * View all found note items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 2
});
