/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 */
Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.AddressBookHierchyRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all
 * {@link Grommunio.core.mapi.ObjectType.MAPI_ABCONT MAPI_ABCONT} type messages.
 */
Grommunio.addressbook.AddressBookHierchyRecordFields = [
	{name: 'entryid'},
	{name: 'display_name'},
	{name: 'type'},
	{name: 'store_entryid'},
	{name: 'parent_entryid'},
	{name: 'depth', type: 'int', defaultValue: 0},
	{name: 'group_header', type: 'boolean', defaultValue: false}
];

Grommunio.core.data.RecordFactory.setBaseClassToObjectType(Grommunio.core.mapi.ObjectType.MAPI_ABCONT, Grommunio.core.data.MAPIRecord);
Grommunio.core.data.RecordFactory.addFieldToObjectType(Grommunio.core.mapi.ObjectType.MAPI_ABCONT, Grommunio.addressbook.AddressBookHierchyRecordFields);
