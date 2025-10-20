Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailOptionsMiscPanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.mailoptionsmiscpanel
 *
 * Panel for users to set miscellaneous options on a given {@link Zarafa.mail.MailRecord record},
 * like the categories.
 */
var ensureRecordObjectId = function(record)
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

Zarafa.mail.dialogs.MailOptionsMiscPanel = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.mailoptionsmiscpanel',
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

		Zarafa.mail.dialogs.MailOptionsMiscPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		this.record = record;

		if (record) {
			ensureRecordObjectId(record);
			this.getForm().loadRecord(record);
		} else {
			this.headersTextArea.setValue('');
		}
	},

	/**
	 * Update the {@link Zarafa.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord: function(record)
	{
		this.getForm().updateRecord(record);
	}
});

/* A reduced MiscPanel for Draft messages where PR_TRANSPORT_HEADERS does not make sense */
Zarafa.mail.dialogs.MailOptionsMsgidPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.mailoptionsmiscpanel',
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

		Zarafa.mail.dialogs.MailOptionsMsgidPanel.superclass.constructor.call(this, config);
	},

	update: function(record, contentReset)
	{
		this.record = record;

		if (record) {
			ensureRecordObjectId(record);
			this.getForm().loadRecord(record);
		} else {
			var objectIdField = this.getForm().findField('x_midtext');
			if (objectIdField) {
				objectIdField.setValue('');
			}
		}
	},

	/**
	 * Update the {@link Zarafa.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord: function(record)
	{
		this.getForm().updateRecord(record);
	}
});

Ext.reg('zarafa.mailoptionsmiscpanel', Zarafa.mail.dialogs.MailOptionsMiscPanel);
Ext.reg('zarafa.mailoptionsmsgidpanel', Zarafa.mail.dialogs.MailOptionsMsgidPanel);
