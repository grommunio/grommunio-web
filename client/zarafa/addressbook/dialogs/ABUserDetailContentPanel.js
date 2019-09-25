Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABUserDetailContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.zarafa.abuserdetailcontentpanel
 */
Zarafa.addressbook.dialogs.ABUserDetailContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {

	/**
 	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype	: 'zarafa.abuserdetailcontentpanel',
			layout	: 'fit',
			border  : false,
			// Override from Zarafa.core.ui.RecordContentPanel
			title : _('User details'),
			items	: [{
				xtype		: 'zarafa.abuserdetailpanel'
			}]
		});

		Zarafa.addressbook.dialogs.ABUserDetailContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.updateTitleFromRecord(this.record);
		if(contentReset){
			this.updateIconFromRecord(this.record);
		}
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
		if(!Ext.isEmpty(display_name)){
			this.setTitle(display_name);
		} else {
			this.setTitle(this.initialConfig.title);
		}
	}
});

Ext.reg('zarafa.abuserdetailcontentpanel', Zarafa.addressbook.dialogs.ABUserDetailContentPanel);
