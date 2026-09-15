/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.common.data
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different views of the context.
 *
 * @singleton
 */
Grommunio.common.data.Views = Grommunio.core.Enum.create({
	/**
	 * View all context items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST: 0,

	/**
	 * View all found search items from the folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 1,

	/**
	 * View all updated batch of context items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIVESCROLL: 2
});
