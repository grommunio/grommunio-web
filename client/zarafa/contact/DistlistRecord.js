/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/contact/DistlistMemberStore.js
 */
Ext.namespace('Zarafa.contact');

/**
 * @class Zarafa.contact.DistListRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.DistList' type messages.
 */
Zarafa.contact.DistListRecordFields = [
	{name: 'fileas'},
	{name: 'dl_name'},
	{name: 'subject'},
	{name: 'display_name'},
	{name: 'sensitivity', type: 'int', defaultValue: Zarafa.core.mapi.Sensitivity.NONE},
	{name: 'address_type', type: 'string', defaultValue: 'SMTP'},
	{name: 'private', type: 'boolean', defaultValue: false}
];

/**
 * @class Zarafa.contact.DistlistRecord
 * @extends Zarafa.core.data.IPMRecord
 * 
 * An extension to the {@link Zarafa.core.data.IPMRecord IPMRecord} specific to records which are
 * used as Distribution Lists
 */
Zarafa.contact.DistlistRecord = Ext.extend(Zarafa.core.data.IPMRecord, {
	/**
	 * Convert this distribution list record into a {@link Zarafa.core.data.IPMRecipientRecord recipient}
	 * which can be used for composing news mails.
	 *
	 * @param {Zarafa.core.mapi.RecipientType} recipientType (optional) The recipient type which should
	 * be applied to this recipient. Defaults to {@link Zarafa.core.mapi.RecipientType#MAPI_TO}.
	 * @return {Zarafa.core.data.IPMRecipientRecord} The recipientRecord for this addressbook item
	 */
	convertToRecipient : function(recipientType)
	{
		var recipientRecord = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, {
			entryid : Zarafa.core.EntryId.wrapContactProviderEntryId(this.get('entryid'), Zarafa.core.mapi.ObjectType.MAPI_DISTLIST),
			object_type : Zarafa.core.mapi.ObjectType.MAPI_DISTLIST,
			display_type : Zarafa.core.mapi.DisplayType.DT_DISTLIST,
			display_type_ex : Zarafa.core.mapi.DisplayType.DT_DISTLIST,
			display_name : this.get('display_name'),
			email_address : this.get('fileas'),
			address_type : 'MAPIPDL',
			recipient_type : recipientType || Zarafa.core.mapi.RecipientType.MAPI_TO
		});

		return recipientRecord;
	},

	/**
	 * Convert this {@link Zarafa.contact.DistlistRecord DistlistRecord} into a {@link Zarafa.contact.DistlistMemberRecord DistlistMemberRecord}
	 * which can be used as record inside {@link Zarafa.contact.DistlistMemberStore}.
	 * @return {Zarafa.contact.DistlistMemberRecord} The distribution list member for distlist item.
	 */
	convertToDistlistMember : function()
	{
		return Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DISTLIST_MEMBER, {
			entryid : this.get('entryid'),
			address_type : 'MAPIPDL',
			// mapi_parseoneoff will fail if we don't give email_address
			email_address : this.get('fileas'),
			distlist_type : Zarafa.core.mapi.DistlistType.DL_DIST,
			display_name : this.get('display_name')
		});
	},

	/**
	 * Returns whether the IPMRecord supports the use of recipients or not (See {@link #supportsSubStore}).
	 * @return {Boolean} True if recipients are supported.
	 */
	supportsMembers: function()
	{
		return this.supportsSubStore('members');
	},

	/**
	 * Creates a Folder store for the {@link Zarafa.core.data.IPMRecord IPMRecord} (See {@link #createSubStore}).
	 * @return {Zarafa.core.data.IPMRecipientStore} The new Folder store.
	 */
	createMemberStore : function()
	{
		return this.createSubStore('members');
	},

	/**
	 * Set the Member store for the {@link Zarafa.core.data.IPMRecord record} (See {@link #setSubStore}).
	 * @param {Zarafa.core.data.IPMRecipientStore} memberStore The Member store.
	 * @return {Zarafa.core.data.IPMRecipientStore} The Member store.
	 */
	setMemberStore : function(memberStore)
	{
		return this.setSubStore('members', memberStore);
	},

	/**
	 * Get the Members store for the {@link Zarafa.core.data.IPMRecord IPMRecord} (See {@link #getSubStore}).
	 * @return {Zarafa.core.data.IPMRecipientStore} The Members store.
	 */
	getMemberStore : function()
	{
		return this.getSubStore('members');
	},

	/**
	 * Helper function to return names of all members of distribution list.
	 * @return {String} comma seperated member names
	 */
	getMemberNames : function()
	{
		var store = this.getSubStore('members');
		var names = [];

		store.each(function(member) {
			var name = member.get('display_name');

			if(!Ext.isEmpty(name)) {
				names.push(name);
			} else {
				names.push(member.get('email_address'));
			}
		}, this);

		return names.join('; ');
	}
});

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.DistList', Zarafa.contact.DistListRecordFields);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('IPM.DistList', 'members', Zarafa.contact.DistlistMemberStore);
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.DistList', Zarafa.contact.DistlistRecord);
