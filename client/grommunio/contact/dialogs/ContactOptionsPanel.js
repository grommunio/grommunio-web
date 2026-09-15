/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact.dialogs');

/**
 * @class Grommunio.contact.dialogs.ContactOptionsPanel
 * @extends Ext.Panel
 * @xtype grommunio.contactoptionspanel
 */
Grommunio.contact.dialogs.ContactOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'grommunio.contactoptionspanel',
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
				xtype: 'grommunio.recordpropertiespanel',
				flex: 1
			}]
		});

		Grommunio.contact.dialogs.ContactOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.contactoptionspanel', Grommunio.contact.dialogs.ContactOptionsPanel);
