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

/**
 * @class Zarafa.hierarchy.data.UserPermissionsRecord
 * @extends Zarafa.core.data.MAPIRecord
 *
 * An extension to the {@link Zarafa.core.data.MAPIRecord MAPIRecord} specific to records which are
 * used as user permissions record
 */
Zarafa.hierarchy.data.UserPermissionsRecord = Ext.extend(Zarafa.core.data.MAPIRecord, {

	/**
	 * Copy the {@link Zarafa.core.data.MAPIRecord Record} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Zarafa.core.data.MAPIRecord} The copy of the record.
	 */
	copy: function(newId)
	{
		var copy = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(
			Zarafa.core.data.RecordCustomObjectType.ZARAFA_USER_PERMISSION,
			this.data,
			newId || this.id
		);

		copy.idProperties = this.idProperties.clone();
		copy.phantom = this.phantom;

		return copy.applyData(this, true);
	}
});

// Register a custom type to be used by the Record Factory
Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_USER_PERMISSION');

Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_USER_PERMISSION, Zarafa.hierarchy.data.UserPermissionsRecord);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_USER_PERMISSION, Zarafa.hierarchy.data.UserPermissionsFields);
