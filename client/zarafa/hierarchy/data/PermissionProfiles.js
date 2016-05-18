/*
 * #dependsFile client/zarafa/core/mapi/Rights.js
 */
Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.PermissionProfiles
 * @singleton
 */
Zarafa.hierarchy.data.PermissionProfiles = [{
	value : Zarafa.core.mapi.Rights.RIGHTS_FULL_CONTROL,
	name : _('Full control')
},{
	value : Zarafa.core.mapi.Rights.RIGHTS_OWNER,
	name : _('Owner')
},{
	value : Zarafa.core.mapi.Rights.RIGHTS_SECRETARY,
	name : _('Secretary')
},{
	value : Zarafa.core.mapi.Rights.RIGHTS_READONLY,
	name : _('Only read')
},{
	value : Zarafa.core.mapi.Rights.RIGHTS_NO_RIGHTS,
	name : _('No rights')
},{
	value : null,
	name : _('Other')
}];
