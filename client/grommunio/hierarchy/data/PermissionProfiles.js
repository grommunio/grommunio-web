/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/Rights.js
 */
Ext.namespace('Grommunio.hierarchy.data');

/**
 * @class Grommunio.hierarchy.data.PermissionProfiles
 * @singleton
 */
Grommunio.hierarchy.data.PermissionProfiles = [{
	value: Grommunio.core.mapi.Rights.RIGHTS_OWNER,
	name: _('Owner')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_PUBLISHINGEDITOR,
	name: _('Publishing Editor')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_EDITOR,
	name: _('Editor')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_PUBLISHINGAUTHOR,
	name: _('Publishing Author')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_AUTHOR,
	name: _('Author')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_NONEDITINGAUTHOR,
	name: _('Nonediting Author')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_REVIEWER,
	name: _('Reviewer')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_CONTRIBUTOR,
	name: _('Contributor')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_NO_RIGHTS,
	name: _('None')
},{
	value: null,
	name: _('Custom')
}];

/**
 * @class Grommunio.hierarchy.data.PermissionProfilesCalendar
 * @singleton
 */
Grommunio.hierarchy.data.PermissionProfilesCalendar = [{
	value: Grommunio.core.mapi.Rights.RIGHTS_CAL_OWNER,
	name: _('Owner')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_CAL_PUBLISHINGEDITOR,
	name: _('Publishing Editor')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_CAL_EDITOR,
	name: _('Editor')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_CAL_PUBLISHINGAUTHOR,
	name: _('Publishing Author')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_CAL_AUTHOR,
	name: _('Author')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_CAL_NONEDITINGAUTHOR,
	name: _('Nonediting Author')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_CAL_REVIEWER,
	name: _('Reviewer')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_CAL_CONTRIBUTOR,
	name: _('Contributor')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_CAL_FBDETAILED,
	name: _('Free/Busy time, subject, location')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_CAL_FBSIMPLE,
	name: _('Free/Busy time')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_NO_RIGHTS,
	name: _('None')
},{
	value: null,
	name: _('Custom')
}];
