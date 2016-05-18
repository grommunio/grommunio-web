/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 */
Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.UserPermissionsFields
 *
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.hierarchy.data.UserPermissionsFields PermissionsRecord} object.
 */
Zarafa.hierarchy.data.UserPermissionsFields = [
	{name: 'entryid'},
	{name: 'display_name'},
	{name: 'object_type', type: 'int', defaultValue: Zarafa.core.mapi.ObjectType.MAPI_MAILUSER},
	{name: 'rights', type: 'int', defaultValue: Zarafa.core.mapi.Rights.RIGHTS_NONE}
];

// Register a custom type to be used by the Record Factory
Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_USER_PERMISSION');

Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_USER_PERMISSION, Zarafa.core.data.MAPIRecord);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_USER_PERMISSION, Zarafa.hierarchy.data.UserPermissionsFields);
