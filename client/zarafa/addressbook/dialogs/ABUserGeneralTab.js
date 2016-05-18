Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABUserGeneralTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.abusergeneraltab
 *
 * This class is used to create layout of general tab in tab panel.
 */
Zarafa.addressbook.dialogs.ABUserGeneralTab = Ext.extend(Ext.form.FormPanel, {

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
			xtype : 'zarafa.abusergeneraltab',
			title : _('General'),
			layout: 'column',
			autoScroll : true,
			items : [
				this.createNameFieldset(),
				this.createAddressFieldset(),
				this.createOfficeFieldset()
			]
		});

		Zarafa.addressbook.dialogs.ABUserGeneralTab.superclass.constructor.call(this, config);
	},

	/**
	 * Creates fieldset for general tab of tab panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createNameFieldset : function()
	{
		return {
			xtype : 'fieldset',
			columnWidth	: 1,
			border : true,
			cls	 : 'zarafa-fieldset',
			title : _('Name'),
			layout : 'column',
			anchor :'100%',
			items : [{//1st column
				xtype : 'container',
				layout : 'form',
				columnWidth : 0.50,
				border : false,
				items : [{
					xtype: 'container',
					layout : 'column',
					anchor :'100%',
					border: false,
					defaults : {
						anchor :'100%',
						readOnly : true
					},
					items : [{
						columnWidth	: 0.7,
						xtype : 'textfield',
						fieldLabel : _('First'),
						name : 'given_name',
						plugins : [{
							ptype : 'zarafa.fieldlabeler'
						}]
					},{
						xtype : 'spacer',
						width : 6,
						height : 3
					},{
						xtype : 'textfield',
						columnWidth	: 0.3,
						labelWidth : 50,
						fieldLabel : _('Initial'),
						name : 'initials',
						plugins : [{
							ptype : 'zarafa.fieldlabeler'
						}]
					}]
				},{
					xtype: 'container',
					layout : 'column',
					anchor :'100%',
					border: false,
					items: [{
						xtype : 'textfield',
						columnWidth : 0.7,
						readOnly : true,
						style: 'margin-top: 3px;',
						fieldLabel :_('Display'),
						plugins : [{
							ptype : 'zarafa.fieldlabeler'
						}],
						name : 'display_name'
					},{
						// Add the same spacer as 1 row above.
						// This forces the 'Display' and 'First'
						// textfields to become equal size.
						xtype: 'spacer',
						width: 6,
						height: 3
					}]
				}]
			},{//2nd column
				xtype : 'container',
				layout : 'form',
				cls: 'zarafa-fieldset-second',
				columnWidth : 0.50,
				border : false,
				defaults : {
					anchor :'100%',
					readOnly : true
				},
				items : [{
					xtype : 'textfield',
					fieldLabel : _('Last'),
					name : 'surname'
				},{
					xtype : 'textfield',
					fieldLabel : _('Alias'),
					name : 'account'
				}]
			}]
		};
	},

	/**
	 * Creates fieldset for general tab of tab panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createAddressFieldset : function()
	{
		return {
			xtype : 'fieldset',
			cls	 : 'zarafa-fieldset',
			defaultType	: 'textfield',
			border : false,
			columnWidth	: 0.5,
			defaults : {
				anchor	:'100%',
				readOnly: true
			},
			items : [{
				xtype : 'textarea',
				fieldLabel : _('Address'),
				name : 'street_address',
				height : '40px'
			},{
				fieldLabel : _('City'),
				name : 'locality'
			},{
				fieldLabel : _('State'),
				name : 'state_or_province'
			},{
				fieldLabel : _('Zip Code'),
				name : 'postal_code'
			},{
				fieldLabel : _('Country'),
				name : 'country'
			}]
		};
	},

	/**
	 * Creates fieldset for general tab of tab panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createOfficeFieldset : function()
	{
		return {
			xtype : 'fieldset',
			cls	 : 'zarafa-fieldset-second',
			defaultType	: 'textfield',
			border : false,
			columnWidth	: 0.5,
			defaults : {
				anchor : '100%',
				readOnly : true
			},
			items : [{
				fieldLabel : _('Title'),
				name : 'title'
			},{
				fieldLabel : _('Company'),
				name : 'company_name'
			},{
				fieldLabel : _('Department'),
				name : 'department_name'
			},{
				fieldLabel : _('Office'),
				name : 'office_location'
			},{
				fieldLabel : _('Assistant'),
				name : 'assistant'
			},{
				fieldLabel : _('Phone'),
				name : 'business_telephone_number'
			}]
		};
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
		if(Ext.isEmpty(record)) {
			return;
		}

		this.getForm().loadRecord(record);
	}
});

Ext.reg('zarafa.abusergeneraltab', Zarafa.addressbook.dialogs.ABUserGeneralTab);
