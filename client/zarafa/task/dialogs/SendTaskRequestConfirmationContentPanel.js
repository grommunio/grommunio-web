Ext.namespace('Zarafa.task.dialogs');

/**
 * @class Zarafa.task.dialogs.SendTaskRequestConfirmationContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.sendtaskrequestconfirmcontentpanel
 */
Zarafa.task.dialogs.SendTaskRequestConfirmationContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.core.ui.IPMRecord} record The record for which the
	 * send task request confirmation content panel is opened.
	 */
	record : undefined,

	/**
	 * @cfg {Zarafa.core.mapi.ResponseStatus} responseType The response type value selected by user.
	 */
	responseType : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var title = _('Accepting Task');
		if (config.responseType === Zarafa.core.mapi.TaskMode.DECLINE) {
			title = _('Declining Task');
		}
		config = Ext.applyIf(config, {
			xtype : 'zarafa.sendtaskrequestconfirmcontentpanel',
			layout: 'fit',
			title : title,
			modal : true,
			width: 350,
			height: 250,
			items: [{
				xtype: 'zarafa.sendtaskrequestconfirmationpanel',
				record: config.record,
				responseType: config.responseType,
				ref: 'sendTaskConfirmationPanel',
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

		Zarafa.task.dialogs.SendTaskRequestConfirmationContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk : function()
	{
		this.sendTaskConfirmationPanel.updateRecord(this.record);
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

Ext.reg('zarafa.sendtaskrequestconfirmcontentpanel', Zarafa.task.dialogs.SendTaskRequestConfirmationContentPanel);
