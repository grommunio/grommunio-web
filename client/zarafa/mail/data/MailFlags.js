/*
 * #dependsFile client/zarafa/core/mapi/Flags.js
 */
Ext.namespace('Zarafa.mail.data');

/**
 * @class Zarafa.mail.data.MailFlags
 * @singleton
 */
Zarafa.mail.data.MailFlags = {
	colors: [{
		name : _('Red'),
		iconCls : 'icon_flag_red',
		flagStatus: Zarafa.core.mapi.FlagStatus.flagged,
		flagColor: Zarafa.core.mapi.FlagIcon.red
	},{
		name : _('Blue'),
		iconCls : 'icon_mail_flag_blue',
		flagStatus: Zarafa.core.mapi.FlagStatus.flagged,
		flagColor: Zarafa.core.mapi.FlagIcon.blue
	},{
		name : _('Yellow'),
		iconCls : 'icon_mail_flag_yellow',
		flagStatus: Zarafa.core.mapi.FlagStatus.flagged,
		flagColor: Zarafa.core.mapi.FlagIcon.yellow
	},{
		name : _('Green'),
		iconCls : 'icon_mail_flag_green',
		flagStatus: Zarafa.core.mapi.FlagStatus.flagged,
		flagColor: Zarafa.core.mapi.FlagIcon.green
	},{
		name : _('Orange'),
		iconCls : 'icon_mail_flag_orange',
		flagStatus: Zarafa.core.mapi.FlagStatus.flagged,
		flagColor: Zarafa.core.mapi.FlagIcon.orange
	},{
		name : _('Purple'),
		iconCls : 'icon_mail_flag_purple',
		flagStatus: Zarafa.core.mapi.FlagStatus.flagged,
		flagColor: Zarafa.core.mapi.FlagIcon.purple
	}],

	state: [{
		name : _('Complete'),
		iconCls : 'icon_flag_complete',
		flagStatus: Zarafa.core.mapi.FlagStatus.completed,
		flagColor: Zarafa.core.mapi.FlagIcon.clear
	},{
		name : _('None'),
		iconCls : 'icon_mail_flag',
		flagStatus: Zarafa.core.mapi.FlagStatus.cleared,
		flagColor: Zarafa.core.mapi.FlagIcon.clear
	}]
};
