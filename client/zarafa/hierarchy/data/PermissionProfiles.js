/*
 * #dependsFile client/zarafa/core/mapi/Rights.js
 */
Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.PermissionProfiles
 * @singleton
 */
Zarafa.hierarchy.data.PermissionProfiles = [{
	value: Zarafa.core.mapi.Rights.RIGHTS_OWNER,
	name: _('Owner')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_PUBLISHINGEDITOR,
	name: _('Publishing Editor')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_EDITOR,
	name: _('Editor')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_PUBLISHINGAUTHOR,
	name: _('Publishing Author')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_AUTHOR,
	name: _('Author')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_NONEDITINGAUTHOR,
	name: _('Nonediting Author')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_REVIEWER,
	name: _('Reviewer')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_CONTRIBUTOR,
	name: _('Contributor')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_NO_RIGHTS,
	name: _('None')
},{
	value: null,
	name: _('Custom')
}];

/**
 * @class Zarafa.hierarchy.data.PermissionProfilesCalendar
 * @singleton
 */
Zarafa.hierarchy.data.PermissionProfilesCalendar = [{
	value: Zarafa.core.mapi.Rights.RIGHTS_CAL_OWNER,
	name: _('Owner')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_CAL_PUBLISHINGEDITOR,
	name: _('Publishing Editor')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_CAL_EDITOR,
	name: _('Editor')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_CAL_PUBLISHINGAUTHOR,
	name: _('Publishing Author')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_CAL_AUTHOR,
	name: _('Author')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_CAL_NONEDITINGAUTHOR,
	name: _('Nonediting Author')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_CAL_REVIEWER,
	name: _('Reviewer')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_CAL_CONTRIBUTOR,
	name: _('Contributor')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_CAL_FBDETAILED,
	name: _('Free/Busy time, subject, location')
},{
	value: Zarafa.core.mapi.Rights.RIGHTS_CAL_FBSIMPLE,
	name: _('Free/Busy time')
},{
	value: null,
	name: _('Custom')
}];
