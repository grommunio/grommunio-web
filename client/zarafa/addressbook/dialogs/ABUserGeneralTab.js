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
			autoScroll: true,
			border: false,
			cls: 'k-ab-general-tab',
			items: [{
				xtype: 'container',
				cls: 'k-ab-identity',
				items: [{
					xtype: 'panel',
					border: false,
					layout: 'form',
					cls: 'k-ab-name-fields',
					labelSeparator: '',
					defaults: {
						anchor: '100%',
						readOnly: true
					},
					items: [{
						xtype: 'textfield',
						fieldLabel: _('First name'),
						name: 'given_name'
					},{
						xtype: 'textfield',
						fieldLabel: _('Last name'),
						name: 'surname'
					},{
						xtype: 'textfield',
						fieldLabel: _('Initials'),
						name: 'initials'
					},{
						xtype: 'textfield',
						fieldLabel: _('Display'),
						name: 'display_name'
					},{
						xtype: 'textfield',
						fieldLabel: _('Alias'),
						name: 'account'
					}]
				},{
					xtype: 'container',
					cls: 'k-ab-photo-ct',
					items: [{
						xtype: 'box',
						cls: 'contact_photo_box default_contact_photo k-ab-photo',
						autoEl: {
							tag: 'img',
							src: Ext.BLANK_IMAGE_URL
						},
						ref: '../../contactPhotoBox'
					}]
				}]
			},{
				xtype: 'container',
				layout: 'column',
				cls: 'k-ab-details',
				items: [{
					xtype: 'panel',
					columnWidth: 0.5,
					layout: 'form',
					border: false,
					cls: 'k-ab-detail-col',
					title: _('Address'),
					labelSeparator: '',
					defaults: {
						anchor: '100%',
						readOnly: true
					},
					items: [{
						xtype: 'textarea',
						fieldLabel: _('Street'),
						name: 'street_address',
						height: 62
					},{
						xtype: 'textfield',
						fieldLabel: _('City'),
						name: 'locality'
					},{
						xtype: 'textfield',
						fieldLabel: _('State'),
						name: 'state_or_province'
					},{
						xtype: 'textfield',
						fieldLabel: _('Zip Code'),
						name: 'postal_code'
					},{
						xtype: 'textfield',
						fieldLabel: _('Country'),
						name: 'country'
					}]
				},{
					xtype: 'panel',
					columnWidth: 0.5,
					layout: 'form',
					border: false,
					cls: 'k-ab-detail-col',
					title: _('Professional'),
					labelSeparator: '',
					defaults: {
						anchor: '100%',
						readOnly: true
					},
					items: [{
						xtype: 'textfield',
						fieldLabel: _('Title'),
						name: 'title'
					},{
						xtype: 'textfield',
						fieldLabel: _('Company'),
						name: 'company_name'
					},{
						xtype: 'textfield',
						fieldLabel: _('Department'),
						name: 'department_name'
					},{
						xtype: 'textfield',
						fieldLabel: _('Office'),
						name: 'office_location'
					},{
						xtype: 'textfield',
						fieldLabel: _('Assistant'),
						name: 'assistant'
					},{
						xtype: 'textfield',
						fieldLabel: _('Phone'),
						name: 'business_telephone_number'
					}]
				}]
			}]
		});

		Zarafa.addressbook.dialogs.ABUserGeneralTab.superclass.constructor.call(this, config);
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
