/*
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 */
Ext.namespace('Grommunio.contact.data');

/**
 * @class Grommunio.contact.data.JsonMemberReader
 * @extends Grommunio.core.data.JsonReader
 */
Grommunio.contact.data.JsonMemberReader = Ext.extend(Grommunio.core.data.JsonReader, {
	/**
	 * @cfg {Grommunio.core.data.RecordCustomObjectType} customObjectType The custom object type
	 * which represents the {@link Ext.data.Record records} which should be created using
	 * {@link Grommunio.core.data.RecordFactory#createRecordObjectByCustomType}.
	 */
	customObjectType: Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DISTLIST_MEMBER,

	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Grommunio.core.data.RecordCustomObjectType#GROMMUNIO_DISTLIST_MEMBER}.
	 */
	constructor: function(meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			dynamicRecord: false
		});

		// If no recordType is provided, force the type to be a Distlist Member
		if (!Ext.isDefined(recordType)) {
			recordType = Grommunio.core.data.RecordFactory.getRecordClassByCustomType(meta.customObjectType || this.customObjectType);
		}

		Grommunio.contact.data.JsonMemberReader.superclass.constructor.call(this, meta, recordType);
	}
});
