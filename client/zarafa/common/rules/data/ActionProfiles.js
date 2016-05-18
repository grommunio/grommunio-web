/*
 * #dependsFile client/zarafa/common/rules/data/ActionFlags.js
 */
Ext.namespace('Zarafa.common.rules.data');

/**
 * @class Zarafa.common.rules.data.ActionProfiles
 * @singleton
 */
Zarafa.common.rules.data.ActionProfiles = [{
	name : _('Move the message to folder ...'),
	value : Zarafa.common.rules.data.ActionFlags.MOVE
},{
	name : _('Copy the message to folder ...'),
	value : Zarafa.common.rules.data.ActionFlags.COPY
},{
	name : _('Delete the message'),
	value : Zarafa.common.rules.data.ActionFlags.DELETE
},{
	name : _('Redirect the message to ...'),
	value : Zarafa.common.rules.data.ActionFlags.REDIRECT
},{
	name : _('Forward the message to ...'),
	value : Zarafa.common.rules.data.ActionFlags.FORWARD
},{
	name : _('Forward the message as attachment to ...'),
	value : Zarafa.common.rules.data.ActionFlags.FORWARD_ATTACH
}];
