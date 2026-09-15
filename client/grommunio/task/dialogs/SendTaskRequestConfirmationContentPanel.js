Ext.namespace('Grommunio.task.dialogs');

/**
 * @class Grommunio.task.dialogs.SendTaskRequestConfirmationContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.sendtaskrequestconfirmcontentpanel
 */
Grommunio.task.dialogs.SendTaskRequestConfirmationContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg {Grommunio.core.ui.IPMRecord} record The record for which the
	 * send task request confirmation content panel is opened.
	 */
	record: undefined,

	/**
	 * @cfg {Grommunio.core.mapi.ResponseStatus} responseType The response type value selected by user.
	 */
	responseType: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var title = _('Accepting Task');
		if (config.responseType === Grommunio.core.mapi.TaskMode.DECLINE) {
			title = _('Declining Task');
		}
		config = Ext.applyIf(config, {
			xtype: 'grommunio.sendtaskrequestconfirmcontentpanel',
			layout: 'fit',
			title: title,
			modal: true,
			width: 350,
			height: 250,
			items: [{
				xtype: 'grommunio.sendtaskrequestconfirmationpanel',
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

		Grommunio.task.dialogs.SendTaskRequestConfirmationContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk: function()
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
	onCancel: function()
	{
		this.close();
	}
});

Ext.reg('grommunio.sendtaskrequestconfirmcontentpanel', Grommunio.task.dialogs.SendTaskRequestConfirmationContentPanel);
