/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/contact/data/ContactConfig.js
 */
Ext.namespace('Grommunio.contact.dialogs');

/**
 * @class Grommunio.contact.dialogs.ContactNameContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 *
 * this class will be used to create a detailed contact name content panel
 *
 * @xtype grommunio.contactnamecontentpanel
 */
Grommunio.contact.dialogs.ContactNameContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @cfg {Grommunio.contact.data.ContactDetailsParser} parser parser object that will be used to parse information
	 */
	parser: null,

	/**
	 * @cfg {Grommunio.contact.dialogs.parsedNameRecord} parsedData if data is already parsed then it can be passed here,
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

		Ext.applyIf(config, {
			xtype: 'grommunio.contactnamecontentpanel',
			layout: 'fit',
			border: false,
			title: _('Check full name'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: false,
			width: 400,
			height: 250,
			items: [{
				xtype: 'grommunio.contactnamepanel',
				ref: 'mainPanel',
				parser: config.parser,
				parsedData: config.parsedData,
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

		Grommunio.contact.dialogs.ContactNameContentPanel.superclass.constructor.call(this, config);
	}
});

// register panel
Ext.reg('grommunio.contactnamecontentpanel', Grommunio.contact.dialogs.ContactNameContentPanel);
