/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.dialogs');

/**
 * @class Grommunio.mail.dialogs.MailCreateOptionsContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.mailcreateoptionscontentpanel
 *
 * Content panel for users for setting the options on a {@link Grommunio.mail.MailRecord record}
 */
Grommunio.mail.dialogs.MailCreateOptionsContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.mailcreateoptionscontentpanel',
			// Override from Ext.Component
			layout: 'fit',
			title: _('Message Options'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: !config.modal,
			width: 320,
			height: 330,
			items: [{
				xtype: 'grommunio.mailcreateoptionspanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Grommunio.mail.dialogs.MailCreateOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.mailcreateoptionscontentpanel', Grommunio.mail.dialogs.MailCreateOptionsContentPanel);
