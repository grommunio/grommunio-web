/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.ui');

/**
 * @class Grommunio.mail.ui.MailViewPanel
 * @extends Ext.Panel
 * @xtype grommunio.mailviewpanel
 *
 * Panel that shows the contents of mail messages.
 */
Grommunio.mail.ui.MailViewPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.mailviewpanel',
			border: false,
			cls: 'grommunio-mailviewpanel',
			layout: 'grommunio.collapsible',
			items: [{
				xtype: 'grommunio.messageheader'
			},{
				xtype: 'grommunio.messagebody'
			}]
		});

		Grommunio.mail.ui.MailViewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.mailviewpanel', Grommunio.mail.ui.MailViewPanel);
