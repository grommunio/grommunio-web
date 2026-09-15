/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact.dialogs');

/**
 * @class Grommunio.contact.dialogs.ContactPhoneContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 *
 * This class will be used to create a detailed phone content panel,
 * This panel doesn't support passing already parsed data as there isn't any
 * functionality needed that will automatically trigger this panel so data will
 * be parsed in this content panel only
 *
 * @xtype grommunio.contactphonecontentpanel
 */
Grommunio.contact.dialogs.ContactPhoneContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @cfg {Grommunio.contact.data.ContactDetailsParser} parser parser object that will be used to parse information
	 */
	parser: null,

	/**
	 * @cfg {String} property property that will be modified
	 */
	property: null,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.contactphonecontentpanel',
			layout: 'fit',
			border: false,
			title: _('Check phone number'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: false,
			width: 400,
			height: 250,
			items: [{
				xtype: 'grommunio.contactphonepanel',
				ref: 'mainPanel',
				parser: config.parser,
				parsedData: config.parsedData,
				property: config.property,
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					scope: this,
					handler: this.onCancel
				}]
			}]
		});

		Grommunio.contact.dialogs.ContactPhoneContentPanel.superclass.constructor.call(this, config);
	}
});

// register panel
Ext.reg('grommunio.contactphonecontentpanel', Grommunio.contact.dialogs.ContactPhoneContentPanel);
