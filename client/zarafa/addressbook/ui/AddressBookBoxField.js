Ext.namespace('Zarafa.addressbook.ui');

/**
 * @class Zarafa.addressbook.ui.AddressBookBoxField
 * @extends Zarafa.common.recipientfield.ui.RecipientField
 * @xtype zarafa.addressbookboxfield
 *
 * Special {@link Zarafa.common.ui.BoxField boxfield} which is used
 * for displaying AddressBook records. This works similar to the
 * {@link Zarafa.common.recipientfield.ui.RecipientField} regarding
 * resolving, but it will mark any non-AddressBook user as invalid.
 *
 * If the {@link Zarafa.core.plugins.RecordComponentUpdaterPlugin} is installed
 * in the {@link #plugins} array of this component, this component will automatically
 * load the {@link Zarafa.core.data.IPMRecipientStore RecipientStore} into the component.
 * Otherwise the user of this component needs to call {@link #setRecipientStore}.
 */
Zarafa.addressbook.ui.AddressBookBoxField = Ext.extend(Zarafa.common.recipientfield.ui.RecipientField, {
	/**
	 * @cfg {Zarafa.core.mapi.RecipientType} defaultRecipientType
	 * @hide
	 */

	/**
	 * @cfg {Zarafa.core.mapi.RecipientType} filterRecipientType
	 * @hide
	 */

	/**
	 * @cfg {String} delimiterCharacter
	 * @hide
	 */

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			boxType : 'zarafa.addressbookbox',
			enableComboBox: false,
			editable: true,
			height: 24
		});

		Zarafa.addressbook.ui.AddressBookBoxField.superclass.constructor.call(this, config);
	}

});

Ext.reg('zarafa.addressbookboxfield', Zarafa.addressbook.ui.AddressBookBoxField);
