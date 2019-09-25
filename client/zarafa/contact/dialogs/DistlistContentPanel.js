Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.DistlistContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.distlistcontentpanel
 *
 * this class will be used to create a distlist contentpanel
 */
Zarafa.contact.dialogs.DistlistContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			layout : 'fit',
			xtype : 'zarafa.distlistcontentpanel',
			title : _('Distribution List'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			confirmClose : true,
			closeOnSave : true,
			items : [ this.createPanel() ]
		});

		Zarafa.contact.dialogs.DistlistContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Add the main Window Panel to the dialog.
	 * This will contain a {@link Zarafa.core.ui.ContentPanelToolbar ContentPanelToolbar}
	 * and a {@link Zarafa.contact.dialogs.DistListPanel DistListPanel}.
	 * @return {Object} configuration object for the panel.
	 * @private
	 */
	createPanel : function()
	{
		// Create a new panel and add it.
		return {
			xtype : 'zarafa.distlistpanel',
			tbar : {
				xtype: 'zarafa.distlistcontentpaneltoolbar'
			}
		};
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
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
		var display_name = record.get('display_name');
		if(!Ext.isEmpty(display_name)) {
			this.setTitle(display_name);
		} else {
			this.setTitle(this.initialConfig.title);
		}
	}
});

// register panel
Ext.reg('zarafa.distlistcontentpanel', Zarafa.contact.dialogs.DistlistContentPanel);
