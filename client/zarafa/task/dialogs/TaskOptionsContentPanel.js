Ext.namespace('Zarafa.task.dialogs');

/**
 * @class Zarafa.task.dialogs.TaskOptionsContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.taskoptionscontentpanel
 */
Zarafa.task.dialogs.TaskOptionsContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.taskoptionscontentpanel',
			layout: 'fit',
			title: _('Message Options'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: config.modal ? false : true,
			width: 360,
			height: 220,
			items: [{
				xtype: 'zarafa.taskoptionspanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				}]
			}]
		});

		Zarafa.task.dialogs.TaskOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.taskoptionscontentpanel', Zarafa.task.dialogs.TaskOptionsContentPanel);
