/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 */
Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.AddressBookHierchyRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all
 * {@link Zarafa.core.mapi.ObjectType.MAPI_ABCONT MAPI_ABCONT} type messages.
 */
Zarafa.addressbook.AddressBookHierchyRecordFields = [
	{name: 'entryid'},
	{name: 'display_name'},
	{name: 'type'},
	{name: 'store_entryid'},
	{name: 'parent_entryid'},
	{name: 'depth', type: 'int', defaultValue: 0}
];

Zarafa.core.data.RecordFactory.setBaseClassToObjectType(Zarafa.core.mapi.ObjectType.MAPI_ABCONT, Zarafa.core.data.MAPIRecord);
Zarafa.core.data.RecordFactory.addFieldToObjectType(Zarafa.core.mapi.ObjectType.MAPI_ABCONT, Zarafa.addressbook.AddressBookHierchyRecordFields);
