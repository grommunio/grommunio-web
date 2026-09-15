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
	{ name: 'object_type', type: 'int', defaultValue: Grommunio.core.mapi.ObjectType.MAPI_MAILUSER }
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
		var recipientRecord = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RECIPIENT, {
			object_type: this.get('object_type'),
			display_name: this.get('display_name'),
			email_address: this.get('email_address'),
			smtp_address: this.get('smtp_address'),
			address_type: this.get('address_type'),
			recipient_type: recipientType || Grommunio.core.mapi.RecipientType.MAPI_TO
		});

		return recipientRecord;
	}
});
