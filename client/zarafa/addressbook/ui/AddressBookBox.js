Ext.namespace('Zarafa.addressbook.ui');

/**
 * @class Zarafa.addressbook.ui.AddressBookBox
 * @extends Zarafa.common.recipientfield.ui.RecipientBox
 * @xtype zarafa.addressbookbox
 *
 * Special {@link Zarafa.common.ui.Box box} which is used
 * for displaying AddressBook records in the {@link Zarafa.addressbook.ui.AddressBookBoxField}.
 * This works similar to the {@link Zarafa.common.recipientfield.ui.RecipientBox} regarding
 * resolving, but it will mark any non-AddressBook user as invalid.
 */
Zarafa.addressbook.ui.AddressBookBox = Ext.extend(Zarafa.common.recipientfield.ui.RecipientBox, {

	/**
	 * @cfg {Zarafa.core.mapi.DisplayType} validDisplayType The displaytype which is considered
	 * valid as a box. This can be used to mark a particular AddressBook types as invalid.
	 */
	validDisplayType : undefined,


	/**
	 * Check if the given {@link Ext.data.Record record} is valid. This function can be
	 * overridden by the childclasses to indicate if the given record is valid.
	 *
	 * This class will check if the given record is  {@link Zarafa.core.data.IPMRecipientRecord#isResolved resolved},
	 * and if the display_type is {@link #validDisplayType valid}.
	 *
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The record to check
	 * @return {Boolean} True if the record is valid
	 * @protected
	 */
	isValidRecord : function(record)
	{
		return record.isResolved() && (!Ext.isDefined(this.validDisplayType) || record.get('display_type') === this.validDisplayType);
	}
});

Ext.reg('zarafa.addressbookbox', Zarafa.addressbook.ui.AddressBookBox);
