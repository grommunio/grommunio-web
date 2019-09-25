/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 */
Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMExpandDistlistRecord
 * @extends Ext.data.Record
 *
 * Contains a description of what a single memeber of expanded distribution item looks like.
 * Is used by the JSON  reader in the {@link Zarafa.core.data.IPMRecipientStore#expandReader}.
 */
Zarafa.core.data.IPMExpandDistlistRecord = Ext.data.Record.create([
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

Zarafa.core.data.IPMExpandDistlistRecord = Ext.extend(Zarafa.core.data.IPMExpandDistlistRecord, {
	/**
	 * Convert this record into a {@link Zarafa.core.data.IPMRecipientRecord recipient}
	 * which can be used for composing news mails and meeting requests.
	 *
	 * @param {Zarafa.core.mapi.RecipientType} recipientType (optional) The recipient type which should
	 * be applied to this recipient. Defaults to {@link Zarafa.core.mapi.RecipientType#MAPI_TO}.
	 * @return {Zarafa.core.data.IPMRecipientRecord} The recipientRecord for this addressbook item
	 */
	convertToRecipient : function(recipientType)
	{
		var recipientRecord = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, {
			object_type : this.get('object_type'),
			display_name : this.get('display_name'),
			email_address : this.get('email_address'),
			smtp_address : this.get('smtp_address'),
			address_type : this.get('address_type'),
			entryid : this.get('entryid'),
			search_key : this.get('search_key'),
			display_type_ex : this.get('display_type_ex'),
			recipient_type : recipientType || Zarafa.core.mapi.RecipientType.MAPI_TO
		});

		return recipientRecord;
	}
});
