Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABMemberOfTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.abmemberoftab
 *
 * This class is used to create layout of MemberOf tab panel.
 */
Zarafa.addressbook.dialogs.ABMemberOfTab = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype : 'zarafa.abmemberoftab',
			title : _('Member Of'),
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items : [{
				xtype : 'displayfield',
				value : _('Group Membership') + ':',
				hideLabel : true
			},{
				xtype : 'zarafa.abitemgrid',
				ref : 'memberOfList',
				flex: 1
			}]
		});

		Zarafa.addressbook.dialogs.ABMemberOfTab.superclass.constructor.call(this, config);
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.MAPIRecord record} is received
	 * @param {Zarafa.core.data.MAPIRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update : function(record, contentReset)
	{
		this.getForm().loadRecord(record);
		var memberOfSubStore = record.getSubStore('ems_ab_is_member_of_dl');
		if (memberOfSubStore && this.memberOfList.getStore() !== memberOfSubStore) {
			this.memberOfList.reconfigure(memberOfSubStore, this.memberOfList.getColumnModel());
		}
	}
});

Ext.reg('zarafa.abmemberoftab', Zarafa.addressbook.dialogs.ABMemberOfTab);
