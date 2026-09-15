/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact.dialogs');

/**
 * @class Grommunio.contact.dialogs.ContactOptionsContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.contactoptionscontentpanel
 */
Grommunio.contact.dialogs.ContactOptionsContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'grommunio.contactoptionscontentpanel',
			layout: 'fit',
			title: _('Message Options'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: !config.modal,
			width: 360,
			height: 220,
			items: [{
				xtype: 'grommunio.contactoptionspanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				}]
			}]
		});

		Grommunio.contact.dialogs.ContactOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.contactoptionscontentpanel', Grommunio.contact.dialogs.ContactOptionsContentPanel);
