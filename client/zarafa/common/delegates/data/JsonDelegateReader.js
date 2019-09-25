Ext.namespace('Zarafa.common.delegates.data');

/**
 * @class Zarafa.common.delegates.data.JsonDelegateReader
 * @extends Zarafa.core.data.JsonReader
 */
Zarafa.common.delegates.data.JsonDelegateReader = Ext.extend(Zarafa.core.data.JsonReader, {
	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Zarafa.core.data.RecordCustomObjectType.ZARAFA_DELEGATE}.
	 */
	constructor : function(meta, recordType)
	{
		meta = meta || {};

		Ext.applyIf(meta, {
			id : 'entryid',
			idProperty : 'entryid',
			dynamicRecord : false
		});

		// If no recordType is provided, force the type to be a delegate
		if (!Ext.isDefined(recordType)) {
			recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DELEGATE);
		}

		Zarafa.common.delegates.data.JsonDelegateReader.superclass.constructor.call(this, meta, recordType);
	}
});