/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.data');

/**
 * @class Grommunio.mail.data.DataModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different data modes of the mail context.
 *
 * @singleton
 */
Grommunio.mail.data.DataModes = Grommunio.core.Enum.create({
	/**
	 * View all mail items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	ALL: 0,
	/**
	 * View all found mail items in the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 1,
	/**
	 * View all unread filtered mail items in the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	UNREAD: 2
});
