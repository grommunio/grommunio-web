/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 * #dependsFile client/zarafa/core/mapi/DistlistType.js
 */
Ext.namespace('Zarafa.contact');

/**
 * @class Zarafa.contact.DistlistMemberFields
 * Array of default fields for the {@link Zarafa.contact.DistlistMemberRecord} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Zarafa.contact.DistlistMemberRecord record}.
 */
Zarafa.contact.DistlistMemberFields = [
	{name: 'entryid'},
	{name: 'display_name'},
	{name: 'address_type', type: 'string', defaultValue: 'SMTP'},
	{name: 'distlist_type', type: 'int', defaultValue: Zarafa.core.mapi.DistlistType.DL_EXTERNAL_MEMBER},
	{name: 'email_address'}
];

/**
 * @class Zarafa.contact.DistlistMemberRecord
 * @extends Ext.data.Record
 */
Zarafa.contact.DistlistMemberRecord = Ext.extend(Ext.data.Record, {
	idProperties : ['entryid'],

	/**
	 * Copy the {@link Zarafa.contact.DistlistMemberRecord Record} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Zarafa.contact.DistlistMemberRecord} The copy of the record.
	 */
	copy : function(newId)
	{
		var copy = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DISTLIST_MEMBER, this.data, newId || this.id);

		copy.idProperties = this.idProperties.clone();
		copy.phantom = this.phantom;

		return copy.applyData(this);
	},

	/**
	 * Applies all data from an {@link Zarafa.contact.DistlistMemberRecord DistlistMemberRecord}
	 * to this instance. This will update all data.
	 * 
	 * @param {Zarafa.contact.DistlistMemberRecord} record The record to apply to this
	 * @return {Zarafa.contact.DistlistMemberRecord} this
	 */
	applyData : function(record)
	{
		this.beginEdit();

		Ext.apply(this.data, record.data);
		Ext.apply(this.modified, record.modified);

		this.dirty = record.dirty;

		this.endEdit();

		return this;
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
		return Zarafa.core.EntryId.compareEntryIds(this.get('entryid'), record.get('entryid'));
	},

	/**
	 * Convert this distlist member into a {@link Zarafa.addressbook.AddressBookRecord record}
	 * which can be used in the addressbook.
	 *
	 * @return {Zarafa.addressbook.AddressBookRecord} The addressbook record which
	 * is represented by this recipient.
	 */
	convertToAddressBookRecord : function()
	{
		var entryid = this.get('entryid');
		var distlistType = this.get('distlist_type');

		// use the distlist_type to determine which ObjectType of the
		// addressbook entry. This will allow us to open the correct dialog.
		var objectType = Zarafa.core.mapi.ObjectType.MAPI_MAILUSER;
		if(distlistType == Zarafa.core.mapi.DistlistType.DL_DIST_AB) {
			objectType = Zarafa.core.mapi.ObjectType.MAPI_DISTLIST;
		}

		return Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(objectType, {
			entryid: entryid,
			object_type: objectType
		}, entryid);
	},

	/**
	 * Convert this distlist member into a {@link Zarafa.contact.ContactRecord}
	 * which can be used in the addressbook.
	 *
	 * @return {Zarafa.contact.ContactRecord} The addressbook record which
	 * is represented by this distlist member.
	 */
	convertToContactRecord : function()
	{
		var entryid = this.get('entryid');
		var distlistType = this.get('distlist_type');

		// use the distlist_type to determine message_class of contact record
		// addressbook entry. This will allow us to open the correct dialog.
		var messageClass = 'IPM.Contact';
		if(distlistType === Zarafa.core.mapi.DistlistType.DL_DIST) {
			messageClass = 'IPM.DistList';
		}

		// When selected from the Address Book, the Contact will contain the Contact Provider
		// GUID inside the Entryid. To correctly open the Contact, we have to unwrap this entryid
		// to get the normal entryid back.
		if (Zarafa.core.EntryId.hasContactProviderGUID(entryid)) {
			entryid = Zarafa.core.EntryId.unwrapContactProviderEntryId(entryid);
		}

		return Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass(messageClass, {
			entryid : entryid,
			message_class : messageClass,
			object_type : Zarafa.core.mapi.ObjectType.MAPI_MESSAGE
		}, entryid);
	},

	// below functions are used by recipient field for resolving, but we don't it at the moment
	/**
	 * @return {Boolean} True if this member has been {@link #attemptedToResolve attempted to resolve},
	 * but turned out to be ambiguous. Currently it only returns false.
	 */
	isAmbiguous : function()
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
	isResolved : function()
	{
		return true;
	}
});

// Register a custom type to be used by the Record Factory
Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_DISTLIST_MEMBER');

Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DISTLIST_MEMBER, Zarafa.contact.DistlistMemberFields);
Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DISTLIST_MEMBER, Zarafa.contact.DistlistMemberRecord);
