Ext.namespace('Zarafa.task.dialogs');

/**
 * @class Zarafa.task.dialogs.SendTaskRequestConfirmationPanel
 * @extends Ext.form.FormPanel
 * @xtype 'zarafa.sendtaskrequestconfirmationpanel'
 */
Zarafa.task.dialogs.SendTaskRequestConfirmationPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {Zarafa.core.mapi.ResponseStatus} responseType The response type value selected by user.
	 */
	responseType : undefined,

	/**
	 * Info string that will be shown for assignee that is going to accept task request.
	 * @property
	 * @type String
	 */
	acceptInfoString : _('This task will be accepted and moved into the Tasks folder. Do you want to edit the response before sending it?'),

	/**
	 * Info string that will be shown for assignee that is going to decline task request.
	 * @property
	 * @type String
	 */
	declineInfoString : _('This task will be declined and moved into the Deleted Items folder. Do you want to edit the response before sending it?'),

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.sendtaskrequestconfirmationpanel',
			cls : 'k-send-taskrequest-confirmation-panel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			hideLabels : true,
			items: [{
				xtype: 'displayfield',
				value : this.getDisplayText(config.responseType),
				autoHeight: true
			},{
				xtype:'radio',
				boxLabel: _('Edit the response before Sending.'),
				name: 'sendtaskconfirmation',
				autoHeight: true,
				listeners : {
					check : this.onEditResponseChecked,
					scope : this
				}
			},{
				xtype: 'textarea',
				name: 'responseText',
				ref: 'responseTextField',
				disabled: true,
				flex: 1
			},{
				xtype:'radio',
				boxLabel: _('Send the response now'),
				name: 'sendtaskconfirmation',
				checked: true,
				autoHeight: true
			}]
		});

		Zarafa.task.dialogs.SendTaskRequestConfirmationPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Checks the {@link Zarafa.core.mapi.ResponseStatus responsetype} and either uses the {@link #acceptInfoString}
	 * or {@link #declineString} for generating the displaytext which should be shown on top of this panel.
	 * @param {Zarafa.core.mapi.ResponseStatus} responseType The response type for which this dialog is shown.
	 * @private
	 */
	getDisplayText : function(responseType)
	{
		switch(responseType)
		{
			case Zarafa.core.mapi.TaskMode.ACCEPT:
				return this.acceptInfoString;
			case Zarafa.core.mapi.TaskMode.DECLINE:
				return this.declineInfoString;
		}
	},

	/**
	 * Event handler for the {@link Ext.form.RadioButton#check check} event, this will
	 * enable/disable the responseTextField accordingly.
	 * @param {Ext.form.RadioButton} rb The radio button which was selected
	 * @param {Boolean} checked True if the radio button was checked
	 * @private
	 */
	onEditResponseChecked : function(rb, checked)
	{
		this.responseTextField.setDisabled(!checked);
	},

	/**
	 * Called by the dialog check the settings from the user and either
	 * send the accept or decline message to the organizer.
	 * @param {Zarafa.core.data.IPMRecord} record The record which is being
	 * accepted or declined.
	 */
	updateRecord : function(record)
	{
		var values = this.getForm().getFieldValues();

		this.editResponse = (values.sendtaskconfirmation[1] !== true);
		record.respondToTaskRequest(this.responseType, values.responseText, this.editResponse);
	}
});

Ext.reg('zarafa.sendtaskrequestconfirmationpanel', Zarafa.task.dialogs.SendTaskRequestConfirmationPanel);
