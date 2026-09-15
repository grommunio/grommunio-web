/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 */
Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.IPMExpandDistlistRecord
 * @extends Ext.data.Record
 *
 * Contains a description of what a single member of expanded distribution item looks like.
 * Is used by the JSON reader in the {@link Grommunio.core.data.IPMRecipientStore#expandReader}.
 */
Grommunio.core.data.IPMExpandDistlistRecord = Ext.data.Record.create([
	{name: 'display_name'},
	{name: 'address_type'},
	{name: 'smtp_address'},
	{name: 'email_address'},
	{name: 'entryid'},
	{name: 'search_key'},
	{name: 'object_type', type: 'int'},
	{name: 'display_type', type: 'int'},
	{name: 'display_type_ex', type: 'int'}
]);

Grommunio.core.data.IPMExpandDistlistRecord = Ext.extend(Grommunio.core.data.IPMExpandDistlistRecord, {
	/**
	 * Convert this record into a {@link Grommunio.core.data.IPMRecipientRecord recipient}
	 * which can be used for composing news mails and meeting requests.
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
			entryid: this.get('entryid'),
			search_key: this.get('search_key'),
			display_type_ex: this.get('display_type_ex'),
			recipient_type: recipientType || Grommunio.core.mapi.RecipientType.MAPI_TO
		});

		return recipientRecord;
	}
});
