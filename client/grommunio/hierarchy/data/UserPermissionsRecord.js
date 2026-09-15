/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 */
Ext.namespace('Grommunio.hierarchy.data');

/**
 * @class Grommunio.hierarchy.data.UserPermissionsFields
 *
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.hierarchy.data.UserPermissionsFields PermissionsRecord} object.
 */
Grommunio.hierarchy.data.UserPermissionsFields = [
	{name: 'entryid'},
	{name: 'display_name'},
	{name: 'object_type', type: 'int', defaultValue: Grommunio.core.mapi.ObjectType.MAPI_MAILUSER},
	{name: 'rights', type: 'int', defaultValue: Grommunio.core.mapi.Rights.RIGHTS_NONE}
];

/**
 * @class Grommunio.hierarchy.data.UserPermissionsRecord
 * @extends Grommunio.core.data.MAPIRecord
 *
 * An extension to the {@link Grommunio.core.data.MAPIRecord MAPIRecord} specific to records which are
 * used as user permissions record
 */
Grommunio.hierarchy.data.UserPermissionsRecord = Ext.extend(Grommunio.core.data.MAPIRecord, {

	/**
	 * Copy the {@link Grommunio.core.data.MAPIRecord Record} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Grommunio.core.data.MAPIRecord} The copy of the record.
	 */
	copy: function(newId)
	{
		var copy = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(
			Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_USER_PERMISSION,
			this.data,
			newId || this.id
		);

		copy.idProperties = this.idProperties.clone();
		copy.phantom = this.phantom;

		return copy.applyData(this, true);
	}
});

// Register a custom type to be used by the Record Factory
Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_USER_PERMISSION');

Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_USER_PERMISSION, Grommunio.hierarchy.data.UserPermissionsRecord);
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_USER_PERMISSION, Grommunio.hierarchy.data.UserPermissionsFields);
