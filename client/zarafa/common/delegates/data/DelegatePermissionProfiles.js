/*
 * #dependsFile client/zarafa/core/mapi/Rights.js
 */
Ext.namespace('Zarafa.common.delegates.data');

/**
 * @class Zarafa.common.delegates.data.DelegatePermissionProfiles
 * @singleton
 */
Zarafa.common.delegates.data.DelegatePermissionProfiles = [{
	value : Zarafa.core.mapi.Rights.RIGHTS_OWNER,
	name : _('Owner')
},{
	value : Zarafa.core.mapi.Rights.RIGHTS_SECRETARY,
	name : _('Secretary')
},{
	value : Zarafa.core.mapi.Rights.RIGHTS_READONLY,
	name : _('Only read')
},{
	value : Zarafa.core.mapi.Rights.RIGHTS_NONE,
	name : _('None')
}];