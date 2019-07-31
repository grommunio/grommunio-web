Ext.namespace('Zarafa.common.manageCc.dialogs');

/**
 * @class Zarafa.common.manageCc.dialogs.ManageCcEditContentPanel
 * @extends Zarafa.common.recipientfield.ui.EditRecipientContentPanel
 * @xtype zarafa.managecceditcontentpanel
 *
 * Panel will be used to add/edit {@link Zarafa.common.manageCc.data.IPMCcRecipientRecord IPMCcRecipientRecord} address.
 */
Zarafa.common.manageCc.dialogs.ManageCcEditContentPanel = Ext.extend(Zarafa.common.recipientfield.ui.EditRecipientContentPanel, {
	/**
	 * @cfg {Boolean} removeOnCancel Remove the {@link Zarafa.common.manageCc.data.IPMCcRecipientRecord record} from store
	 * while user press "cancel" button.
	 */
	removeOnCancel : true,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.managecceditcontentpanel',
			title : _('Add/Edit Cc recipient')
		});

		Zarafa.common.manageCc.dialogs.ManageCcEditContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk : function()
	{
		var editForm = this.formPanel.getForm();

		if (!editForm.isValid()) {
			return;
		}

		var record = this.record;
		// Update the record as per the form data.
		editForm.updateRecord(record);

		// return if no change is made by the user.
		if (record.dirty === false) {
			this.close();
			return;
		}

		var store = record.store;
		// If email address is already there then show the message box.
		if (store.isRecipientExists(record, this.hasDuplicateRecipient, this)) {
			record.reject();
			Ext.Msg.alert(_('Duplicate recipient'), _('Recipient already exists.'));
			return;
		}

		record.generateOneOffEntryId();
		record.commit();
		this.close();
	},

	/**
	 * Function used to check given recipient is already exists in {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore}
	 *
	 * @param {Zarafa.common.manageCc.data.IPMCcRecipientRecord} record The record exists in {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore}.
	 * @returns {Boolean} true if recipient record already exists in {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore}
	 */
	hasDuplicateRecipient : function(record)
	{
		return record.isOneOff() && !record.dirty && record.get('smtp_address') === this.record.get('smtp_address');
	},

	/**
	 * Function will be called when user clicks on close tool on the {@link Ext.Window}
	 * and should remove phantom record if needed.
	 * @protected
	 */
	closeWrap : function()
	{
		this.removePhantomRecord();
		Zarafa.common.manageCc.dialogs.ManageCcEditContentPanel.superclass.closeWrap.apply(this, arguments);
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 * @private
	 */
	onCancel : function()
	{
		this.removePhantomRecord();
		Zarafa.common.manageCc.dialogs.ManageCcEditContentPanel.superclass.onCancel.call(this);
	},

	/**
	 * Function is used to remove {@link Zarafa.common.manageCc.data.IPMCcRecipientRecord IPMCcRecipientRecord}
	 * from {Zarafa.core.data.IPMRecipientStore} when {@link #removeOnCancel}
	 * is true and user has closed the dialog without saving it.
	 * @private
	 */
	removePhantomRecord : function()
	{
		if (this.removeOnCancel === true && this.record.phantom) {
			this.record.store.remove(this.record);
		}
	}
});

Ext.reg('zarafa.managecceditcontentpanel', Zarafa.common.manageCc.dialogs.ManageCcEditContentPanel);
