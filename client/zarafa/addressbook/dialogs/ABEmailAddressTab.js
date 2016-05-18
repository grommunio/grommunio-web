Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABEmailAddressTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.abemailaddresstab
 *
 * This class is used to create layout of email address tab panel.
 */
Zarafa.addressbook.dialogs.ABEmailAddressTab = Ext.extend(Ext.form.FormPanel, {
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
			xtype : 'zarafa.abemailaddresstab',
			title : _('E-mail Addresses'),
			layout: {
				type: 'vbox',
				pack  : 'start',
				align: 'stretch'
			},
			items : [{
				xtype : 'displayfield',
				value : _('E-mail addresses') + ':',
				hideLabel : true
			},{
				xtype : 'panel',
				flex: 1,
				items : [{
					xtype: 'listview',
					// initialize a dummy store
					store: new Ext.data.Store(),
					ref: '../emailList',
					hideHeaders : true,
					singleSelect: false,
					anchor: '100% 100%',
					columns: [{
						dataIndex: 'address',
						tpl : '{address:htmlEncode}'
					}]
				}]
			}]
		});
		
		Zarafa.addressbook.dialogs.ABEmailAddressTab.superclass.constructor.call(this, config);
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

		var proxyAddressSubStore = record.getSubStore('ems_ab_proxy_addresses');
		if (proxyAddressSubStore && this.emailList.getStore() !== proxyAddressSubStore) { 
			this.emailList.bindStore(proxyAddressSubStore);
		}
	}
});

Ext.reg('zarafa.abemailaddresstab', Zarafa.addressbook.dialogs.ABEmailAddressTab);
