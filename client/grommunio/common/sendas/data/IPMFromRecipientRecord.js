/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 * #dependsFile client/grommunio/core/mapi/DisplayType.js
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 * #dependsFile client/grommunio/core/data/Record.js
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 */
Ext.namespace('Grommunio.common.sendas.data');

/**
 * @class Grommunio.common.sendas.data.IPMFromRecipientRecordFields
 *
 * Array of default fields for the {@link Grommunio.common.sendas.data.IPMFromRecipientRecordFields} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Grommunio.common.sendas.data.IPMFromRecipientRecordFields record}.
 */
Grommunio.common.sendas.data.IPMFromRecipientRecordFields = [
  {name: 'entryid'},
  {name: 'search_key'},
  {name: 'rowid', type: 'int'},
  {name: 'object_type', type: 'int', defaultValue: Grommunio.core.mapi.ObjectType.MAPI_MAILUSER},
  {name: 'display_name'},
  {name: 'display_type', type: 'int', defaultValue: Grommunio.core.mapi.DisplayType.DT_MAILUSER},
  {name: 'display_type_ex', type: 'int', defaultValue: Grommunio.core.mapi.DisplayType.DT_MAILUSER},
  {name: 'email_address'},
  {name: 'smtp_address'},
  {name: 'address_type', type: 'string', defaultValue: 'SMTP'},
  {name: 'recipient_type', type: 'int'},
  {name: 'reply_mail', type:'boolean', defaultValue: false},
  {name: 'new_mail', type:'boolean', defaultValue: false},
  {name: 'forward_mail', type: 'boolean', defaultValue: false}
];

/**
 * @class Grommunio.common.sendas.data.IPMFromRecipientRecord
 * @extends Grommunio.core.data.IPMRecipientRecord
 */
Grommunio.common.sendas.data.IPMFromRecipientRecord = Ext.extend(Grommunio.core.data.IPMRecipientRecord, {
});

// Register a custom type to be used by the Record Factory
Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_FROM_RECIPIENT');

Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_FROM_RECIPIENT, Grommunio.common.sendas.data.IPMFromRecipientRecord);
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_FROM_RECIPIENT, Grommunio.common.sendas.data.IPMFromRecipientRecordFields);
