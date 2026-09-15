/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.TaskOwnership
 * @extends Grommunio.core.Enum
 * @singleton
 *
 * The TaskOwnership property indicates the role of the current user relative to the Task object.
 */
Grommunio.core.mapi.TaskOwnership = Grommunio.core.Enum.create({
	/**
	 * Denotes that the task object is not assigned.
	 * @property
	 * @type Number
	 */
	'NEWTASK': 0,

	/**
	 * Denotes that the task object is the task assigner's copy of the Task object.
	 * @property
	 * @type Number
	 */
	'DELEGATEDTASK': 1,

	/**
	 * Denotes that the task object is the task assignee's copy of the Task object.
	 * @property
	 * @type Number
	 */
	'OWNTASK': 2
});

