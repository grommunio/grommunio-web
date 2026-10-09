/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 */
Ext.namespace('Grommunio.common.recipientfield.data');

/**
 * @class Grommunio.common.recipientfield.data.SuggestionListRecord
 * @extends Ext.data.Record
 *
 * Contains a description of what a single RecipientField Suggestion item looks like.
 * Is used by the JSON reader in the {@link Grommunio.common.recipientfield.ui.SuggestionListProxy proxy}.
 */
Grommunio.common.recipientfield.data.SuggestionListRecord = Ext.data.Record.create([
	{ name: 'display_name' },
	{ name: 'smtp_address' },
	{ name: 'email_address' },
	{ name: 'address_type' },
	{ name: 'count', type: 'int' },
	{ name: 'last_used', type: 'date', dateFormat:'timestamp' },
	{ name: 'object_type', type: 'int', defaultValue: Grommunio.core.mapi.ObjectType.MAPI_MAILUSER },
	// address book entries only
	{ name: 'entryid' },
	{ name: 'search_key' },
	{ name: 'display_type', type: 'int' },
	{ name: 'display_type_ex', type: 'int' },
	// 'directory' for entries from the address book or contacts instead of the recipient history
	{ name: 'source' }
]);

Grommunio.common.recipientfield.data.SuggestionListRecord = Ext.extend(Grommunio.common.recipientfield.data.SuggestionListRecord, {
	/**
	 * Convert this suggestion record into a {@link Grommunio.core.data.IPMRecipientRecord recipient}
	 * which can be used for composing news mails.
	 *
	 * @param {Grommunio.core.mapi.RecipientType} recipientType (optional) The recipient type which should
	 * be applied to this recipient. Defaults to {@link Grommunio.core.mapi.RecipientType#MAPI_TO}.
	 * @return {Grommunio.core.data.IPMRecipientRecord} The recipientRecord for this addressbook item
	 */
	convertToRecipient: function(recipientType)
	{
		var data = {
			object_type: this.get('object_type'),
			display_name: this.get('display_name'),
			email_address: this.get('email_address'),
			smtp_address: this.get('smtp_address'),
			address_type: this.get('address_type'),
			recipient_type: recipientType || Grommunio.core.mapi.RecipientType.MAPI_TO
		};

		if (!Ext.isEmpty(this.get('entryid'))) {
			Ext.apply(data, {
				entryid: this.get('entryid'),
				search_key: this.get('search_key'),
				display_type: this.get('display_type'),
				display_type_ex: this.get('display_type_ex')
			});
		}

		return Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RECIPIENT, data);
	}
});
