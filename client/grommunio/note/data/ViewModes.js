/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.note.data');

/**
 * @class Grommunio.note.data.ViewModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different viewing modes of the note context.
 *
 * @singleton
 */
Grommunio.note.data.ViewModes = Grommunio.core.Enum.create({
	/**
	 * View all note items from the selected folder(s) without grouping.
	 *
	 * @property
	 * @type Number
	 */
	NORMAL: 0,
	/**
	 * View all note items from the selected folder(s) grouped by category.
	 *
	 * @property
	 * @type Number
	 */
	GROUP_CATEGORY: 1,
	/**
	 * View all note items from the selected folder(s) grouped by color.
	 * in the 'grid' view.
	 *
	 * @property
	 * @type Number
	 */
	GROUP_COLOR: 2,
	/**
	 * View all found note items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 3
});
