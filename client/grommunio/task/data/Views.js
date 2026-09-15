/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.task.data');

/**
 * @class Grommunio.task.data.Views
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different views of the task context.
 *
 * @singleton
 */
Grommunio.task.data.Views = Grommunio.core.Enum.create({
	/**
	 * View all task items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST: 0,
	/**
	 * View all found task items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 1
});
