/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 */
Ext.namespace('Zarafa.common.outofoffice.data');

/**
 * @class Zarafa.common.outofoffice.data.OofRecord
 *
 * Array of default fields for the {@link Zarafa.common.outofoffice.data.OofRecord} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Zarafa.common.outofoffice.data.OofRecord record}.
 */
Zarafa.common.outofoffice.data.OofRecordFields = [
    // Here 'entryid' is user's entryid whereas 'store_entryid' is shared user's store's entry id.
    {name: 'entryid'},
    {name: 'store_entryid'},
    {name: 'from',  type: 'int'},
    {name: 'message'},
    {name: 'set'},
    {name: 'subject'},
    {name: 'until',  type: 'int'},
];

/**
 * @class Zarafa.common.outofoffice.data.OofRecord
 * @extends Zarafa.core.data.MAPIRecord
 */
Zarafa.common.outofoffice.data.OofRecord = Ext.extend(Zarafa.core.data.MAPIRecord, {
    /**
     * The base array of ID properties which is copied to the {@link #idProperties}
     * when the record is being created.
     * @property
     * @type Array
     * @private
     */
    baseIdProperties: ['store_entryid'],
});

// Register a custom type to be used by the Record Factory
Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_OOF_SETTINGS');

Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_OOF_SETTINGS, Zarafa.common.outofoffice.data.OofRecord);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_OOF_SETTINGS , Zarafa.common.outofoffice.data.OofRecordFields);
