/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/Rights.js
 */
Ext.namespace('Grommunio.common.delegates.data');

/**
 * @class Grommunio.common.delegates.data.DelegatePermissionProfiles
 * @singleton
 */
Grommunio.common.delegates.data.DelegatePermissionProfiles = [{
	value: Grommunio.core.mapi.Rights.RIGHTS_OWNER,
	name: _('Owner')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_SECRETARY,
	name: _('Secretary')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_READONLY,
	name: _('Only read')
},{
	value: Grommunio.core.mapi.Rights.RIGHTS_NONE,
	name: _('None')
}];
