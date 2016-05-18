Ext.namespace('Zarafa.common.rules.data');

/**
 * @class Zarafa.common.rules.data.JsonRulesReader
 * @extends Zarafa.core.data.JsonReader
 */
Zarafa.common.rules.data.JsonRulesReader = Ext.extend(Zarafa.core.data.JsonReader, {
	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Zarafa.core.data.RecordCustomObjectType#ZARAFA_RULE}.
	 */
	constructor : function(meta, recordType)
	{
		meta = meta || {};

		Ext.applyIf(meta, {
			id : 'rule_id',
			idProperty : 'rule_id',
			dynamicRecord : false
		});

		// If no recordType is provided, force the type to be a rule
		if (!Ext.isDefined(recordType)) {
			recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RULE);
		}

		Zarafa.common.rules.data.JsonRulesReader.superclass.constructor.call(this, meta, recordType);
	}
});