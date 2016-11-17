Ext.namespace('Zarafa.common.sendas.dialogs');

/**
 * @class Zarafa.common.sendas.dialogs.SendAsEditContentPanel
 * @extends Zarafa.common.recipientfield.ui.EditRecipientContentPanel
 * @xtype zarafa.sendaseditcontentpanel
 *
 * {@link Zarafa.common.sendas.dialogs.SendAsEditContentPanel SendAsEditContentPanel} will be used to edit sendas addresses.
 */
Zarafa.common.sendas.dialogs.SendAsEditContentPanel = Ext.extend(Zarafa.common.recipientfield.ui.EditRecipientContentPanel, {
	/**
	 * @cfg {Boolean} removeOnCancel Remove the {@link Zarafa.core.data.IPMRecipientRecord record} from store 
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
			xtype : 'zarafa.sendaseditcontentpanel',
			title : _('Add/Edit sender')
		});

		Zarafa.common.sendas.dialogs.SendAsEditContentPanel.superclass.constructor.call(this, config);
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

		editForm.updateRecord(this.record);
		this.record.generateOneOffEntryId();
		this.close();
	},

	/**
	 * Function will be called when user clicks on close tool on the {@link Ext.Window}
	 * and should remove phantom record if needed.
	 * @protected
	 */
	closeWrap : function()
	{
		this.removePhantomRecord();
		Zarafa.common.sendas.dialogs.SendAsEditContentPanel.superclass.closeWrap.apply(this, arguments);
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 * @private
	 */
	onCancel : function()
	{
		this.removePhantomRecord();
		Zarafa.common.sendas.dialogs.SendAsEditContentPanel.superclass.onCancel.call(this);
	},

	/**
	 * Function is used to remove {@link Zarafa.core.data.IPMRecipientRecord SendAsRecipient}
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

Ext.reg('zarafa.sendaseditcontentpanel', Zarafa.common.sendas.dialogs.SendAsEditContentPanel);
