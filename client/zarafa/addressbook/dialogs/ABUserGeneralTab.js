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
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'zarafa.abusergeneraltab',
			title: _('General'),	
			layout: 'column',
			autoHeight: true,
			autoScroll: true,
			border: false,
			layoutConfig: {
				columns: 2
			},
			defaults: {
				xtype: 'fieldset',
				columnWidth: 0.5,
				cls: 'k-fieldset',
				hideBorders: true
			},
			items: [
				this.createNameFieldset(),
				this.createPhotoFieldset(),
				this.createAddressFieldset(),
				this.createOfficeFieldset()
			]
		});

		Zarafa.addressbook.dialogs.ABUserGeneralTab.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the name fieldset for general tab of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createNameFieldset: function()
	{
		return {
			defaults: {
				anchor: '100%',
				readOnly: true,
			},
			items: [{
				xtype: 'textfield',
				fieldLabel: _('First name'),
				name: 'given_name',
			}, {
				xtype: 'textfield',
				flex: 1,
				fieldLabel: _('Last name'),
				name: 'surname'
			},{
				xtype: 'textfield',
				flex: 1,
				fieldLabel: _('Initials'),
				name: 'initials'
			},{
				xtype: 'textfield',
				flex: 1,
				fieldLabel:_('Display'),
				name: 'display_name'
			},{
				xtype: 'textfield',
				flex: 1,
				fieldLabel: _('Alias'),
				name: 'account'
			}]
		};
	},

	/**
	 * Creates the photo fieldset for general tab of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createPhotoFieldset: function()
	{
		return {
			border: false,
			layout: {
				type: 'hbox'
			},
			items: {
				xtype: 'box',
				cls: 'contact_photo_box default_contact_photo',
				ctCls: 'contact_photo_box_ct',
				autoEl: {
					tag: 'img',
					src: Ext.BLANK_IMAGE_URL
				},
				ref: '../contactPhotoBox'
			}
		};
	},

	/**
	 * Creates fieldset for general tab of tab panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createAddressFieldset: function()
	{
		return {
			xtype: 'fieldset',
			defaultType: 'textfield',
			title: _('Addresses'),
			border: false,
			columnWidth: 0.5,
			defaults: {
				anchor:'100%',
				readOnly: true
			},
			items: [{
				xtype: 'textarea',
				fieldLabel: _('Address'),
				name: 'street_address',
				height: '40px'
			},{
				fieldLabel: _('City'),
				name: 'locality'
			},{
				fieldLabel: _('State'),
				name: 'state_or_province'
			},{
				fieldLabel: _('Zip Code'),
				name: 'postal_code'
			},{
				fieldLabel: _('Country'),
				name: 'country'
			}]
		};
	},

	/**
	 * Creates fieldset for general tab of tab panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createOfficeFieldset: function()
	{
		return {
			xtype: 'fieldset',
			defaultType: 'textfield',
			title: _('Professional'),
			columnWidth: 0.5,
			defaults: {
				anchor: '100%',
				readOnly: true
			},
			items: [{
				fieldLabel: _('Title'),
				name: 'title'
			},{
				fieldLabel: _('Company'),
				name: 'company_name'
			},{
				fieldLabel: _('Department'),
				name: 'department_name'
			},{
				fieldLabel: _('Office'),
				name: 'office_location'
			},{
				fieldLabel: _('Assistant'),
				name: 'assistant'
			},{
				fieldLabel: _('Phone'),
				name: 'business_telephone_number'
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
	update: function(record, contentReset)
	{
		if(Ext.isEmpty(record)) {
			return;
		}

		this.getForm().loadRecord(record);

		if (record.isOpened() && contentReset) {
			// Show GAB contact photo.
			var abThumbnail = record.get('ems_ab_thumbnail_photo');
			if (!Ext.isEmpty(abThumbnail)) {
				var imageField = this.contactPhotoBox.getEl();
				imageField.dom.setAttribute('src', abThumbnail);
				imageField.removeClass('default_contact_photo');
			}
		}
	}
});

Ext.reg('zarafa.abusergeneraltab', Zarafa.addressbook.dialogs.ABUserGeneralTab);
