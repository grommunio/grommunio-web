/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 * #dependsFile client/zarafa/core/mapi/RuleStates.js
 */
Ext.namespace('Zarafa.common.rules.data');

Zarafa.common.rules.data.RulesRecordFields = [
	{name: 'rule_id', type: 'number'},
	{name: 'rule_name', type: 'string'},
	/*
	 * identifies the client application that owns the rule. should always be RuleOrganizer
	 * that is also same for outlook, for delegate rule it will be Schedule+ EMS interface
	 */
	{name: 'rule_provider', type: 'string', defaultValue: 'RuleOrganizer'},
	// property is not used and should always be 0
	{name: 'rule_level', type: 'number', defaultValue: 0},

	{name: 'rule_sequence', type: 'number'},
	{name: 'rule_state', type: 'number', defaultValue: Zarafa.core.mapi.RuleStates.ST_ENABLED},
	{name: 'rule_condition', allowBlank : false},
	{name: 'rule_actions', allowBlank : false}
];

/**
 * @class Zarafa.common.rules.data.RulesRecord
 * @extends Zarafa.core.data.MAPIRecord
 * 
 * Record will hold information about delegates.
 */
Zarafa.common.rules.data.RulesRecord = Ext.extend(Zarafa.core.data.MAPIRecord, {
	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties : [ 'rule_id' ],

	/**
	 * Indicates that the 'rules_condition' property is valid, and is allowed
	 * to be saved to the server. This can be set by {@link #setConditionsValid}
	 * and will be used by {@link #isValid}.
	 * @property
	 * @type Boolean
	 */
	conditionsValid : true,

	/**
	 * Indicates that the 'rules_actions' property is valid, and is allowed
	 * to be saved to the server. This can be set by {@link #setActionsValid}
	 * and will be used by {@link #isValid}.
	 * @property
	 * @type Boolean
	 */
	actionsValid : true,

	/**
	 * Copy the {@link Zarafa.common.rules.data.RuleRecord RuleRecord} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Zarafa.common.rules.data.RuleRecord} The copy of the record.
	 */
	copy : function(newId)
	{
		var copy = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RULE, this.data, newId || this.id);

		copy.idProperties = this.idProperties.clone();
		copy.phantom = this.phantom;

		return copy.applyData(this);
	},

	/**
	 * Applies all data from an {@link Zarafa.common.rules.data.RuleRecord RuleRecord}
	 * to this instance. This will update all data.
	 * 
	 * @param {Zarafa.common.rules.data.RuleRecord} record The record to apply to this
	 * @return {Zarafa.common.rules.data.RuleRecord} this
	 */
	applyData : function(record)
	{
		this.beginEdit();

		Ext.apply(this.data, record.data);
		Ext.apply(this.modified, record.modified);

		this.dirty = record.dirty;

		this.endEdit();

		return this;
	},

	/**
	 * Compare this {@link Zarafa.common.rules.data.RulesRecord RulesRecord} instance
	 * with another one to see if they are same.
	 * 
	 * @param {Zarafa.common.rules.data.RulesRecord} record The Record to compare with
	 * @return {Boolean} True if the records are same.
	 */
	equals : function(record)
	{
		// Simplest case, do we have the same object...
		if (this === record) {
			return true;
		}

		return this.get('rule_id') === record.get('rule_id');
	},

	/**
	 * @return {Boolean} always returns true because we don't need to get extra information
	 * about this record from server.
	 */
	isOpened : function()
	{
		return true;
	},

	/**
	 * By default returns <tt>false</tt> if any {@link Ext.data.Field field} within the
	 * record configured with <tt>{@link Ext.data.Field#allowBlank} = false</tt> returns
	 * <tt>true</tt> from an {@link Ext}.{@link Ext#isEmpty isempty} test.
	 * Additionally this checks for {@link #conditionsValid} and {@link #actionsValid}.
	 * @return {Boolean}
	 */
	isValid : function()
	{
		return this.conditionsValid && this.actionsValid && Zarafa.common.rules.data.RulesRecord.superclass.isValid.apply(this, arguments);
	},

	/**
	 * Indicate that the 'rules_condition' property is either valid or invalid,
	 * if this function is called with 'false' as argument, then {@link #isValid}
	 * will return false as well, preventing the rule from being saved.
	 * @param {Boolean} valid True if the 'rules_condition' property is valid
	 */
	setConditionsValid : function(valid)
	{
		this.conditionsValid = valid;
	},

	/**
	 * Indicate that the 'rules_actions' property is either valid or invalid,
	 * if this function is called with 'false' as argument, then {@link #isValid}
	 * will return false as well, preventing the rule from being saved.
	 * @param {Boolean} valid True if the 'rules_actions' property is valid
	 */
	setActionsValid : function(valid)
	{
		this.actionsValid = valid;
	}
});

// Register a custom type to be used by the Record Factory
Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_RULE');

Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RULE, Zarafa.common.rules.data.RulesRecord);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RULE, Zarafa.common.rules.data.RulesRecordFields);
