/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.dialogs');

/**
 * @class Grommunio.mail.dialogs.MailViewOptionsPanel
 * @extends Ext.Panel
 * @xtype grommunio.mailviewoptionspanel
 *
 * Panel for users to set the options on a given {@link Grommunio.mail.MailRecord record}
 */
Grommunio.mail.dialogs.MailViewOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.mailviewoptionspanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			defaults: {
				bodyStyle: 'padding-top: 5px; padding-left: 6px; padding-right: 5px; background-color: inherit;',
				border: false
			},
			items: [{
				xtype: 'grommunio.mailoptionssettingspanel'
			},{
				xtype: 'grommunio.mailoptionstrackingpanel'
			},{
				xtype: 'grommunio.mailoptionsmiscpanel',
				flex: 1
			}]
		});

		Ext.apply(this, config);

		Grommunio.mail.dialogs.MailViewOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.mailviewoptionspanel', Grommunio.mail.dialogs.MailViewOptionsPanel);
