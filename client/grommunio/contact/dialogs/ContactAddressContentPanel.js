/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact.dialogs');

/**
 * @class Grommunio.contact.dialogs.ContactAddressContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 *
 * This class will be used to create a detailed address content panel
 *
 * @xtype grommunio.contactaddresscontentpanel
 */
Grommunio.contact.dialogs.ContactAddressContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @cfg {Grommunio.contact.data.ContactDetailsParser} parser parser object that will be used to parse information
	 */
	parser: null,

	/**
	 * @cfg {String} property property that will be modified
	 */
	property: null,

	/**
	 * @cfg {Object} parsedData if data is already parsed then it can be passed here,
	 * so there is no need to parse the same data again
	 */
	parsedData: null,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			layout: 'fit',
			border: false,
			xtype: 'grommunio.contactaddresscontentpanel',
			title: _('Check address'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: false,
			width: 400,
			height: 300,
			items: [{
				xtype: 'grommunio.contactaddresspanel',
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

		Grommunio.contact.dialogs.ContactAddressContentPanel.superclass.constructor.call(this, config);
	}
});

// register panel
Ext.reg('grommunio.contactaddresscontentpanel', Grommunio.contact.dialogs.ContactAddressContentPanel);
