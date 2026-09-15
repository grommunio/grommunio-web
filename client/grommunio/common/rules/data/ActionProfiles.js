/*
 * #dependsFile client/grommunio/common/rules/data/ActionFlags.js
 */
Ext.namespace('Grommunio.common.rules.data');

/**
 * @class Grommunio.common.rules.data.ActionProfiles
 * @singleton
 */
Grommunio.common.rules.data.ActionProfiles = [{
	name: _('Move the message to folder…'),
	value: Grommunio.common.rules.data.ActionFlags.MOVE
},{
	name: _('Copy the message to folder…'),
	value: Grommunio.common.rules.data.ActionFlags.COPY
},{
	name: _('Delete the message'),
	value: Grommunio.common.rules.data.ActionFlags.DELETE
},{
	name: _('Redirect the message to…'),
	value: Grommunio.common.rules.data.ActionFlags.REDIRECT
},{
	name: _('Forward the message to…'),
	value: Grommunio.common.rules.data.ActionFlags.FORWARD
},{
	name: _('Forward the message as attachment to…'),
	value: Grommunio.common.rules.data.ActionFlags.FORWARD_ATTACH
}, {
	name: _('Mark the message as read…'),
	value: Grommunio.common.rules.data.ActionFlags.MARK_AS_READ
}];
