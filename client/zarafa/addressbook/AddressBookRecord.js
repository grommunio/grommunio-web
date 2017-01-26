/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/addressbook/AddressBookSubStore.js
 * #dependsFile client/zarafa/addressbook/AddressBookTelephoneNumberSubStore.js
 * #dependsFile client/zarafa/addressbook/AddressBookEmailAddressesSubStore.js
 */
Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.AddressBookRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all
 * {@link Zarafa.core.mapi.ObjectType.MAPI_MAILUSER MAPI_MAILUSER} and
 * {@link Zarafa.core.mapi.ObjectType.MAPI_DISTLIST MAPI_DISTLIST} type messages.
 */
Zarafa.addressbook.AddressBookRecordFields = [
	{name: 'entryid'},
	{name: 'search_key'},
	{name: 'full_name'},
	{name: 'fileas'},
	{name: 'object_type', type: 'int', defaultValue: Zarafa.core.mapi.ObjectType.MAPI_MAILUSER },
	{name: 'display_type', type: 'int', defaultValue: Zarafa.core.mapi.DisplayType.DT_MAILUSER },
	{name: 'display_type_ex', type: 'int', defaultValue: Zarafa.core.mapi.DisplayType.DT_MAILUSER },
	{name: 'address_type'},
	{name: 'email_address'},
	{name: 'smtp_address'},
	{name: 'given_name'},
	{name: 'initials'},
	{name: 'surname'},
	{name: 'display_name'},
	{name: 'account'},
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
	{name: 'comment'}
];

Zarafa.core.data.RecordFactory.addFieldToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, Zarafa.addressbook.AddressBookRecordFields);
Zarafa.core.data.RecordFactory.addFieldToObjectType(Zarafa.core.mapi.ObjectType.MAPI_DISTLIST, Zarafa.addressbook.AddressBookRecordFields);

// support substores for furthur AB user details
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, 'ems_ab_manager', Zarafa.addressbook.AddressBookSubStore);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, 'ems_ab_proxy_addresses', Zarafa.addressbook.AddressBookEmailAddressesSubStore);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, 'ems_ab_is_member_of_dl', Zarafa.addressbook.AddressBookSubStore);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, 'ems_ab_reports', Zarafa.addressbook.AddressBookSubStore);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, 'home2_telephone_numbers', Zarafa.addressbook.AddressBookTelephoneNumberSubStore);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, 'business2_telephone_numbers', Zarafa.addressbook.AddressBookTelephoneNumberSubStore);

Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_DISTLIST, 'ems_ab_owner', Zarafa.addressbook.AddressBookSubStore);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_DISTLIST, 'ems_ab_proxy_addresses', Zarafa.addressbook.AddressBookEmailAddressesSubStore);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_DISTLIST, 'ems_ab_is_member_of_dl', Zarafa.addressbook.AddressBookSubStore);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_DISTLIST, 'members', Zarafa.addressbook.AddressBookSubStore);

Zarafa.core.data.RecordFactory.addListenerToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, 'createphantom', function(record) {
	// Phantom records must lways be marked as opened (they contain the full set of data)
	record.afterOpen();
});

Zarafa.core.data.RecordFactory.addListenerToObjectType(Zarafa.core.mapi.ObjectType.MAPI_DISTLIST, 'createphantom', function(record) {
	// Phantom records must lways be marked as opened (they contain the full set of data)
	record.afterOpen();
});

/**
 * @class Zarafa.addressbook.AddressBookRecord
 * @extends Zarafa.core.data.MAPIRecord
 *
 * An extension to the {@link Zarafa.core.data.MAPIRecord Record} specific for Addressbook items
 */
Zarafa.addressbook.AddressBookRecord = Ext.extend(Zarafa.core.data.MAPIRecord, {
	/**
	 * Convert this addressbook record into a {@link Zarafa.core.data.IPMRecipientRecord recipient}
	 * which can be used for composing news mails.
	 *
	 * @param {Zarafa.core.mapi.RecipientType} recipientType (optional) The recipient type which should
	 * be applied to this recipient. Defaults to {@link Zarafa.core.mapi.RecipientType#MAPI_TO}.
	 * @return {Zarafa.core.data.IPMRecipientRecord} The recipientRecord for this addressbook item
	 */
	convertToRecipient : function(recipientType)
	{
		var recipientRecord = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, {
			entryid : this.get('entryid'),
			search_key : this.get('search_key'),
			object_type : this.get('object_type'),
			display_name : this.get('display_name'),
			display_type : this.get('display_type'),
			display_type_ex : this.get('display_type_ex'),
			email_address : this.get('email_address'),
			smtp_address : this.get('smtp_address'),
			address_type : this.get('address_type'),
			recipient_type : recipientType || Zarafa.core.mapi.RecipientType.MAPI_TO
		});

		return recipientRecord;
	},

	/**
	 * Convert this {@link Zarafa.addressbook.AddressBookRecord AddressBookRecord} into a {@link Zarafa.contact.DistlistMemberRecord DistlistMemberRecord}
	 * which can be used as record inside {@link Zarafa.contact.DistlistMemberStore}.
	 *
	 * @return {Zarafa.contact.DistlistMemberRecord} The distribution list member for this address book item
	 */
	convertToDistlistMember : function()
	{
		// by default set it to addressbook user
		var distlistType = Zarafa.core.mapi.DistlistType.DL_USER_AB;
		if(this.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_DISTLIST) {
			// addressbook group
			distlistType = Zarafa.core.mapi.DistlistType.DL_DIST_AB;
		}

		// Check if this item is using the Contact provider, if that is the case,
		// we must convert the entryid to a local entryid and we should update the
		// DistlistType to indicate that it is a local item
		var entryid = this.get('entryid');
		if (Zarafa.core.EntryId.hasContactProviderGUID(entryid)) {
			if (distlistType === Zarafa.core.mapi.DistlistType.DL_USER_AB) {
				distlistType = Zarafa.core.mapi.DistlistType.DL_USER;
			} else {
				distlistType = Zarafa.core.mapi.DistlistType.DL_DIST;
			}
			entryid = Zarafa.core.EntryId.unwrapContactProviderEntryId(entryid);
		}

		var props = {
			entryid : entryid,
			address_type : this.get('address_type'),
			distlist_type : distlistType,
			display_name : this.get('display_name'),
			email_address : this.get('email_address') || this.get('smtp_address')
		};

		return Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DISTLIST_MEMBER, props);
	},

	/**
	 * Convert this addressbook record into a {@link Zarafa.hierarchy.data.UserPermissionRecord user permission record}
	 * which can be used to assign permissions to the addressbook item for a particular {@link Zarafa.hierarchy.data.MAPIFolder}.
	 * @return {Zarafa.hierarchy.data.UserPermissionRecord} The user permission record for this addressbook item
	 */
	convertToUserPermission : function()
	{
		return Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_USER_PERMISSION, {
			entryid : this.get('entryid'),
			display_name : this.get('display_name'),
			object_type : this.get('object_type'),
			rights : Zarafa.core.mapi.Rights.RIGHTS_NO_RIGHTS
		});
	},

	/**
	 * Convert this addressbook record into a {@link Zarafa.common.delegates.data.DelegateRecord DelegateRecord}
	 * which can be used for adding new permissions for delegates.
	 *
	 * @return {Zarafa.common.delegates.data.DelegateRecord} The DelegateRecord for this addressbook item.
	 */
	convertToDelegate : function()
	{
		var data = {
			entryid : this.get('entryid'),
			display_name : this.get('display_name')
		};

		return Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DELEGATE, data);
	},

	/**
	 * This will determine if the provided className ie. IPM.Contact matches the message_class
	 * on this record. This comparison is done case-insensitive. See {@link Zarafa.core.MessageClass#isClass}
	 * for further details.
	 *
	 * @return {Boolean} True when the given className matches the message_class.
	 */
	isPersonalContact: function()
	{
		if(Zarafa.core.MessageClass.isClass(this.get('message_class'), 'IPM.CONTACT', true)){
			return true;
		}else if (this.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_MAILUSER && Zarafa.core.EntryId.hasContactProviderGUID(this.get('entryid'))){
			return true;
		}
		return false;
	},

	/**
	 * This will determine if the provided className ie. IPM.DistList matches the message_class
	 * on this record. This comparison is done case-insensitive. See {@link Zarafa.core.MessageClass#isClass}
	 * for further details.
	 *
	 * @return {Boolean} True when the given className matches the message_class.
	 */
	isPersonalDistList: function()
	{
		if(Zarafa.core.MessageClass.isClass(this.get('message_class'), 'IPM.DISTLIST', true)){
			return true;
		}else if (this.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_DISTLIST && Zarafa.core.EntryId.hasContactProviderGUID(this.get('entryid'))){
			return true;
		}
		return false;
	},


	/**
	 * Convert this recipient into a {@link Zarafa.core.data.IPMRecord record}.
	 * This can only work if this recipient is {@link #isResolved resolved}.
	 *
	 * @return {Zarafa.core.data.IPMRecord} The addressbook record which
	 * is represented by this recipient.
	 */
	convertToContactRecord : function()
	{
		// Entryids of personal contacts are suffixed with email id (1, 2, 3), so remove that id
		// this is done in php to ensure that we will always have unique entryids
		var entryid = this.get('entryid');
		var uscoreIndex = entryid.indexOf('_');
		if(uscoreIndex > 0) {
			entryid = entryid.substr(0, uscoreIndex);
		}

		// When selected from the Address Book, the Contact will contain the Contact Provider
		// GUID inside the Entryid. To correctly open the Contact, we have to unwrap this entryid
		// to get the normal entryid back.
		if (Zarafa.core.EntryId.hasContactProviderGUID(entryid)) {
			entryid = Zarafa.core.EntryId.unwrapContactProviderEntryId(entryid);
		}

		return Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Contact', {
			entryid : entryid,
			message_class : 'IPM.Contact',
			object_type : Zarafa.core.mapi.ObjectType.MAPI_MESSAGE
		}, entryid);
	},

	/**
	 * Convert this recipient into a {@link Zarafa.core.data.IPMRecord record}.
	 * This can only work if this recipient is {@link #isResolved resolved}.
	 *
	 * @return {Zarafa.core.data.IPMRecord} The addressbook record which
	 * is represented by this recipient.
	 */
	convertToDistListRecord : function()
	{
		// Entryids of personal contacts are suffixed with email id (1, 2, 3), so remove that id
		// this is done in php to ensure that we will always have unique entryids
		var entryid = this.get('entryid');
		var uscoreIndex = entryid.indexOf('_');
		if(uscoreIndex > 0) {
			entryid = entryid.substr(0, uscoreIndex);
		}

		// When selected from the Address Book, the Distlist will contain the Contact Provider
		// GUID inside the Entryid. To correctly open the Distlist, we have to unwrap this entryid
		// to get the normal entryid back.
		if (Zarafa.core.EntryId.hasContactProviderGUID(entryid)) {
			entryid = Zarafa.core.EntryId.unwrapContactProviderEntryId(entryid);
		}

		return Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.DistList', {
			entryid : entryid,
			message_class : 'IPM.DistList',
			object_type : Zarafa.core.mapi.ObjectType.MAPI_MESSAGE
		}, entryid);
	},

	/**
	 * Compare this {@link Zarafa.core.data.MAPIRecord record} instance with another one to see
	 * if they are same
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The Record to compare with
	 * @return {Boolean} True if the records are the same.
	 */
	equals : function(record)
	{
		// Simplest case, do we have the same object...
		if (this === record) {
			return true;
		}

		return Zarafa.core.EntryId.compareABEntryIds(this.get('entryid'),record.get('entryid'));
	}
});

Zarafa.core.data.RecordFactory.setBaseClassToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, Zarafa.addressbook.AddressBookRecord);
Zarafa.core.data.RecordFactory.setBaseClassToObjectType(Zarafa.core.mapi.ObjectType.MAPI_DISTLIST, Zarafa.addressbook.AddressBookRecord);
