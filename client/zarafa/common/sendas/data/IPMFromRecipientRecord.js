/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/mapi/DisplayType.js
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 * #dependsFile client/zarafa/core/data/Record.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 */
Ext.namespace('Zarafa.common.sendas.data');

/**
 * @class Zarafa.common.sendas.data.IPMFromRecipientRecordFields
 *
 * Array of default fields for the {@link Zarafa.common.sendas.data.IPMFromRecipientRecordFields} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Zarafa.common.sendas.data.IPMFromRecipientRecordFields record}.
 */
Zarafa.common.sendas.data.IPMFromRecipientRecordFields = [
  {name: 'entryid'},
  {name: 'search_key'},
  {name: 'rowid', type: 'int'},
  {name: 'object_type', type: 'int', defaultValue: Zarafa.core.mapi.ObjectType.MAPI_MAILUSER},
  {name: 'display_name'},
  {name: 'display_type', type: 'int', defaultValue: Zarafa.core.mapi.DisplayType.DT_MAILUSER},
  {name: 'display_type_ex', type: 'int', defaultValue: Zarafa.core.mapi.DisplayType.DT_MAILUSER},
  {name: 'email_address'},
  {name: 'smtp_address'},
  {name: 'address_type', type: 'string', defaultValue: 'SMTP'},
  {name: 'recipient_type', type: 'int'},
  {name: 'reply_mail', type:'boolean', defaultValue: false},
  {name: 'new_mail', type:'boolean', defaultValue: false},
  {name: 'forward_mail', type: 'boolean', defaultValue: false}
];

/**
 * @class Zarafa.common.sendas.data.IPMFromRecipientRecord
 * @extends Zarafa.core.data.IPMRecipientRecord
 */
Zarafa.common.sendas.data.IPMFromRecipientRecord = Ext.extend(Zarafa.core.data.IPMRecipientRecord, {
});

// Register a custom type to be used by the Record Factory
Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_FROM_RECIPIENT');

Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_FROM_RECIPIENT, Zarafa.common.sendas.data.IPMFromRecipientRecord);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_FROM_RECIPIENT, Zarafa.common.sendas.data.IPMFromRecipientRecordFields);
