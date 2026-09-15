/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/common/data/ImportanceFlags.js
 * #dependsFile client/grommunio/mail/data/SensitivityFlags.js
 */
Ext.namespace('Grommunio.mail.dialogs');

/**
 * @class Grommunio.mail.dialogs.MailOptionsSettingsPanel
 * @extends Ext.Panel
 * @xtype grommunio.mailoptionssettingspanel
 *
 * Panel for users to set message settings on a given {@link Grommunio.mail.MailRecord record},
 * like the {@link Grommunio.core.mapi.Importance} or {@link Grommunio.core.mapi.Sensitivity}.
 */
Grommunio.mail.dialogs.MailOptionsSettingsPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * The record on which this panel is operating on. This record is provided through the
	 * {@link #update} function.
	 * @property
	 * @type Grommunio.core.data.IPMRecord
	 */
	record: undefined,

	/**
	 * @cfg {Ext.data.Store/Object} importanceStore The store (or store configuration object),
	 * which contains the {@link Grommunio.core.mapi.Importance importance} data.
	 */
	importanceStore: undefined,

	/**
	 * @cfg {Ext.data.Store/Object} sensitivityStore The store (or store configuration object),
	 * which contains the {@link Grommunio.core.mapi.Sensitivity sensitivity} data.
	 */
	sensitivityStore: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		if (!config.importanceStore) {
			config.importanceStore = {
				xtype: 'jsonstore',
				fields: ['value', 'name'],
				data: Grommunio.common.data.ImportanceFlags.flags
			};
		}

		if (!config.sensitivityStore) {
			config.sensitivityStore = {
				xtype: 'jsonstore',
				fields: ['value', 'name'],
				data: Grommunio.mail.data.SensitivityFlags.flags
			};
		}

		Ext.applyIf(config, {
			xtype: 'grommunio.mailoptionssettingspanel',
			title: _('Message Settings'),
			layout: 'form',
			items: [{
				xtype: 'combo',
				fieldLabel: _('Importance'),
				ref: 'importanceCombo',
				anchor: '100%',
				name: 'importance',
				store: config.importanceStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'name',
				valueField: 'value',
				lazyInit: false,
				forceSelection: true,
				editable: false,
				listeners: {
					select: this.onFieldSelect,
					scope: this
				}
			},{
				xtype: 'combo',
				fieldLabel: _('Sensitivity'),
				ref: 'sensitivityCombo',
				anchor: '100%',
				name: 'sensitivity',
				store: config.sensitivityStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'name',
				valueField: 'value',
				lazyInit: false,
				forceSelection: true,
				editable: false,
				listeners: {
					select: this.onFieldSelect,
					scope: this
				}
			}]
		});

		Grommunio.mail.dialogs.MailOptionsSettingsPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is fired when a combobox selection has changed.
	 * This will update the corresponding field inside the {@link Grommunio.core.data.IPMRecord record}
	 * @param {Ext.form.ComboBox} combo The combobox which was selected
	 * @param {Ext.data.Record} record The selected record
	 * @param {Number} index The index of the selected record
	 * @private
	 */
	onFieldSelect: function(combo, record, index)
	{
		this.record.set(combo.getName(), record.get(combo.valueField));
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

			// Disable the sensitivity comboBox when reading received mail.
			if (!record.phantom && !record.isUnsent()) {
				this.sensitivityCombo.disable();
			} else {
				this.sensitivityCombo.enable();
			}
		} else {
			this.importanceCombo.setValue(1);
			this.sensitivityCombo.setValue(0);
		}
	},

	/**
	 * Update the {@link Grommunio.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Grommunio.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord: function(record)
	{
		this.getForm().updateRecord(record);

		if(record.get('sensitivity') === Grommunio.core.mapi.Sensitivity['PRIVATE']) {
			record.set('private', true);
		} else {
			record.set('private', false);
		}
	}
});

Ext.reg('grommunio.mailoptionssettingspanel', Grommunio.mail.dialogs.MailOptionsSettingsPanel);
