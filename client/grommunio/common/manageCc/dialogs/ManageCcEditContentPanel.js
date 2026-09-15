Ext.namespace('Grommunio.common.manageCc.dialogs');

/**
 * @class Grommunio.common.manageCc.dialogs.ManageCcEditContentPanel
 * @extends Grommunio.common.recipientfield.ui.EditRecipientContentPanel
 * @xtype grommunio.managecceditcontentpanel
 *
 * Panel will be used to add/edit {@link Grommunio.common.manageCc.data.IPMCcRecipientRecord IPMCcRecipientRecord} address.
 */
Grommunio.common.manageCc.dialogs.ManageCcEditContentPanel = Ext.extend(Grommunio.common.recipientfield.ui.EditRecipientContentPanel, {
	/**
	 * @cfg {Boolean} removeOnCancel Remove the {@link Grommunio.common.manageCc.data.IPMCcRecipientRecord record} from store
	 * while user press "cancel" button.
	 */
	removeOnCancel: true,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.managecceditcontentpanel',
			title: _('Add/Edit Cc recipient')
		});

		Grommunio.common.manageCc.dialogs.ManageCcEditContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk: function()
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
		if (store.isRecipientExists(record)) {
			record.reject();
			Ext.Msg.alert(_('Duplicate recipient'), _('Recipient already exists.'));
			return;
		}

		this.setDialogBusy(true);
		record.store.resolveRecipientByEmailAddress(record, this.onRecipientResolved, this);
	},

	/**
	 * Finalize the save after the typed SMTP address has been checked against the address book.
	 *
	 * @param {Grommunio.core.data.IPMRecipientRecord} record The recipient being saved.
	 * @private
	 */
	onRecipientResolved: function(record)
	{
		this.setDialogBusy(false);

		if (!record) {
			return;
		}

		if (record.store.isRecipientExists(record)) {
			record.reject();
			Ext.Msg.alert(_('Duplicate recipient'), _('Recipient already exists.'));
			return;
		}

		if (!record.isResolved() || record.isOneOff()) {
			record.generateOneOffEntryId();
		}
		record.commit();
		this.close();
	},

	/**
	 * Toggle a temporary busy state while checking if the recipient exists in the address book.
	 *
	 * @param {Boolean} busy True to disable dialog interaction, false otherwise.
	 * @private
	 */
	setDialogBusy: function(busy)
	{
		if (this.formPanel && this.formPanel.el) {
			this.formPanel.el[busy ? 'mask' : 'unmask'](_('Resolving recipient') + '...');
		}

		Ext.each(this.formPanel.buttons || [], function(button) {
			button.setDisabled(busy);
		});
	},
	/**
	 * Function will be called when user clicks on close tool on the {@link Ext.Window}
	 * and should remove phantom record if needed.
	 * @protected
	 */
	closeWrap: function()
	{
		this.removePhantomRecord();
		Grommunio.common.manageCc.dialogs.ManageCcEditContentPanel.superclass.closeWrap.apply(this, arguments);
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 * @private
	 */
	onCancel: function()
	{
		this.removePhantomRecord();
		Grommunio.common.manageCc.dialogs.ManageCcEditContentPanel.superclass.onCancel.call(this);
	},

	/**
	 * Function is used to remove {@link Grommunio.common.manageCc.data.IPMCcRecipientRecord IPMCcRecipientRecord}
	 * from {Grommunio.core.data.IPMRecipientStore} when {@link #removeOnCancel}
	 * is true and user has closed the dialog without saving it.
	 * @private
	 */
	removePhantomRecord: function()
	{
		if (this.removeOnCancel === true && this.record.phantom) {
			this.record.store.remove(this.record);
		}
	}
});

Ext.reg('grommunio.managecceditcontentpanel', Grommunio.common.manageCc.dialogs.ManageCcEditContentPanel);
