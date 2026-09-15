/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 * #dependsFile client/grommunio/core/mapi/DisplayType.js
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 * #dependsFile client/grommunio/core/data/Record.js
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 */
Ext.namespace('Grommunio.common.manageCc.data');

/**
 * @class Grommunio.common.manageCc.data.IPMCcRecipientRecordFields
 *
 * Array of default fields for the {@link Grommunio.common.manageCc.data.IPMCcRecipientRecordFields} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Grommunio.common.manageCc.data.IPMCcRecipientRecordFields record}.
 */
Grommunio.common.manageCc.data.IPMCcRecipientRecordFields = [
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
  {name: 'recipient_type', type: 'int', defaultValue: Grommunio.core.mapi.RecipientType.MAPI_CC},
  {name: 'reply_mail', type:'boolean', defaultValue: true},
  {name: 'new_mail', type:'boolean', defaultValue: true}
];

/**
 * @class Grommunio.common.manageCc.data.IPMCcRecipientRecord
 * @extends Grommunio.core.data.IPMRecipientRecord
 */
Grommunio.common.manageCc.data.IPMCcRecipientRecord = Ext.extend(Grommunio.core.data.IPMRecipientRecord, {
});

// Register a custom type to be used by the Record Factory
Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_CC_RECIPIENT');

Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_CC_RECIPIENT, Grommunio.common.manageCc.data.IPMCcRecipientRecord);
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_CC_RECIPIENT, Grommunio.common.manageCc.data.IPMCcRecipientRecordFields);
