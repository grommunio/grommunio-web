Ext.namespace('Grommunio.addressbook.ui');

/**
 * @class Grommunio.addressbook.ui.AddressBookBoxField
 * @extends Grommunio.common.recipientfield.ui.RecipientField
 * @xtype grommunio.addressbookboxfield
 *
 * Special {@link Grommunio.common.ui.BoxField boxfield} which is used
 * for displaying AddressBook records. This works similar to the
 * {@link Grommunio.common.recipientfield.ui.RecipientField} regarding
 * resolving, but it will mark any non-AddressBook user as invalid.
 *
 * If the {@link Grommunio.core.plugins.RecordComponentUpdaterPlugin} is installed
 * in the {@link #plugins} array of this component, this component will automatically
 * load the {@link Grommunio.core.data.IPMRecipientStore RecipientStore} into the component.
 * Otherwise the user of this component needs to call {@link #setRecipientStore}.
 */
Grommunio.addressbook.ui.AddressBookBoxField = Ext.extend(Grommunio.common.recipientfield.ui.RecipientField, {
	/**
	 * @cfg {Grommunio.core.mapi.RecipientType} defaultRecipientType
	 * @hide
	 */

	/**
	 * @cfg {Grommunio.core.mapi.RecipientType} filterRecipientType
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
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			boxType: 'grommunio.addressbookbox',
			enableComboBox: false,
			editable: true,
			height: 24
		});

		Grommunio.addressbook.ui.AddressBookBoxField.superclass.constructor.call(this, config);
	}

});

Ext.reg('grommunio.addressbookboxfield', Grommunio.addressbook.ui.AddressBookBoxField);
