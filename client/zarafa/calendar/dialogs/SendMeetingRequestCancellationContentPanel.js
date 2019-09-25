Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.SendMeetingRequestCancellationContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.sendmeetingrequestcancellationcontentpanel
 */
Zarafa.calendar.dialogs.SendMeetingRequestCancellationContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.core.ui.IPMRecord} record The record for which the
	 * cancellation content panel is opened.
	 */
	record : undefined,

	/**
	 * @cfg {Boolean} autoSave Automatically save all changes on the
	 * {@link Zarafa.core.data.IPMRecord IPMRecord} to the
	 * {@link Zarafa.core.data.IPMStore IPMStore}.
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.sendmeetingrequestcancellationcontentpanel',
			layout: 'fit',
			title: _('Send Meeting Request Cancellation'),
			modal : true,
			width: 350,
			height: 250,
			items: [{
				xtype: 'zarafa.sendmeetingrequestcancellationpanel',
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

		Zarafa.calendar.dialogs.SendMeetingRequestCancellationContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk : function()
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
	onCancel : function()
	{
		this.close();
	}
});

Ext.reg('zarafa.sendmeetingrequestcancellationcontentpanel', Zarafa.calendar.dialogs.SendMeetingRequestCancellationContentPanel);
