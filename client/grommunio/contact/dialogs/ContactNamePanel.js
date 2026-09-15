/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact.dialogs');

/**
 * @class Grommunio.contact.dialogs.ContactNamePanel
 * @extends Ext.form.FormPanel
 * @xtype grommunio.contactnamepanel
 */
Grommunio.contact.dialogs.ContactNamePanel = Ext.extend(Ext.form.FormPanel, {
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
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'grommunio.contactnamepanel',
			border: false,
			frame: true,
			padding: 5,
			items: this.createFormItems()
		});

		Grommunio.contact.dialogs.ContactNamePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Create the form in which the name specifications can be written
	 * @return {Object} Configuration object for the form
	 */
	createFormItems: function()
	{
		var tplString = '<tpl for="."><div class="x-combo-list-item">{displayText:htmlEncodeDefaultValue(Grommunio.contact.data.config.NBSP)}</div></tpl>';
		return [{
			xtype: 'combo',
			fieldLabel: _('Title'),
			editable: false,
			name: 'display_name_prefix',
			mode: 'local',
			triggerAction: 'all',
			store: {
				xtype: 'arraystore',
				fields: ['displayText'],
				data: Grommunio.contact.data.config.Prefix
			},
			tpl: new Ext.XTemplate(tplString, {
				compiled: true		// compile immediately
			}),
			displayField: 'displayText',
			valueField: 'displayText'
		},{
			xtype: 'textfield',
			anchor: '100%',
			fieldLabel: _('First'),
			name: 'given_name'
		},{
			xtype: 'textfield',
			anchor: '100%',
			fieldLabel: _('Middle'),
			name: 'middle_name'
		},{
			xtype: 'textfield',
			anchor: '100%',
			fieldLabel: _('Last'),
			name: 'surname'
		},{
			xtype: 'combo',
			fieldLabel: _('Suffix'),
			editable: false,
			name: 'generation',
			mode: 'local',
			triggerAction: 'all',
			store: {
				xtype: 'arraystore',
				fields: ['displayText'],
				data: Grommunio.contact.data.config.Suffix
			},
			tpl: new Ext.XTemplate(tplString, {
				compiled: true		// compile immediately
			}),
			displayField: 'displayText',
			valueField: 'displayText'
		},{
			xtype: 'checkbox',
			boxLabel: _('Show this again when name is incomplete or unclear.'),
			ref: 'settingCheckField',
			hideLabel: true,
			checked: container.getSettingsModel().get('grommunio/v1/contexts/contact/show_name_dialog')
		}];
	},

	/**
	 * Load record into form
	 *
	 * @param {Grommunio.core.data.IPMRecord} record The record to load
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		if (!Ext.isDefined(record)) {
			return;
		}

		if (Ext.isEmpty(this.parsedData)) {
			var keys = this.getForm().getValues();
			for (var key in keys) {
				if (!Ext.isEmpty(record.get(key))) {
					this.parsedData = Ext.apply(this.parsedData || {}, record.data);
					break;
				}
			}

			// If the parsed data was not found in the record, check if the parseable string
			// can be found in the record instead.
			if (Ext.isEmpty(this.parsedData) && !Ext.isEmpty(record.get('display_name'))) {
				var newParsedData = this.parser.parseInfo('name', record.get('display_name'));
				this.parsedData = Ext.apply(this.parsedData || {}, newParsedData);
			}
		}

		var form = this.getForm();
		form.setValues(this.parsedData);

		// remove data after it has been put in the form fields, so consecutive requests
		// will use data from record
		this.parsedData = null;
	},

	/**
	 * Update record from form
	 *
	 * @param {Grommunio.core.data.IPMRecord} record The record to update
	 * @private
	 */
	updateRecord: function(record)
	{
		var form = this.getForm();

		if (this.settingCheckField.isDirty()) {
			container.getSettingsModel().set('grommunio/v1/contexts/contact/show_name_dialog', this.settingCheckField.getValue());
		}

		record.beginEdit();
		if (Ext.isDefined(this.parser)) {
			record.set('display_name', this.parser.combineInfo('name', form.getValues()));
		}

		form.updateRecord(record);
		record.endEdit();
	}
});

Ext.reg('grommunio.contactnamepanel', Grommunio.contact.dialogs.ContactNamePanel);
