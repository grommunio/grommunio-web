/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/TaskStatus.js
 */
Ext.namespace('Grommunio.task.data');

/**
 * @class Grommunio.task.data.TaskStatus
 * @singleton
 */
Grommunio.task.data.TaskStatus = {
	status: [{
		value: Grommunio.core.mapi.TaskStatus['NOT_STARTED'],
		name: Grommunio.core.mapi.TaskStatus.getDisplayName(Grommunio.core.mapi.TaskStatus['NOT_STARTED'])
	},{
		value: Grommunio.core.mapi.TaskStatus['IN_PROGRESS'],
		name: Grommunio.core.mapi.TaskStatus.getDisplayName(Grommunio.core.mapi.TaskStatus['IN_PROGRESS'])
	},{
		value: Grommunio.core.mapi.TaskStatus['COMPLETE'],
		name: Grommunio.core.mapi.TaskStatus.getDisplayName(Grommunio.core.mapi.TaskStatus['COMPLETE'])
	},{
		value: Grommunio.core.mapi.TaskStatus['WAIT_FOR_OTHER_PERSON'],
		name: Grommunio.core.mapi.TaskStatus.getDisplayName(Grommunio.core.mapi.TaskStatus['WAIT_FOR_OTHER_PERSON'])
	},{
		value: Grommunio.core.mapi.TaskStatus['DEFERRED'],
		name: Grommunio.core.mapi.TaskStatus.getDisplayName(Grommunio.core.mapi.TaskStatus['DEFERRED'])
	}]
};
