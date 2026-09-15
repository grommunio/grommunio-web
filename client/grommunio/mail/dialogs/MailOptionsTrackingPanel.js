/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.dialogs');

/**
 * @class Grommunio.mail.dialogs.MailOptionsTrackingPanel
 * @extends Ext.form.FormPanel
 * @xtype grommunio.mailoptionstrackingpanel
 *
 * Panel for users to set tracking options on a given {@link Grommunio.mail.MailRecord record},
 * like read receipts.
 */
Grommunio.mail.dialogs.MailOptionsTrackingPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * The record on which this panel is operating on. This record is provided through the
	 * {@link #update} function.
	 * @property
	 * @type Grommunio.core.data.IPMRecord
	 */
	record: undefined,

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
			xtype: 'grommunio.mailoptionstrackingpanel',
			title: _('Tracking Options'),
			layout: 'form',
			items: [{
				xtype: 'checkbox',
				hideLabel: true,
				ref: 'readReceiptCheckbox',
				boxLabel: _('Request a read receipt for this message.'),
				name: 'read_receipt_requested',
				handler: this.onFieldToggle,
				scope: this
			}]
		});

		Grommunio.mail.dialogs.MailOptionsTrackingPanel.superclass.constructor.call(this, config);
	},

	 /**
	 * A function called when the checked value changes for the checkbox.
	 * @param {Ext.form.Checkbox} checkbox The Checkbox being toggled.
	 * @param {Boolean} checked The new checked state of the checkbox.
	 * @private
	 */
	onFieldToggle: function(checkbox, checked)
	{
		this.record.set(checkbox.getName(), checked);
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
			this.getForm().loadRecord(record);

			if (!record.phantom && !record.isUnsent()) {
				this.readReceiptCheckbox.disable();
			} else {
				this.readReceiptCheckbox.enable();
			}
		} else {
			this.readReceiptCheckbox.setValue(false);
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

Ext.reg('grommunio.mailoptionstrackingpanel', Grommunio.mail.dialogs.MailOptionsTrackingPanel);
