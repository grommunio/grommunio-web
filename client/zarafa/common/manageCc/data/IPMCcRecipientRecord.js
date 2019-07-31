/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/mapi/DisplayType.js
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 * #dependsFile client/zarafa/core/data/Record.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 */
Ext.namespace('Zarafa.common.manageCc.data');

/**
 * @class Zarafa.common.manageCc.data.IPMCcRecipientRecordFields
 *
 * Array of default fields for the {@link Zarafa.common.manageCc.data.IPMCcRecipientRecordFields} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Zarafa.common.manageCc.data.IPMCcRecipientRecordFields record}.
 */
Zarafa.common.manageCc.data.IPMCcRecipientRecordFields = [
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
    {name: 'recipient_type', type: 'int', defaultValue: Zarafa.core.mapi.RecipientType.MAPI_CC},
    {name : 'reply_mail', type:'boolean', defaultValue : true},
    {name : 'new_mail', type:'boolean', defaultValue : true}
];

/**
 * @class Zarafa.common.manageCc.data.IPMCcRecipientRecord
 * @extends Zarafa.core.data.IPMRecipientRecord
 */
Zarafa.common.manageCc.data.IPMCcRecipientRecord = Ext.extend(Zarafa.core.data.IPMRecipientRecord, {
});

// Register a custom type to be used by the Record Factory
Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_CC_RECIPIENT');

Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_CC_RECIPIENT, Zarafa.common.manageCc.data.IPMCcRecipientRecord);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_CC_RECIPIENT, Zarafa.common.manageCc.data.IPMCcRecipientRecordFields);
