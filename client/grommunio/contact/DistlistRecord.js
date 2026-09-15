/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/contact/DistlistMemberStore.js
 */
Ext.namespace('Grommunio.contact');

/**
 * @class Grommunio.contact.DistListRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.DistList' type messages.
 */
Grommunio.contact.DistListRecordFields = [
	{name: 'fileas'},
	{name: 'dl_name'},
	{name: 'subject'},
	{name: 'display_name'},
	{name: 'sensitivity', type: 'int', defaultValue: Grommunio.core.mapi.Sensitivity.NONE},
	{name: 'address_type', type: 'string', defaultValue: 'SMTP'},
	{name: 'private', type: 'boolean', defaultValue: false}
];

/**
 * @class Grommunio.contact.DistlistRecord
 * @extends Grommunio.core.data.IPMRecord
 *
 * An extension to the {@link Grommunio.core.data.IPMRecord IPMRecord} specific to records which are
 * used as Distribution Lists
 */
Grommunio.contact.DistlistRecord = Ext.extend(Grommunio.core.data.IPMRecord, {
	/**
	 * Convert this distribution list record into a {@link Grommunio.core.data.IPMRecipientRecord recipient}
	 * which can be used for composing news mails.
	 *
	 * @param {Grommunio.core.mapi.RecipientType} recipientType (optional) The recipient type which should
	 * be applied to this recipient. Defaults to {@link Grommunio.core.mapi.RecipientType#MAPI_TO}.
	 * @return {Grommunio.core.data.IPMRecipientRecord} The recipientRecord for this addressbook item
	 */
	convertToRecipient: function(recipientType)
	{
		var recipientRecord = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RECIPIENT, {
			entryid: Grommunio.core.EntryId.wrapContactProviderEntryId(this.get('entryid'), Grommunio.core.mapi.ObjectType.MAPI_DISTLIST),
			object_type: Grommunio.core.mapi.ObjectType.MAPI_DISTLIST,
			display_type: Grommunio.core.mapi.DisplayType.DT_DISTLIST,
			display_type_ex: Grommunio.core.mapi.DisplayType.DT_DISTLIST,
			display_name: this.get('display_name'),
			email_address: this.get('fileas'),
			address_type: 'MAPIPDL',
			recipient_type: recipientType || Grommunio.core.mapi.RecipientType.MAPI_TO
		});

		return recipientRecord;
	},

	/**
	 * Convert this {@link Grommunio.contact.DistlistRecord DistlistRecord} into a {@link Grommunio.contact.DistlistMemberRecord DistlistMemberRecord}
	 * which can be used as record inside {@link Grommunio.contact.DistlistMemberStore}.
	 * @return {Grommunio.contact.DistlistMemberRecord} The distribution list member for distlist item.
	 */
	convertToDistlistMember: function()
	{
		return Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DISTLIST_MEMBER, {
			entryid: this.get('entryid'),
			address_type: 'MAPIPDL',
			// mapi_parseoneoff will fail if we don't give email_address
			email_address: this.get('fileas'),
			distlist_type: Grommunio.core.mapi.DistlistType.DL_DIST,
			display_name: this.get('display_name')
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
	 * Creates a Folder store for the {@link Grommunio.core.data.IPMRecord IPMRecord} (See {@link #createSubStore}).
	 * @return {Grommunio.core.data.IPMRecipientStore} The new Folder store.
	 */
	createMemberStore: function()
	{
		return this.createSubStore('members');
	},

	/**
	 * Set the Member store for the {@link Grommunio.core.data.IPMRecord record} (See {@link #setSubStore}).
	 * @param {Grommunio.core.data.IPMRecipientStore} memberStore The Member store.
	 * @return {Grommunio.core.data.IPMRecipientStore} The Member store.
	 */
	setMemberStore: function(memberStore)
	{
		return this.setSubStore('members', memberStore);
	},

	/**
	 * Get the Members store for the {@link Grommunio.core.data.IPMRecord IPMRecord} (See {@link #getSubStore}).
	 * @return {Grommunio.core.data.IPMRecipientStore} The Members store.
	 */
	getMemberStore: function()
	{
		return this.getSubStore('members');
	},

	/**
	 * Helper function to return names of all members of distribution list.
	 * @return {String} comma separated member names
	 */
	getMemberNames: function()
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

Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.DistList', Grommunio.contact.DistListRecordFields);
Grommunio.core.data.RecordFactory.setSubStoreToMessageClass('IPM.DistList', 'members', Grommunio.contact.DistlistMemberStore);
Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('IPM.DistList', Grommunio.contact.DistlistRecord);
