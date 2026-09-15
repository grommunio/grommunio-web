/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/addressbook/AddressBookSubStore.js
 * #dependsFile client/grommunio/addressbook/AddressBookTelephoneNumberSubStore.js
 * #dependsFile client/grommunio/addressbook/AddressBookEmailAddressesSubStore.js
 */
Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.AddressBookRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all
 * {@link Grommunio.core.mapi.ObjectType.MAPI_MAILUSER MAPI_MAILUSER} and
 * {@link Grommunio.core.mapi.ObjectType.MAPI_DISTLIST MAPI_DISTLIST} type messages.
 */
Grommunio.addressbook.AddressBookRecordFields = [
	{name: 'entryid'},
	{name: 'search_key'},
	{name: 'store_entryid'},
	{name: 'full_name'},
	{name: 'fileas'},
	{name: 'object_type', type: 'int', defaultValue: Grommunio.core.mapi.ObjectType.MAPI_MAILUSER },
	{name: 'display_type', type: 'int', defaultValue: Grommunio.core.mapi.DisplayType.DT_MAILUSER },
	{name: 'display_type_ex', type: 'int', defaultValue: Grommunio.core.mapi.DisplayType.DT_MAILUSER },
	{name: 'address_type'},
	{name: 'email_address'},
	{name: 'smtp_address'},
	{name: 'given_name'},
	{name: 'initials'},
	{name: 'surname'},
	{name: 'display_name'},
	{name: 'account'},
	{name: 'ems_ab_thumbnail_photo', defaultValue: ""},
	{name: 'street_address'},
	{name: 'locality'},
	{name: 'state_or_province'},
	{name: 'postal_code'},
	{name: 'country'},
	{name: 'title'},
	{name: 'company_name'},
	{name: 'department_name'},
	{name: 'office_location'},
	{name: 'assistant'},
	{name: 'office_telephone_number'}, // FIXME: Duplicate of business_telephone_number
	{name: 'business_telephone_number'},
	{name: 'business2_telephone_number'},
	{name: 'business2_telephone_number_mv'},
	{name: 'primary_fax_number'},
	{name: 'home_telephone_number'},
	{name: 'home2_telephone_number'},
	{name: 'home2_telephone_number_mv'},
	{name: 'mobile_telephone_number'},
	{name: 'pager_telephone_number'},
	{name: 'comment'},
	{name: 'icon_index'},
	{name: 'is_shared'},
	{name: 'is_contact_item'},
	{name: 'email_index', type: 'int', defaultValue: -1}
];

Grommunio.core.data.RecordFactory.addFieldToObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER, Grommunio.addressbook.AddressBookRecordFields);
Grommunio.core.data.RecordFactory.addFieldToObjectType(Grommunio.core.mapi.ObjectType.MAPI_DISTLIST, Grommunio.addressbook.AddressBookRecordFields);

// support substores for further AB user details
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER, 'ems_ab_manager', Grommunio.addressbook.AddressBookSubStore);
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER, 'ems_ab_proxy_addresses', Grommunio.addressbook.AddressBookEmailAddressesSubStore);
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER, 'ems_ab_is_member_of_dl', Grommunio.addressbook.AddressBookSubStore);
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER, 'ems_ab_reports', Grommunio.addressbook.AddressBookSubStore);
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER, 'home2_telephone_numbers', Grommunio.addressbook.AddressBookTelephoneNumberSubStore);
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER, 'business2_telephone_numbers', Grommunio.addressbook.AddressBookTelephoneNumberSubStore);

Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_DISTLIST, 'ems_ab_owner', Grommunio.addressbook.AddressBookSubStore);
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_DISTLIST, 'ems_ab_proxy_addresses', Grommunio.addressbook.AddressBookEmailAddressesSubStore);
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_DISTLIST, 'ems_ab_is_member_of_dl', Grommunio.addressbook.AddressBookSubStore);
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_DISTLIST, 'members', Grommunio.addressbook.AddressBookSubStore);

Grommunio.core.data.RecordFactory.addListenerToObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER, 'createphantom', function(record) {
	// Phantom records must always be marked as opened (they contain the full set of data)
	record.afterOpen();
});

Grommunio.core.data.RecordFactory.addListenerToObjectType(Grommunio.core.mapi.ObjectType.MAPI_DISTLIST, 'createphantom', function(record) {
	// Phantom records must always be marked as opened (they contain the full set of data)
	record.afterOpen();
});

/**
 * @class Grommunio.addressbook.AddressBookRecord
 * @extends Grommunio.core.data.MAPIRecord
 *
 * An extension to the {@link Grommunio.core.data.MAPIRecord Record} specific for Addressbook items
 */
Grommunio.addressbook.AddressBookRecord = Ext.extend(Grommunio.core.data.MAPIRecord, {
	/**
	 * Convert this addressbook record into a {@link Grommunio.core.data.IPMRecipientRecord recipient}
	 * which can be used for composing news mails.
	 *
	 * @param {Grommunio.core.mapi.RecipientType} recipientType (optional) The recipient type which should
	 * be applied to this recipient. Defaults to {@link Grommunio.core.mapi.RecipientType#MAPI_TO}.
	 * @param {Grommunio.core.data.RecordCustomObjectType} recordType The custom record type. It can be either
	 * {@link Grommunio.core.data.RecordCustomObjectType#GROMMUNIO_RECIPIENT} or {@link Grommunio.core.data.RecordCustomObjectType#GROMMUNIO_CC_RECIPIENT}
	 * in most of the case.
	 *
	 * @return {Grommunio.core.data.IPMRecipientRecord} The recipientRecord for this addressbook item
	 */
	convertToRecipient: function(recipientType, recordType)
	{
		var recordCustomObjectType = Grommunio.core.data.RecordCustomObjectType;
		recordType = recordCustomObjectType.get(recordType) ? recordType : recordCustomObjectType.GROMMUNIO_RECIPIENT;
		var recipientRecord = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(recordType, {
			entryid: this.get('entryid'),
			search_key: this.get('search_key'),
			object_type: this.get('object_type'),
			display_name: this.get('display_name'),
			display_type: this.get('display_type'),
			display_type_ex: this.get('display_type_ex'),
			email_address: this.get('email_address'),
			smtp_address: this.get('smtp_address'),
			address_type: this.get('address_type'),
			recipient_type: recipientType || Grommunio.core.mapi.RecipientType.MAPI_TO
		});

		return recipientRecord;
	},

	/**
	 * Resolve the openable message entryid for a personal contact or distlist. Contact
	 * Provider wrapped entryids are unwrapped; contact folder items carry a trailing
	 * email-index byte (signalled by {@link #email_index}) which is stripped. We rely on
	 * email_index rather than inspecting the trailing bytes, as a valid message entryid can
	 * legitimately end in those byte values.
	 *
	 * @return {String} The message entryid, or the original entryid for other items.
	 */
	getContactMessageEntryId: function()
	{
		var entryid = this.get('entryid');

		var uscoreIndex = entryid.indexOf('_');
		if (uscoreIndex > 0) {
			entryid = entryid.substr(0, uscoreIndex);
		}

		if (Grommunio.core.EntryId.hasContactProviderGUID(entryid)) {
			return Grommunio.core.EntryId.unwrapContactProviderEntryId(entryid);
		}

		if (this.get('email_index') > 0) {
			entryid = entryid.substr(0, entryid.length - 2);
		}

		return entryid;
	},

	/**
	 * Convert this {@link Grommunio.addressbook.AddressBookRecord AddressBookRecord} into a {@link Grommunio.contact.DistlistMemberRecord DistlistMemberRecord}
	 * which can be used as record inside {@link Grommunio.contact.DistlistMemberStore}.
	 *
	 * @return {Grommunio.contact.DistlistMemberRecord} The distribution list member for this address book item
	 */
	convertToDistlistMember: function()
	{
		// by default set it to addressbook user
		var distlistType = Grommunio.core.mapi.DistlistType.DL_USER_AB;
		if(this.get('object_type') === Grommunio.core.mapi.ObjectType.MAPI_DISTLIST) {
			// addressbook group
			distlistType = Grommunio.core.mapi.DistlistType.DL_DIST_AB;
		}

		// Local contacts must be stored as a local item with an openable message entryid,
		// so opening the member resolves against the store instead of the address book.
		var entryid = this.get('entryid');
		if (this.isPersonalContact()) {
			distlistType = Grommunio.core.mapi.DistlistType.DL_USER;
			entryid = this.getContactMessageEntryId();
		} else if (this.isPersonalDistList()) {
			distlistType = Grommunio.core.mapi.DistlistType.DL_DIST;
			entryid = this.getContactMessageEntryId();
		}

		var props = {
			entryid: entryid,
			address_type: this.get('address_type'),
			distlist_type: distlistType,
			display_name: this.get('display_name'),
			email_address: this.get('email_address') || this.get('smtp_address'),
			smtp_address: this.get('smtp_address') || this.get('email_address')
		};

		return Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DISTLIST_MEMBER, props);
	},

	/**
	 * Convert this addressbook record into a {@link Grommunio.hierarchy.data.UserPermissionRecord user permission record}
	 * which can be used to assign permissions to the addressbook item for a particular {@link Grommunio.hierarchy.data.MAPIFolder}.
	 * @return {Grommunio.hierarchy.data.UserPermissionRecord} The user permission record for this addressbook item
	 */
	convertToUserPermission: function()
	{
		return Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_USER_PERMISSION, {
			entryid: this.get('entryid'),
			display_name: this.get('display_name'),
			object_type: this.get('object_type'),
			rights: Grommunio.core.mapi.Rights.RIGHTS_NO_RIGHTS
		});
	},

	/**
	 * Convert this addressbook record into a {@link Grommunio.common.delegates.data.DelegateRecord DelegateRecord}
	 * which can be used for adding new permissions for delegates.
	 *
	 * @return {Grommunio.common.delegates.data.DelegateRecord} The DelegateRecord for this addressbook item.
	 */
	convertToDelegate: function()
	{
		var data = {
			entryid: this.get('entryid'),
			display_name: this.get('display_name')
		};

		return Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DELEGATE, data);
	},

	/**
	 * This will determine if the provided className ie. IPM.Contact matches the message_class
	 * on this record. This comparison is done case-insensitive. See {@link Grommunio.core.MessageClass#isClass}
	 * for further details.
	 *
	 * @return {Boolean} True when the given className matches the message_class.
	 */
	isPersonalContact: function()
	{
		if(Grommunio.core.MessageClass.isClass(this.get('message_class'), 'IPM.CONTACT', true)){
			return true;
		}
		if (this.get('object_type') == Grommunio.core.mapi.ObjectType.MAPI_MAILUSER) {
			if (Grommunio.core.EntryId.hasContactProviderGUID(this.get('entryid'))) {
				return true;
			}
			// Contact folder items have the is_contact_item flag set
			// by the server (both personal and shared contact folders).
			if (this.get('is_contact_item')) {
				return true;
			}
		}
		return false;
	},

	/**
	 * This will determine if the provided className ie. IPM.DistList matches the message_class
	 * on this record. This comparison is done case-insensitive. See {@link Grommunio.core.MessageClass#isClass}
	 * for further details.
	 *
	 * @return {Boolean} True when the given className matches the message_class.
	 */
	isPersonalDistList: function()
	{
		if(Grommunio.core.MessageClass.isClass(this.get('message_class'), 'IPM.DISTLIST', true)){
			return true;
		}
		if (this.get('object_type') == Grommunio.core.mapi.ObjectType.MAPI_DISTLIST) {
			if (Grommunio.core.EntryId.hasContactProviderGUID(this.get('entryid'))) {
				return true;
			}
			// Contact folder items have the is_contact_item flag set
			// by the server (both personal and shared contact folders).
			if (this.get('is_contact_item')) {
				return true;
			}
		}
		return false;
	},


	/**
	 * Convert this recipient into a {@link Grommunio.core.data.IPMRecord record}.
	 * This can only work if this recipient is {@link #isResolved resolved}.
	 *
	 * @return {Grommunio.core.data.IPMRecord} The addressbook record which
	 * is represented by this recipient.
	 */
	convertToContactRecord: function()
	{
		var entryid = this.getContactMessageEntryId();

		return Grommunio.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Contact', {
			entryid: entryid,
			message_class: 'IPM.Contact',
			object_type: Grommunio.core.mapi.ObjectType.MAPI_MESSAGE
		}, entryid);
	},

	/**
	 * Convert this recipient into a {@link Grommunio.core.data.IPMRecord record}.
	 * This can only work if this recipient is {@link #isResolved resolved}.
	 *
	 * @return {Grommunio.core.data.IPMRecord} The addressbook record which
	 * is represented by this recipient.
	 */
	convertToDistListRecord: function()
	{
		var entryid = this.getContactMessageEntryId();

		return Grommunio.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.DistList', {
			entryid: entryid,
			message_class: 'IPM.DistList',
			object_type: Grommunio.core.mapi.ObjectType.MAPI_MESSAGE
		}, entryid);
	},

	/**
	 * Compare this {@link Grommunio.core.data.MAPIRecord record} instance with another one to see
	 * if they are same
	 *
	 * @param {Grommunio.core.data.MAPIRecord} record The Record to compare with
	 * @return {Boolean} True if the records are the same.
	 */
	equals: function(record)
	{
		// Simplest case, do we have the same object...
		if (this === record) {
			return true;
		}

		return Grommunio.core.EntryId.compareABEntryIds(this.get('entryid'),record.get('entryid'));
	},

	isSharedContact: function()
	{
		return !!this.get('is_shared');
	}
});

Grommunio.core.data.RecordFactory.setBaseClassToObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER, Grommunio.addressbook.AddressBookRecord);
Grommunio.core.data.RecordFactory.setBaseClassToObjectType(Grommunio.core.mapi.ObjectType.MAPI_DISTLIST, Grommunio.addressbook.AddressBookRecord);
