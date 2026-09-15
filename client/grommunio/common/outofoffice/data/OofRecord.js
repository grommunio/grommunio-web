/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 */
Ext.namespace('Grommunio.common.outofoffice.data');

/**
 * @class Grommunio.common.outofoffice.data.OofRecord
 *
 * Array of default fields for the {@link Grommunio.common.outofoffice.data.OofRecord} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Grommunio.common.outofoffice.data.OofRecord record}.
 */
Grommunio.common.outofoffice.data.OofRecordFields = [
  // Here 'entryid' is user's entryid whereas 'store_entryid' is shared user's store's entry id.
  {name: 'entryid'},
  {name: 'store_entryid'},
  {name: 'from', type: 'int'},
  {name: 'internal_reply'},
  {name: 'set'},
  {name: 'internal_subject'},
  {name: 'until', type: 'int'},
  {name: 'allow_external'},
  {name: 'external_audience'},
  {name: 'external_reply'},
  {name: 'external_subject'}
];

/**
 * @class Grommunio.common.outofoffice.data.OofRecord
 * @extends Grommunio.core.data.MAPIRecord
 */
Grommunio.common.outofoffice.data.OofRecord = Ext.extend(Grommunio.core.data.MAPIRecord, {
  /**
   * The base array of ID properties which is copied to the {@link #idProperties}
   * when the record is being created.
   * @property
   * @type Array
   * @private
   */
  baseIdProperties: ['store_entryid']
});

// Register a custom type to be used by the Record Factory
Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_OOF_SETTINGS');

Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_OOF_SETTINGS, Grommunio.common.outofoffice.data.OofRecord);
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_OOF_SETTINGS , Grommunio.common.outofoffice.data.OofRecordFields);
