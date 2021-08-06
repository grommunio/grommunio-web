Ext.namespace('Zarafa.plugins.mdm.data');

/**
 * @class Zarafa.plugins.mdm.data.JsonCertificateReader
 * @extends Zarafa.core.data.JsonReader
 */
Zarafa.plugins.mdm.data.JsonCertificateReader = Ext.extend(Zarafa.core.data.JsonReader, {

	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Zarafa.core.mapi.ObjectType#MAPI_MDM}.
	 */
	constructor: function (meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			dynamicRecord: false
		});
		recordType = Zarafa.core.data.RecordFactory.getRecordClassByMessageClass('IPM.MDM');

		Zarafa.plugins.mdm.data.JsonCertificateReader.superclass.constructor.call(this, meta, recordType);
	}
});
