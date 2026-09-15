Ext.namespace('Grommunio.task.dialogs');

/**
 * @class Grommunio.task.dialogs.TaskOptionsPanel
 * @extends Ext.Panel
 * @xtype grommunio.taskoptionspanel
 */
Grommunio.task.dialogs.TaskOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'grommunio.taskoptionspanel',
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
				xtype: 'grommunio.recordpropertiespanel',
				flex: 1
			}]
		});

		Grommunio.task.dialogs.TaskOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.taskoptionspanel', Grommunio.task.dialogs.TaskOptionsPanel);
