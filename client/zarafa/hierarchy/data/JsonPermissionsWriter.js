Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.JsonPermissionsWriter
 * @extends Zarafa.core.data.JsonWriter
 */
Zarafa.hierarchy.data.JsonPermissionsWriter = Ext.extend(Zarafa.core.data.JsonWriter, {
	/**
	 * Similar to {@link Ext.data.JsonWriter#toHash}
	 *
	 * Convert permissions into a hash. Permissions exists as
	 * {@link Zarafa.hierarchy.data.UserPermissionsRecord UserPermissionsRecord} within
	 * a {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord} and thus must be serialized
	 * seperately into the hash object.
	 *
	 * @param {Ext.data.Record} record The record to hash
	 * @return {Object} The hashed object
	 * @override
	 * @private
	 */
	toPropHash : function(record)
	{
		var permissionsStore = record.getSubStore('permissions');
		var hash = {};

		if (!Ext.isDefined(permissionsStore)) {
			return hash;
		}

		// Get list of modified (modified and newly added) records
		var modifiedRecords = permissionsStore.getModifiedRecords();
		// Get list of removed records
		var deletedRecords = permissionsStore.getRemovedRecords();

		if (modifiedRecords.length > 0 || deletedRecords.length > 0) {
			hash.permissions = {};

			// Adding the modified records to the add or modified part of the permissions bit
			for (var i = 0; i < modifiedRecords.length; i++) {
				var permission = modifiedRecords[i];
				// FIXME: serialize?
				var data = permission.data;

				if (permission.phantom) {
					if(!Ext.isDefined(hash.permissions.add)) {
						hash.permissions.add = [];
					}

					hash.permissions.add.push(data);
				} else {
					// Recipient already exists and needs to be updated
					if(!Ext.isDefined(hash.permissions.modify)) {
						hash.permissions.modify = [];
					}

					hash.permissions.modify.push(data);
				}
			}

			// Adding the removed records to the remove part of the permissions bit
			for (var i = 0; i < deletedRecords.length; i++) {
				var permission = deletedRecords[i];
				var data = permission.data;

				if (!Ext.isDefined(hash.permissions.remove)) {
					hash.permissions.remove = [];
				}

				hash.permissions.remove.push(data);
			}
		}

		return hash;
	}
});
