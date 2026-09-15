/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 * #dependsFile client/grommunio/core/mapi/DistlistType.js
 */
Ext.namespace('Grommunio.contact');

/**
 * @class Grommunio.contact.DistlistMemberFields
 * Array of default fields for the {@link Grommunio.contact.DistlistMemberRecord} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Grommunio.contact.DistlistMemberRecord record}.
 */
Grommunio.contact.DistlistMemberFields = [
	{name: 'entryid'},
	{name: 'display_name'},
	{name: 'address_type', type: 'string', defaultValue: 'SMTP'},
	{name: 'distlist_type', type: 'int', defaultValue: Grommunio.core.mapi.DistlistType.DL_EXTERNAL_MEMBER},
	{name: 'email_address'},
	{name: 'smtp_address'}
];

/**
 * @class Grommunio.contact.DistlistMemberRecord
 * @extends Ext.data.Record
 */
Grommunio.contact.DistlistMemberRecord = Ext.extend(Ext.data.Record, {
	idProperties: ['entryid'],

	/**
	 * Copy the {@link Grommunio.contact.DistlistMemberRecord Record} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Grommunio.contact.DistlistMemberRecord} The copy of the record.
	 */
	copy: function(newId)
	{
		var copy = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DISTLIST_MEMBER, this.data, newId || this.id);

		copy.idProperties = this.idProperties.clone();
		copy.phantom = this.phantom;

		return copy.applyData(this);
	},

	/**
	 * Applies all data from an {@link Grommunio.contact.DistlistMemberRecord DistlistMemberRecord}
	 * to this instance. This will update all data.
	 *
	 * @param {Grommunio.contact.DistlistMemberRecord} record The record to apply to this
	 * @return {Grommunio.contact.DistlistMemberRecord} this
	 */
	applyData: function(record)
	{
		this.beginEdit();

		Ext.apply(this.data, record.data);
		Ext.apply(this.modified, record.modified);

		this.dirty = record.dirty;

		this.endEdit();

		return this;
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
		return Grommunio.core.EntryId.compareEntryIds(this.get('entryid'), record.get('entryid'));
	},

	/**
	 * Convert this distlist member into a {@link Grommunio.addressbook.AddressBookRecord record}
	 * which can be used in the addressbook.
	 *
	 * @return {Grommunio.addressbook.AddressBookRecord} The addressbook record which
	 * is represented by this recipient.
	 */
	convertToAddressBookRecord: function()
	{
		var entryid = this.get('entryid');
		var distlistType = this.get('distlist_type');

		// use the distlist_type to determine which ObjectType of the
		// addressbook entry. This will allow us to open the correct dialog.
		var objectType = Grommunio.core.mapi.ObjectType.MAPI_MAILUSER;
		if(distlistType == Grommunio.core.mapi.DistlistType.DL_DIST_AB) {
			objectType = Grommunio.core.mapi.ObjectType.MAPI_DISTLIST;
		}

		return Grommunio.core.data.RecordFactory.createRecordObjectByObjectType(objectType, {
			entryid: entryid,
			object_type: objectType
		}, entryid);
	},

	/**
	 * Convert this distlist member into a {@link Grommunio.contact.ContactRecord}
	 * which can be used in the addressbook.
	 *
	 * @return {Grommunio.contact.ContactRecord} The addressbook record which
	 * is represented by this distlist member.
	 */
	convertToContactRecord: function()
	{
		var entryid = this.get('entryid');
		var distlistType = this.get('distlist_type');

		// use the distlist_type to determine message_class of contact record
		// addressbook entry. This will allow us to open the correct dialog.
		var messageClass = 'IPM.Contact';
		if(distlistType === Grommunio.core.mapi.DistlistType.DL_DIST) {
			messageClass = 'IPM.DistList';
		}

		// When selected from the Address Book, the Contact will contain the Contact Provider
		// GUID inside the Entryid. To correctly open the Contact, we have to unwrap this entryid
		// to get the normal entryid back.
		if (Grommunio.core.EntryId.hasContactProviderGUID(entryid)) {
			entryid = Grommunio.core.EntryId.unwrapContactProviderEntryId(entryid);
		}

		return Grommunio.core.data.RecordFactory.createRecordObjectByMessageClass(messageClass, {
			entryid: entryid,
			message_class: messageClass,
			object_type: Grommunio.core.mapi.ObjectType.MAPI_MESSAGE
		}, entryid);
	},

	// below functions are used by recipient field for resolving, but we don't it at the moment
	/**
	 * @return {Boolean} True if this member has been {@link #attemptedToResolve attempted to resolve},
	 * but turned out to be ambiguous. Currently it only returns false.
	 */
	isAmbiguous: function()
	{
		return false;
	},

	/**
	 * @return {Boolean} True if it was attempted to resolve this recipient. Currently only returns true.
	 */
	attemptedToResolve: function()
	{
		return true;
	},

	/**
	 * Checks if a member is resolved or not, currently only returns true.
	 * @return {Boolean} True if this member has been resolved.
	 */
	isResolved: function()
	{
		return true;
	}
});

// Register a custom type to be used by the Record Factory
Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_DISTLIST_MEMBER');

Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DISTLIST_MEMBER, Grommunio.contact.DistlistMemberFields);
Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DISTLIST_MEMBER, Grommunio.contact.DistlistMemberRecord);
