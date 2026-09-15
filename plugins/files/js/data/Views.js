/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.Views
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different views of the files context.
 *
 * @singleton
 */
Grommunio.plugins.files.data.Views = Grommunio.core.Enum.create({

	/**
	 * View all files items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST: 0,

	/**
	 * View all files items from the selected folder(s) in the 'icon' view.
	 *
	 * @property
	 * @type Number
	 */
	ICON: 1,

	/**
	 * View all store items in the 'account' view.
	 *
	 * @property
	 * @type Number
	 */
	ACCOUNT : 2
});
