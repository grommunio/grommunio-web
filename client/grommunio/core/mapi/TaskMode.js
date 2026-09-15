/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.TaskMode
 * @extends Grommunio.core.Enum
 *
 * @singleton
 */
Grommunio.core.mapi.TaskMode = Grommunio.core.Enum.create({

	/**
	 * Denotes that the task is not assigned.
	 * @property
	 * @type Number
	 */
	'NOTHING': 0,
	/**
	 * Denotes that the task is embedded in a message.
	 * @property
	 * @type Number
	 */
	'REQUEST': 1,
	/**
	 * Denotes that the task has been accepted by assignee.
	 * @property
	 * @type Number
	 */
	'ACCEPT': 2,
	/**
	 * Denotes that the task has been rejected by assignee
	 * @property
	 * @type Number
	 */
	'DECLINE': 3,
	/**
	 * Denotes that the task is embedded in task update.
	 * @property
	 * @type Number
	 */
	'UPDATE': 4,
	/**
	 * Denotes that the task has been assigned to self
	 * @property
	 * @type Number
	 */
	'SELF': 5
});

