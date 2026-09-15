/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook.ui');

/**
 * @class Grommunio.addressbook.ui.AddressBookBox
 * @extends Grommunio.common.recipientfield.ui.RecipientBox
 * @xtype grommunio.addressbookbox
 *
 * Special {@link Grommunio.common.ui.Box box} which is used
 * for displaying AddressBook records in the {@link Grommunio.addressbook.ui.AddressBookBoxField}.
 * This works similar to the {@link Grommunio.common.recipientfield.ui.RecipientBox} regarding
 * resolving, but it will mark any non-AddressBook user as invalid.
 */
Grommunio.addressbook.ui.AddressBookBox = Ext.extend(Grommunio.common.recipientfield.ui.RecipientBox, {

	/**
	 * @cfg {Grommunio.core.mapi.DisplayType} validDisplayType The displaytype which is considered
	 * valid as a box. This can be used to mark a particular AddressBook types as invalid.
	 */
	validDisplayType: undefined,


	/**
	 * Check if the given {@link Ext.data.Record record} is valid. This function can be
	 * overridden by the childclasses to indicate if the given record is valid.
	 *
	 * This class will check if the given record is {@link Grommunio.core.data.IPMRecipientRecord#isResolved resolved},
	 * and if the display_type is {@link #validDisplayType valid}.
	 *
	 * @param {Grommunio.core.data.IPMRecipientRecord} record The record to check
	 * @return {Boolean} True if the record is valid
	 * @protected
	 */
	isValidRecord: function(record)
	{
		return record.isResolved() && (!Ext.isDefined(this.validDisplayType) || record.get('display_type') === this.validDisplayType);
	}
});

Ext.reg('grommunio.addressbookbox', Grommunio.addressbook.ui.AddressBookBox);
