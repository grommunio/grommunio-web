Ext.namespace('Zarafa.task.dialogs');

/**
 * @class Zarafa.task.dialogs.TaskOptionsPanel
 * @extends Ext.Panel
 * @xtype zarafa.taskoptionspanel
 */
Zarafa.task.dialogs.TaskOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.taskoptionspanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			defaults: {
				bodyStyle: 'padding-top: 5px; padding-left: 6px; padding-right: 5px; background-color: inherit;',
				border: false
			},
			items: [{
				xtype: 'zarafa.recordpropertiespanel',
				flex: 1
			}]
		});

		Zarafa.task.dialogs.TaskOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.taskoptionspanel', Zarafa.task.dialogs.TaskOptionsPanel);
