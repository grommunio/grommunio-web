Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailOptionsTrackingPanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.mailoptionstrackingpanel
 *
 * Panel for users to set tracking options on a given {@link Zarafa.mail.MailRecord record},
 * like read receipts.
 */
Zarafa.mail.dialogs.MailOptionsTrackingPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * The record on which this panel is operating on. This record is provided through the
	 * {@link #update} function.
	 * @property
	 * @type Zarafa.core.data.IPMRecord
	 */
	record : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype : 'zarafa.mailoptionstrackingpanel',
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

		Zarafa.mail.dialogs.MailOptionsTrackingPanel.superclass.constructor.call(this, config);
	},

	 /**
	  * A function called when the checked value changes for the checkbox.
	  * @param {Ext.form.Checkbox} checkbox The Checkbox being toggled.
	  * @param {Boolean} checked The new checked state of the checkbox.
	  * @private
	  */
	onFieldToggle : function(checkbox, checked)
	{
		this.record.set(checkbox.getName(), checked);
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
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
	 * Update the {@link Zarafa.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord : function(record)
	{
		this.getForm().updateRecord(record);
	}
});

Ext.reg('zarafa.mailoptionstrackingpanel', Zarafa.mail.dialogs.MailOptionsTrackingPanel);
