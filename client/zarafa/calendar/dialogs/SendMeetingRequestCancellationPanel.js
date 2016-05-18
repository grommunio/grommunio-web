Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.SendMeetingRequestCancellationPanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.sendmeetingrequestcancellationpanel
 */
Zarafa.calendar.dialogs.SendMeetingRequestCancellationPanel = Ext.extend(Ext.form.FormPanel, {

	/**
	 * Info string that will be shown for organizer which is going to cancel the meeting request.
	 * @property
	 * @type String
	 */
	cancellationInfoString : _('This meeting will be cancelled. Do you want to include comments with your cancellation?'),

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.sendmeetingrequestcancellationpanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			hideLabels : true,
			items: [{
				xtype: 'displayfield',
				value : this.cancellationInfoString,
				autoHeight: true,
				style: 'padding-bottom: 10px;'
			},{
				xtype:'radio',
				boxLabel: _('Edit the cancellation before Sending.'),
				name: 'sendmrcancellation',
				autoHeight: true,
				listeners : {
					check : this.onEditCancellationChecked,
					scope : this
				}
			},{
				xtype: 'textarea',
				name: 'cancellationText',
				ref: 'cancellationTextField',
				disabled: true,
				flex: 1
			},{
				xtype:'radio',
				boxLabel: _('Send the cancellation now.'),
				checked: true,
				name: 'sendmrcancellation',
				autoHeight: true
			}]
		});

		Zarafa.calendar.dialogs.SendMeetingRequestCancellationPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the {@link Ext.form.RadioButton#check check} event, this will
	 * enable/disable the cancellationTextField accordingly.
	 * @param {Ext.form.RadioButton} rb The radio button which was selected
	 * @param {Boolean} checked True if the radio button was checked
	 * @private
	 */
	onEditCancellationChecked : function(rb, checked)
	{
		this.cancellationTextField.setDisabled(!checked);
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

		record.cancelInvitation(values.cancellationText);
	},

	/**
	 * Called when the panel is being resized. This will call {@link #doLayout} to update
	 * the heights of all fields inside the panel.
	 * @private
	 */
	onResize : function()
	{
		Zarafa.calendar.dialogs.SendMeetingRequestCancellationPanel.superclass.onResize.apply(this, arguments);
		this.doLayout();
	}
});

Ext.reg('zarafa.sendmeetingrequestcancellationpanel', Zarafa.calendar.dialogs.SendMeetingRequestCancellationPanel);
