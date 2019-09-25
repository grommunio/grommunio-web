Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABUserPhoneTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.abuserphonetab
 *
 * This class is used to create layout of phone tab of tab panel.
 */
Zarafa.addressbook.dialogs.ABUserPhoneTab = Ext.extend(Ext.form.FormPanel, {

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
			xtype : 'zarafa.abuserphonetab',
			title : _('Phone'),
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			autoScroll : true,
			items : [
				this.createPhonenumberFieldset(),
				this.createNoteFieldset()
			]
		});
		
		Zarafa.addressbook.dialogs.ABUserPhoneTab.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the Phonenumber fieldset for phone tab 
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createPhonenumberFieldset : function()
	{
		return {
			xtype : 'fieldset',
			title : _('Phone numbers'),
			border : true,
			cls : 'zarafa-fieldset',
			layout : 'column',
			columnWidth: 1,
			autoHeight: true,
			anchor : '100%',
			items : [{
				xtype : 'container',
				layout : 'form',
				columnWidth	: 0.5,
				border : false,
				defaults :{
					anchor :'100%',
					editable : false,
					readOnly : true
				},
				items : [{
					xtype : 'textfield',
					fieldLabel :_('Business'),
					name : 'business_telephone_number'
				},{
					xtype : 'combo',
					mode: 'local',
					fieldLabel :_('Business2'),
					store : new Zarafa.addressbook.AddressBookTelephoneNumberSubStore(),
					autoSelect: true,
					forceSelection : true,
					lazyInit : false,
					editable : false,
					readOnly : false,
					triggerAction	: 'all',
					displayField : 'number',
					valueField : 'number',
					ref : '../../business2PhoneCombo'
				},{
					xtype : 'textfield',
					fieldLabel :_('Fax'),
					name : 'primary_fax_number'
				},{
					xtype : 'textfield',
					fieldLabel : _('Assistant'),
					name : 'assistant'
				}]
			},{
				xtype : 'container',
				layout : 'form',
				columnWidth	: 0.5,
				border : false,
				defaults : {
					anchor : '100%',
					editable : false,
					readOnly : true
				},
				items : [{
					xtype : 'textfield',
					fieldLabel : _('Home'),
					name : 'home_telephone_number'
				},{
					xtype : 'combo',
					mode: 'local',
					fieldLabel :_('Home2'),
					store : new Zarafa.addressbook.AddressBookTelephoneNumberSubStore(),
					forceSelection : true,
					lazyInit : false,
					editable : false,
					readOnly : false,
					triggerAction	: 'all',
					displayField : 'number',
					valueField : 'number',
					ref : '../../home2PhoneCombo'
				},{
					xtype : 'textfield',
					fieldLabel : _('Mobile'),
					name : 'mobile_telephone_number'
				},{
					xtype : 'textfield',
					fieldLabel : _('Pager'),
					name : 'pager_telephone_number'
				}]
			}]
		};
	},

	/**
	 * Creates the note fieldset for phone tab 
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createNoteFieldset : function()
	{
		return [{
			xtype : 'displayfield',
			value : _('Notes') + ':',
			hideLabel : true
		},{
			xtype : 'textarea',
			hideLabel : true,
			name : 'comment',
			readOnly : true,
			columnWidth : 1,
			flex: 1
		}];
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

		var businessPhoneSubStore = record.getSubStore('business2_telephone_numbers');
		if (businessPhoneSubStore && this.business2PhoneCombo.getStore() !== businessPhoneSubStore) {
			this.business2PhoneCombo.bindStore(businessPhoneSubStore);
			var select = businessPhoneSubStore.getAt(0);
			if (select) {
				this.business2PhoneCombo.setValue(select.get(this.business2PhoneCombo.valueField));
			}
		}

		var homePhoneSubStore = record.getSubStore('home2_telephone_numbers');
		if (homePhoneSubStore && this.home2PhoneCombo.getStore() !== homePhoneSubStore) {
			this.home2PhoneCombo.bindStore(homePhoneSubStore);
			var select = homePhoneSubStore.getAt(0);
			if (select) {
				this.home2PhoneCombo.setValue(select.get(this.home2PhoneCombo.valueField));
			}
		}
	}
});

Ext.reg('zarafa.abuserphonetab', Zarafa.addressbook.dialogs.ABUserPhoneTab);
