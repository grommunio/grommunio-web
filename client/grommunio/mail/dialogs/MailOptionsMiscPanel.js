/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.dialogs');

/**
 * @class Grommunio.mail.dialogs.MailOptionsMiscPanel
 * @extends Ext.form.FormPanel
 * @xtype grommunio.mailoptionsmiscpanel
 *
 * Panel for users to set miscellaneous options on a given {@link Grommunio.mail.MailRecord record},
 * like the categories.
 */
Grommunio.mail.dialogs.MailOptionsMiscPanel = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'grommunio.mailoptionsmiscpanel',
			title: _('Properties'),
			layout: 'form',
			items: [{
				xtype: 'textarea',
				fieldLabel: _('Internet Headers'),
				name: 'transport_message_headers',
				readOnly: true,
				anchor: '100% -50',
				autoScroll: true,
				border: false,
				// Make sure the text is not wrapped
				style: 'word-wrap: normal',
				ref: 'headersTextArea'
			},{
				xtype: 'textfield',
				fieldLabel: _('Object ID'),
				name: 'x_midtext',
				readOnly: true,
				anchor: '100%',
				autoScroll: true,
				border: false
			}]
		});

		Grommunio.mail.dialogs.MailOptionsMiscPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Grommunio.core.data.IPMRecord IPMRecord}
	 * @param {Grommunio.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		this.record = record;

		if (record) {
			Grommunio.common.dialogs.ensureRecordObjectId(record);
			this.getForm().loadRecord(record);
		} else {
			this.headersTextArea.setValue('');
		}
	},

	/**
	 * Update the {@link Grommunio.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Grommunio.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord: function(record)
	{
		this.getForm().updateRecord(record);
	}
});

/* A reduced MiscPanel for Draft messages where PR_TRANSPORT_HEADERS does not make sense */
Grommunio.mail.dialogs.MailOptionsMsgidPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'grommunio.mailoptionsmiscpanel',
			title: _('Properties'),
			layout: 'form',
			items: [{
				xtype: 'textfield',
				fieldLabel: _('Object ID'),
				name: 'x_midtext',
				readOnly: true,
				anchor: '100%',
				autoScroll: true,
				border: false
			}]
		});

		Grommunio.mail.dialogs.MailOptionsMsgidPanel.superclass.constructor.call(this, config);
	},

	update: function(record, contentReset)
	{
		this.record = record;

		if (record) {
			Grommunio.common.dialogs.ensureRecordObjectId(record);
			this.getForm().loadRecord(record);
		} else {
			var objectIdField = this.getForm().findField('x_midtext');
			if (objectIdField) {
				objectIdField.setValue('');
			}
		}
	},

	/**
	 * Update the {@link Grommunio.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Grommunio.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord: function(record)
	{
		this.getForm().updateRecord(record);
	}
});

Ext.reg('grommunio.mailoptionsmiscpanel', Grommunio.mail.dialogs.MailOptionsMiscPanel);
Ext.reg('grommunio.mailoptionsmsgidpanel', Grommunio.mail.dialogs.MailOptionsMsgidPanel);
