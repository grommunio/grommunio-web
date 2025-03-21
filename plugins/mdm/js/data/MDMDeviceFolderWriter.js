Ext.namespace('Zarafa.plugins.mdm.data');

/**
 * @class Zarafa.plugins.mdm.data.MDMDeviceFolderWriter
 * @extends Zarafa.core.data.JsonWriter
 *
 * This extension of the {@link Zarafa.core.data.JsonWriter} for writing
 * {@link Zarafa.plugins.mdm.data.MDMDeviceFolderRecord records} in preparation for executing CRUD action on
 * {@link Zarafa.plugins.mdm.data.MDMDeviceFolderStore stores}
 */
Zarafa.plugins.mdm.data.MDMDeviceFolderWriter = Ext.extend(Zarafa.core.data.JsonWriter, {
	/**
	 * Similar to {@link Ext.data.JsonWriter#toHash}
	 *
	 * Convert sharedFolder into a hash. {@link Zarafa.plugins.mdm.data.MDMDeviceFolderRecord folder} exists
	 * within a {@link Zarafa.plugins.mdm.data.MDMDeviceRecord IPMRecord} and thus must be serialized
	 * separately into the hash object.
	 *
	 * @param {Ext.data.Record} record The record to hash
	 * @return {Object} The hashed object
	 * @override
	 * @private
	 */
	toPropHash : function(record)
	{
		var sharedFolderStore = record.getSubStore('sharedfolders');
		var hash = {};

		if (!Ext.isDefined(sharedFolderStore)) {
			return hash;
		}

		// Get list of modified (modified and newly added) records
		var modifiedRecords = sharedFolderStore.getModifiedRecords();
		// Get list of removed records
		var deletedRecords = sharedFolderStore.getRemovedRecords();

		// Adding the modified folder to the add or modified part of the sharedFolder bit
		if (modifiedRecords.length) {
			hash.sharedfolders = {};
			hash.sharedfolders.add = modifiedRecords.map(function(r){return r.data;});
		}

		// Adding the removed folders to the remove part of the sharedFolder bit
		if (deletedRecords.length) {
			hash.sharedfolders = hash.sharedfolders || {};
			hash.sharedfolders.remove = deletedRecords.map(function(r){return r.data;});
		}

		return hash;
	}
});
