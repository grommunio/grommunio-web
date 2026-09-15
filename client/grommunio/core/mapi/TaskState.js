/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.TaskState
 * @extends Grommunio.core.Enum
 *
 * @singleton
 */
Grommunio.core.mapi.TaskState = Grommunio.core.Enum.create({

	/**
	 * Denotes that the task is normal.
	 * @property
	 * @type Number
	 */
	'NORMAL': 0,
	/**
	 * Denotes that a new task is not assigned.
	 * @property
	 * @type Number
	 */
	'OWNER_NEW': 1,
	/**
	 * Denotes that the task is the assignee copy of an assigned task.
	 * @property
	 * @type Number
	 */
	'OWNER': 2,
	/**
	 * Denotes that the task is the assigner copy of an assigned task.
	 * @property
	 * @type Number
	 */
	'ACCEPT': 3,
	/**
	 * Denotes that the task is Assigner version, but assignee has declined.
	 * @property
	 * @type Number
	 */
	'DECLINE': 4
});

