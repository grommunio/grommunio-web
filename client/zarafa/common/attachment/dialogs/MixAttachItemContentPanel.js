Ext.namespace('Zarafa.common.attachment.dialogs');

/**
 * @class Zarafa.common.attachment.dialogs.MixAttachItemContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.mixattachitemcontentpanel
 *
 * This content panel will be used to show a warning when user tries to download attachments of webapp
 * item containing embedded attachments as well.
 */
Zarafa.common.attachment.dialogs.MixAttachItemContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.mixattachitemcontentpanel',
			layout: 'fit',
			title : _('Download as ZIP'),
			width : 400,
			height: 250,
			items: [{
				xtype: 'zarafa.mixattachitempanel',
				records: config.record,
				ref: 'mixAttachItemPanel',
				buttons: [{
					text: _('Continue'),
					handler: this.onContinue.createDelegate(this, [ config.downloadItem ], 1),
					scope: this
				},{
					text: _('Cancel'),
					ref : '../../dialogCancelButton',
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Zarafa.common.attachment.dialogs.MixAttachItemContentPanel.superclass.constructor.call(this, config);

		// Register the check event to enable/disable 'Cancel' button
		this.mon(this.dontShowCheckBox, 'check', this.onDontShowCheck, this);
	},

	/**
	 * Event handler which is raised when the user clicks the "Continue" {@link Ext.Button button}
	 * This will go for making request to download attachments as ZIP, excluding embedded attachments
	 * and will close the panel.
	 * @param {Ext.Button} button Button which is clicked
	 * @param {Function} downloadItemFn The function to be called to make request to download attachments as ZIP.
	 * @private
	 */
	onContinue : function(button, downloadItemFn)
	{
		if (Ext.isEmpty(this.record)) {
			this.close();
			return;
		}
		this.saveState();
		downloadItemFn.call();

		this.close();
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 *
	 * This will close the panel without saving
	 * @private
	 */
	onCancel : function()
	{
		this.close();
	},

	/**
	 * Handler function that will be called when user checks/unchecks checkbox of don't show this message again,
	 * @param {Ext.form.Checkbox} checkBox checkbox for don't show this messsage again.
	 * @param {Boolean} checked current state of the checkbox.
	 * @private
	 */
	onDontShowCheck : function(checkBox, checked)
	{
		this.dialogCancelButton.setDisabled(checked);
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState : function()
	{
		var state = Zarafa.common.attachment.dialogs.MixAttachItemContentPanel.superclass.getState.call(this) || {};
		var checkboxValue = this.dontShowCheckBox.getValue();
		return Ext.apply(state, {
			dontshowagain : checkboxValue
		});
	}
});

Ext.reg('zarafa.mixattachitemcontentpanel', Zarafa.common.attachment.dialogs.MixAttachItemContentPanel);