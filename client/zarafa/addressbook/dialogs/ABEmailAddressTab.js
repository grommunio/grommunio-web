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
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'zarafa.abemailaddresstab',
			title: _('Email Addresses'),
			bodyStyle: 'padding: 5px;',
			layout: {
				type: 'vbox',
				pack: 'start',
				align: 'stretch'
			},
			items: [{
				xtype: 'fieldset',
				title: _('Email addresses'),
				border: true,
				cls: 'zarafa-fieldset',
				flex: 1,
				layout: 'fit',
				items: [{
					xtype: 'grid',
					ref: '../emailList',
					store: new Ext.data.JsonStore({
						fields: ['address'],
						root: 'item'
					}),
					border: true,
					hideHeaders: false,
					columns: [{
						header: _('Email Address'),
						dataIndex: 'address',
						sortable: true,
						renderer: function(value) {
							if (value && value.indexOf(':') !== -1) {
								return Ext.util.Format.htmlEncode(value.substring(value.indexOf(':') + 1));
							}
							return Ext.util.Format.htmlEncode(value || '');
						}
					}],
					viewConfig: {
						forceFit: true
					}
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
	update: function(record, contentReset)
	{
		this.getForm().loadRecord(record);

		var proxyAddressSubStore = record.getSubStore('ems_ab_proxy_addresses');
		if (proxyAddressSubStore && this.emailList.getStore() !== proxyAddressSubStore) {
			this.emailList.reconfigure(proxyAddressSubStore, this.emailList.getColumnModel());
		}
	}
});

Ext.reg('zarafa.abemailaddresstab', Zarafa.addressbook.dialogs.ABEmailAddressTab);
