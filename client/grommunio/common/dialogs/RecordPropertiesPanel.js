/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.dialogs');

/**
 * Ensure that the record has the formatted Object ID available.
 * @param {Grommunio.core.data.IPMRecord} record
 */
Grommunio.common.dialogs.ensureRecordObjectId = function(record)
{
	if (!record) {
		return;
	}

	var objectIdText = record.get('x_midtext');
	if (!objectIdText) {
		objectIdText = Grommunio.core.EntryId.formatObjectId(record.get('entryid'));
		if (objectIdText && record.get('x_midtext') !== objectIdText) {
			record.set('x_midtext', objectIdText);
		}
	}
};

/**
 * @class Grommunio.common.dialogs.RecordPropertiesPanel
 * @extends Ext.form.FormPanel
 * @xtype grommunio.recordpropertiespanel
 *
 * Generic panel for showing the Object ID of a record.
 */
Grommunio.common.dialogs.RecordPropertiesPanel = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'grommunio.recordpropertiespanel',
			title: _('Properties'),
			layout: 'form',
			border: false,
			items: [{
				xtype: 'textfield',
				fieldLabel: _('Object ID'),
				name: 'x_midtext',
				readOnly: true,
				anchor: '100%',
				autoScroll: true,
				border: false,
				ref: 'objectIdField'
			}]
		});

		Grommunio.common.dialogs.RecordPropertiesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the panel with the given record.
	 * @param {Grommunio.core.data.IPMRecord} record
	 */
	update: function(record)
	{
		this.record = record;

		if (record) {
			Grommunio.common.dialogs.ensureRecordObjectId(record);
			this.getForm().loadRecord(record);
		} else if (this.objectIdField) {
			this.objectIdField.setValue('');
		}
	},

	/**
	 * Update the record with the data from the panel.
	 * @param {Grommunio.core.data.IPMRecord} record
	 */
	updateRecord: function(record)
	{
		this.getForm().updateRecord(record);
	}
});

Ext.reg('grommunio.recordpropertiespanel', Grommunio.common.dialogs.RecordPropertiesPanel);
