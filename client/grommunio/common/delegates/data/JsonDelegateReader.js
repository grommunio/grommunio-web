Ext.namespace('Grommunio.common.delegates.data');

/**
 * @class Grommunio.common.delegates.data.JsonDelegateReader
 * @extends Grommunio.core.data.JsonReader
 */
Grommunio.common.delegates.data.JsonDelegateReader = Ext.extend(Grommunio.core.data.JsonReader, {
	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DELEGATE}.
	 */
	constructor: function(meta, recordType)
	{
		meta = meta || {};

		Ext.applyIf(meta, {
			id: 'entryid',
			idProperty: 'entryid',
			dynamicRecord: false
		});

		// If no recordType is provided, force the type to be a delegate
		if (!Ext.isDefined(recordType)) {
			recordType = Grommunio.core.data.RecordFactory.getRecordClassByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DELEGATE);
		}

		Grommunio.common.delegates.data.JsonDelegateReader.superclass.constructor.call(this, meta, recordType);
	}
});
