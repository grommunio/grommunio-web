Ext.namespace('Grommunio.task.ui');

/**
 * @class Grommunio.task.ui.TaskPreviewPanel
 * @extends Ext.Panel
 * @xtype grommunio.taskpreviewpanel
 *
 * Panel that previews the contents of task.
 */
Grommunio.task.ui.TaskPreviewPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.taskpreviewpanel',
			border: false,
			layout: 'grommunio.collapsible',
			items: [{
				xtype: 'grommunio.messageheader'
			},{
				xtype: 'grommunio.messagebody'
			}]
		});

		Grommunio.task.ui.TaskPreviewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.taskpreviewpanel', Grommunio.task.ui.TaskPreviewPanel);
