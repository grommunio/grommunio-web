Ext.namespace('Zarafa.task.dialogs');

/**
 * @class Zarafa.task.dialogs.TaskPanel
 * @extends Ext.Panel
 * @xtype zarafa.taskpanel
 *
 * This class is used as wrapper class for all tabs, individual tab will have its own class,
 * extra tabs can be added using insertion point in this dialog.
 */
Zarafa.task.dialogs.TaskPanel = Ext.extend(Ext.Panel, {
	// Insertion points for this class
	/**
	 * @insert context.task.taskeditcontent.tabs
	 * can be used to add extra tabs to taskeditcontentpanel by 3rd party plugins
	 * @param {Zarafa.task.dialogs.TaskPanel} panel This panel 
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype : 'zarafa.taskpanel',
			bodyStyle: 'background-color: inherit;',
			border : false,
			layout : 'fit',
			items: this.createTabPanel()
		});

		Zarafa.task.dialogs.TaskPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize {@link Ext.TabPanel tabpanel) that will contain all the fields and forms
	 * @return {Object} Configuration object for the form panel
	 * @private
	 */
	createTabPanel : function()
	{
		return [{
			xtype : 'tabpanel',
			activeTab : 0,
			border : false,
			defaults: {
				bodyStyle: 'background-color: inherit; padding: 5px;'
			},
			items : [{
				xtype : 'zarafa.taskgeneraltab'
			},{
				xtype : 'zarafa.taskdetailtab'
			},
			container.populateInsertionPoint('context.task.taskcontentpanel.tabs', this)
			]
		}];
	}
});

Ext.reg('zarafa.taskpanel', Zarafa.task.dialogs.TaskPanel);
