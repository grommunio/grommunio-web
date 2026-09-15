/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/Flags.js
 */
Ext.namespace('Grommunio.mail.data');

/**
 * @class Grommunio.mail.data.MailFlags
 * @singleton
 */
Grommunio.mail.data.MailFlags = {
	colors: [{
		name: _('Red'),
		iconCls: 'icon_flag_red',
		flagStatus: Grommunio.core.mapi.FlagStatus.flagged,
		flagColor: Grommunio.core.mapi.FlagIcon.red
	},{
		name: _('Blue'),
		iconCls: 'icon_flag_blue',
		flagStatus: Grommunio.core.mapi.FlagStatus.flagged,
		flagColor: Grommunio.core.mapi.FlagIcon.blue
	},{
		name: _('Yellow'),
		iconCls: 'icon_flag_yellow',
		flagStatus: Grommunio.core.mapi.FlagStatus.flagged,
		flagColor: Grommunio.core.mapi.FlagIcon.yellow
	},{
		name: _('Green'),
		iconCls: 'icon_flag_green',
		flagStatus: Grommunio.core.mapi.FlagStatus.flagged,
		flagColor: Grommunio.core.mapi.FlagIcon.green
	},{
		name: _('Orange'),
		iconCls: 'icon_flag_orange',
		flagStatus: Grommunio.core.mapi.FlagStatus.flagged,
		flagColor: Grommunio.core.mapi.FlagIcon.orange
	},{
		name: _('Purple'),
		iconCls: 'icon_flag_purple',
		flagStatus: Grommunio.core.mapi.FlagStatus.flagged,
		flagColor: Grommunio.core.mapi.FlagIcon.purple
	}],

	state: [{
		name: _('Complete'),
		iconCls: 'icon_flag_complete',
		flagStatus: Grommunio.core.mapi.FlagStatus.completed,
		flagColor: Grommunio.core.mapi.FlagIcon.clear
	},{
		name: _('None'),
		iconCls: 'icon_flag',
		flagStatus: Grommunio.core.mapi.FlagStatus.cleared,
		flagColor: Grommunio.core.mapi.FlagIcon.clear
	}]
};
