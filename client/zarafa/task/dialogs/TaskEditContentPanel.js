Ext.namespace('Zarafa.task.dialogs');

/**
 * @class Zarafa.task.dialogs.TaskEditContentPanel
 * @extends Zarafa.core.ui.MessageContentPanel
 * @xtype zarafa.taskeditcontentpanel
 *
 * this class will be used to create a task edit content panel
 */
Zarafa.task.dialogs.TaskEditContentPanel = Ext.extend(Zarafa.core.ui.MessageContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			layout : 'fit',
			xtype : 'zarafa.taskeditcontentpanel',
			closeOnSave : true,
			title : _('Task'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			confirmClose : true,
			items :[{
				xtype : 'zarafa.taskpanel',
				tbar : {
					xtype: 'zarafa.tasktoolbar'
				}
			}]
		});

		Zarafa.task.dialogs.TaskEditContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if(contentReset){
			this.updateIconFromRecord(record);
		}
		this.updateTitleFromRecord(record);
	},

	/**
	 * Update this panel's icon class from the record that it contains
	 * First obtains the icon class from a mapping, then calls {@link #setIcon}
	 * 
	 * @param {Zarafa.core.data.MAPIRecord} record The record bound to this component
	 * @private
	 */
	updateIconFromRecord : function(record)
	{
		//TODO: create a new icon mapping for tabs
		var iconCls = Zarafa.common.ui.IconClass.getIconClass(record);
		this.setIcon(iconCls);
	},

	/**
	 * When record has been updated, title also has to be - for instance if we have the subject 
	 * in the title and the subject changes
	 * Calls {@link #setTitle} this.setTitle in order to update
	 * @param {Zarafa.core.data.MAPIRecord} record The record that has been updated
	 */
	updateTitleFromRecord : function(record)
	{
		var subject = record.get('subject');
		if(!Ext.isEmpty(subject)){
			this.setTitle(subject);
		} else {
			this.setTitle(this.initialConfig.title);
		}
	},

	/**
	 * Save all changes made to the {@link #record} and send 
	 * the message to the specified recipients.
	 */
	sendRecord : function()
	{
		// we don't support sending task requests yet
		return;
	}
});

// register dialog
Ext.reg('zarafa.taskeditcontentpanel', Zarafa.task.dialogs.TaskEditContentPanel);
