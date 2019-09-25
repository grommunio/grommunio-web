Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABGroupContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.abgroupdetailcontentpanel
 *
 * This class will be used to create a content panel for showing userGroups/Company,
 */
Zarafa.addressbook.dialogs.ABGroupDetailContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype	: 'zarafa.abgroupdetailcontentpanel',
			layout	: 'fit',
			border	: false,
			title : _('Group details'),
			items: [{
				xtype: 'zarafa.abgroupdetailpanel'
			}]
		});

		Zarafa.addressbook.dialogs.ABGroupDetailContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.updateTitleFromRecord(this.record);
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

// register content panel
Ext.reg('zarafa.abgroupdetailcontentpanel', Zarafa.addressbook.dialogs.ABGroupDetailContentPanel);
