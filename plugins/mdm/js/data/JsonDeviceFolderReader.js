Ext.namespace('Zarafa.plugins.mdm.data');

/**
 * @class Zarafa.plugins.mdm.data.JsonDeviceFolderReader
 * @extends Zarafa.core.data.JsonReader
 *
 * This extension of the {@link Zarafa.core.data.JsonReader} supports
 * {@link Zarafa.plugins.mdm.data.MDMDeviceStore stores} which can hold different type of
 * {@link Zarafa.plugins.mdm.data.MDMDeviceRecord records}.
 */
Zarafa.plugins.mdm.data.JsonDeviceFolderReader = Ext.extend(Zarafa.core.data.JsonReader, {
	
	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Zarafa.core.data.RecordCustomObjectType#MDM_Device_Folder}.
	 */
	constructor: function (meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			id: 'folderid',
			idProperty: 'folderid',
			dynamicRecord: false
		});

		if (!Ext.isDefined(recordType)) {
			recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(meta.customObjectType);
		}

		Zarafa.plugins.mdm.data.JsonDeviceFolderReader.superclass.constructor.call(this, meta, recordType);
	}
});
