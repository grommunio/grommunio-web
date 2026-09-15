/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.data');

/**
 * @class Grommunio.mail.data.Views
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different views of the mail context.
 *
 * @singleton
 */
Grommunio.mail.data.Views = Grommunio.core.Enum.create({
	/**
	 * View all mail items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST: 0,

	/**
	 * View all found mail items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 1,

	/**
	 * View all updated batch of mail items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIVESCROLL: 2
});
