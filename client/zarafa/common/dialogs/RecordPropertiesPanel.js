Ext.namespace('Zarafa.common.dialogs');

/**
 * Ensure that the record has the formatted Object ID available.
 * @param {Zarafa.core.data.IPMRecord} record
 */
Zarafa.common.dialogs.ensureRecordObjectId = function(record)
{
	if (!record) {
		return;
	}

	var objectIdText = record.get('x_midtext');
	if (!objectIdText) {
		objectIdText = Zarafa.core.EntryId.formatObjectId(record.get('entryid'));
		if (objectIdText && record.get('x_midtext') !== objectIdText) {
			record.set('x_midtext', objectIdText);
		}
	}
};

/**
 * @class Zarafa.common.dialogs.RecordPropertiesPanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.recordpropertiespanel
 *
 * Generic panel for showing the Object ID of a record.
 */
Zarafa.common.dialogs.RecordPropertiesPanel = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'zarafa.recordpropertiespanel',
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

		Zarafa.common.dialogs.RecordPropertiesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the panel with the given record.
	 * @param {Zarafa.core.data.IPMRecord} record
	 */
	update: function(record)
	{
		this.record = record;

		if (record) {
			Zarafa.common.dialogs.ensureRecordObjectId(record);
			this.getForm().loadRecord(record);
		} else if (this.objectIdField) {
			this.objectIdField.setValue('');
		}
	},

	/**
	 * Update the record with the data from the panel.
	 * @param {Zarafa.core.data.IPMRecord} record
	 */
	updateRecord: function(record)
	{
		this.getForm().updateRecord(record);
	}
});

Ext.reg('zarafa.recordpropertiespanel', Zarafa.common.dialogs.RecordPropertiesPanel);
