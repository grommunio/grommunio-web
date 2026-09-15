Ext.namespace('Grommunio.addressbook.dialogs');

/**
 * @class Grommunio.addressbook.dialogs.ABUserDetailContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.grommunio.abuserdetailcontentpanel
 */
Grommunio.addressbook.dialogs.ABUserDetailContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype	: 'grommunio.abuserdetailcontentpanel',
			layout	: 'fit',
			border  : false,
			// Override from Grommunio.core.ui.RecordContentPanel
			title : _('User details'),
			items	: [{
				xtype		: 'grommunio.abuserdetailpanel'
			}]
		});

		Grommunio.addressbook.dialogs.ABUserDetailContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Grommunio.core.data.IPMRecord IPMRecord}
	 * @param {Grommunio.core.data.IPMRecord} record The record to update the panel with
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
	 * @param {Grommunio.core.data.MAPIRecord} record The record bound to this component
	 * @private
	 */
	updateIconFromRecord : function(record)
	{
		//TODO: create a new icon mapping for tabs
		var iconCls = Grommunio.common.ui.IconClass.getIconClass(record);
		this.setIcon(iconCls);
	},

	/**
	 * When record has been updated, title also has to be - for instance if we have the subject
	 * in the title and the subject changes
	 * Calls {@link #setTitle} this.setTitle in order to update
	 * @param {Grommunio.core.data.MAPIRecord} record The record that has been updated
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

Ext.reg('grommunio.abuserdetailcontentpanel', Grommunio.addressbook.dialogs.ABUserDetailContentPanel);
