/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 * #dependsFile client/grommunio/core/mapi/RuleStates.js
 */
Ext.namespace('Grommunio.common.rules.data');

Grommunio.common.rules.data.RulesRecordFields = [
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
	{name: 'rule_state', type: 'number', defaultValue: Grommunio.core.mapi.RuleStates.ST_ENABLED},
	{name: 'rule_condition', allowBlank: false},
	{name: 'rule_actions', allowBlank: false},
	{name: 'rule_msg_atleast_size_unit', type: 'string'},
	{name: 'rule_msg_atmost_size_unit', type: 'string'},
	{name: 'rule_exception_atleast_size_unit', type: 'string'},
	{name: 'rule_exception_atmost_size_unit', type: 'string'}
];

/**
 * @class Grommunio.common.rules.data.RulesRecord
 * @extends Grommunio.core.data.MAPIRecord
 *
 * Record will hold information about delegates.
 */
Grommunio.common.rules.data.RulesRecord = Ext.extend(Grommunio.core.data.MAPIRecord, {
	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties: [ 'rule_id' ],

	/**
	 * Indicates that the 'rules_condition' property is valid, and is allowed
	 * to be saved to the server. This can be set by {@link #setConditionsValid}
	 * and will be used by {@link #isValid}.
	 * @property
	 * @type Boolean
	 */
	conditionsValid: true,

	/**
	 * Indicates that the 'rules_actions' property is valid, and is allowed
	 * to be saved to the server. This can be set by {@link #setActionsValid}
	 * and will be used by {@link #isValid}.
	 * @property
	 * @type Boolean
	 */
	actionsValid: true,

	/**
	 * Copy the {@link Grommunio.common.rules.data.RuleRecord RuleRecord} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Grommunio.common.rules.data.RuleRecord} The copy of the record.
	 */
	copy: function(newId)
	{
		var copy = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RULE, this.data, newId || this.id);

		copy.idProperties = this.idProperties.clone();
		copy.phantom = this.phantom;

		return copy.applyData(this);
	},

	/**
	 * Applies all data from an {@link Grommunio.common.rules.data.RuleRecord RuleRecord}
	 * to this instance. This will update all data.
	 *
	 * @param {Grommunio.common.rules.data.RuleRecord} record The record to apply to this
	 * @return {Grommunio.common.rules.data.RuleRecord} this
	 */
	applyData: function(record)
	{
		this.beginEdit();

		Ext.apply(this.data, record.data);
		Ext.apply(this.modified, record.modified);

		this.dirty = record.dirty;

		this.endEdit();

		return this;
	},

	/**
	 * Compare this {@link Grommunio.common.rules.data.RulesRecord RulesRecord} instance
	 * with another one to see if they are same.
	 *
	 * @param {Grommunio.common.rules.data.RulesRecord} record The Record to compare with
	 * @return {Boolean} True if the records are same.
	 */
	equals: function(record)
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
	isOpened: function()
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
	isValid: function()
	{
		return this.conditionsValid && this.actionsValid && Grommunio.common.rules.data.RulesRecord.superclass.isValid.apply(this, arguments);
	},

	/**
	 * Indicate that the 'rules_condition' property is either valid or invalid,
	 * if this function is called with 'false' as argument, then {@link #isValid}
	 * will return false as well, preventing the rule from being saved.
	 * @param {Boolean} valid True if the 'rules_condition' property is valid
	 */
	setConditionsValid: function(valid)
	{
		this.conditionsValid = valid;
	},

	/**
	 * Indicate that the 'rules_actions' property is either valid or invalid,
	 * if this function is called with 'false' as argument, then {@link #isValid}
	 * will return false as well, preventing the rule from being saved.
	 * @param {Boolean} valid True if the 'rules_actions' property is valid
	 */
	setActionsValid: function(valid)
	{
		this.actionsValid = valid;
	},

	/**
	 * Rules Record's 'rule_condition' property contains Conditions and Exceptions.
	 * This function will parse the conditions from {@link Grommunio.core.data.IPMRecord record} record's
	 * 'rule_condition' property. And return Array consists of only conditions.
	 * @param {Object} container is {@link Grommunio.common.rules.dialogs.RulesConditionContainer RulesConditionContainer}
	 * or {@link Grommunio.common.rules.dialogs.RulesExceptionContainer RulesExceptionContainer}
	 * or {@link Grommunio.common.rules.dialogs.BaseContainer BaseContainer}.
	 * Which contain {@link #getConditionsArray} method to get conditions in array.
	 * @return {Array} returns array of conditions.
	 */
	getConditions: function(container)
	{
		var conditions = this.get('rule_condition');

		if (conditions)  {
			conditions = container.getConditionsArray(conditions);
		}
		// If condition is single and null or false.
		else if (conditions !== '') {
			return [conditions];
		}

		// If conditions array contains more than one conditions than only there is chance of exception
        // and conditions array needs to be filtered out.
		if (conditions && conditions.length > 1) {
			conditions = conditions.filter(function(condition) {
				// If condition is null or condition value is not NOT condition and Invalid Exception,
				// only then include the condition in conditions array.
				if (!condition || condition[Grommunio.core.mapi.Restrictions.VALUE] !== Grommunio.core.mapi.Restrictions.RES_NOT &&
					condition !== Grommunio.common.rules.data.ExceptionsConstants.INVALID_EXCEPTION){
					return true;
				}
				return false;
			});
		}

		return conditions;
	},

	/**
	 * Rules Record's 'rule_condition' property contains Conditions and Exceptions.
	 * This function will parse the exceptions from  {@link Grommunio.core.data.IPMRecord record} record's
	 * 'rule_condition' property. And returns Array consists of only exceptions.
	 * @param {Object} container is {@link Grommunio.common.rules.dialogs.RulesConditionContainer RulesConditionContainer}
	 * or {@link Grommunio.common.rules.dialogs.RulesExceptionContainer RulesExceptionContainer}
	 * or {@link Grommunio.common.rules.dialogs.BaseContainer BaseContainer}.
	 * Which contains {@link #getConditionsArray} method to get conditions in array.
	 * @return {Array} returns array of exceptions.
	 */
	getExceptions: function(container)
	{
		var conditions = this.get('rule_condition');
		if (conditions)  {
			conditions = container.getConditionsArray(conditions);
		}

		if (conditions && conditions.length > 1) {
			conditions = conditions.filter(function(condition){
                // If condition value is  NOT condition or Invalid Exception,
                // only then include the condition in conditions array and treat that as exception.
				if ( condition && condition[Grommunio.core.mapi.Restrictions.VALUE] === Grommunio.core.mapi.Restrictions.RES_NOT ||
					condition === Grommunio.common.rules.data.ExceptionsConstants.INVALID_EXCEPTION){
					return true;
				}
				return false;
			});

			if(!Ext.isEmpty(conditions)) {
				return conditions;
			}
		}

		// If there is no Exceptions selected by user.
		return null;
	}
});

// Register a custom type to be used by the Record Factory
Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_RULE');

Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RULE, Grommunio.common.rules.data.RulesRecord);
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RULE, Grommunio.common.rules.data.RulesRecordFields);
