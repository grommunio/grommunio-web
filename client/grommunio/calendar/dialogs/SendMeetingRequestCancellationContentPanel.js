Ext.namespace('Grommunio.calendar.dialogs');

/**
 * @class Grommunio.calendar.dialogs.SendMeetingRequestCancellationContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.sendmeetingrequestcancellationcontentpanel
 */
Grommunio.calendar.dialogs.SendMeetingRequestCancellationContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg {Grommunio.core.ui.IPMRecord} record The record for which the
	 * cancellation content panel is opened.
	 */
	record: undefined,

	/**
	 * @cfg {Boolean} autoSave Automatically save all changes on the
	 * {@link Grommunio.core.data.IPMRecord IPMRecord} to the
	 * {@link Grommunio.core.data.IPMStore IPMStore}.
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.sendmeetingrequestcancellationcontentpanel',
			layout: 'fit',
			title: _('Send Meeting Request Cancellation'),
			modal: true,
			width: 350,
			height: 250,
			items: [{
				xtype: 'grommunio.sendmeetingrequestcancellationpanel',
				record: config.record,
				ref: 'sendMRCancellationPanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Grommunio.calendar.dialogs.SendMeetingRequestCancellationContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk: function()
	{
		this.sendMRCancellationPanel.updateRecord(this.record);
		this.close();
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 *
	 * This will close the panel.
	 * @private
	 */
	onCancel: function()
	{
		this.close();
	}
});

Ext.reg('grommunio.sendmeetingrequestcancellationcontentpanel', Grommunio.calendar.dialogs.SendMeetingRequestCancellationContentPanel);
