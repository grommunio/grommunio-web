/*
 * #dependsFile client/zarafa/common/rules/data/RulesData.js
 * #dependsFile client/zarafa/common/rules/data/ConditionFlags.js
 */
Ext.namespace('Zarafa.common.data');


/**
 * @class Zarafa.common.data.ConditionRuleFactory
 * The factory class which holds and manages definition of Rules Condition.
 * It also has function to get Exception restriction {@link Zarafa.common.data.ConditionRuleFactory#getExceptionById}
 *
 * @singleton
 */
Zarafa.common.data.ConditionRuleFactory = Ext.extend(Object,{

	/**
	 * Key-value map of condition Definition as registered by
	 * {@link Zarafa.common.rules.data.RulesData#getConditionRestriction}.
	 *
	 * @property
	 * @type Object
	 */
	conditionDefinitions: {},

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};
		this.conditionDefinitions = Zarafa.common.rules.data.RulesData.getConditionRestriction();

		Zarafa.common.data.ConditionRuleFactory.superclass.constructor.call(this, config);
	},

	/**
	 * Register a new Condition Definition for the given key value.
	 * This function will be used to dynamically register a condition definition on runtime.
	 *
	 * @param {Zarafa.common.rules.data.ConditionFlags} key The key value on how the definition is stored
	 * in the definitions table.
	 * @param {Function} conditionFunction which should return restriction for the given key.
	 * @return {Function} The Condition Definition or false if there's problem in registering.
	 * If there already exists a definition for the given key then function will return that definition.
	 */
	registerConditionDefinition : function(key, conditionFunction)
	{
		if (this.conditionDefinitions[key]) {
			return this.conditionDefinitions[key];
		}

		if (!Ext.isEmpty(key) && Ext.isFunction(conditionFunction)) {
			this.conditionDefinitions[key] = conditionFunction;
			return this.conditionDefinitions[key];
		}
		return false;
	},

	/**
	 * Get Condition Definition for the given key value.
	 *
	 * @param {Zarafa.common.rules.data.ConditionFlags} key The key value on how the definition is stored
	 * in the definitions table.
	 * @return {Function} registered Condition Definition from definitions table or false if given condition is not registered.
	 */
	getConditionById : function(key)
	{
		if (!Ext.isEmpty(this.conditionDefinitions[key])) {
			return this.conditionDefinitions[key];
		}
		return false;
	},

	/**
	 * Get Exception restriction for the given key value.
	 *
	 * @param {Zarafa.common.rules.data.ConditionFlags} key The key value on how the definition is stored
	 * in the definitions table.
	 * @return {Object} restriction for the exception else returns false if exception can not be generated.
	 */
	getExceptionById : function(key, options)
	{
		if (Ext.isEmpty(key)) {
			return false;
		}

		var conditionFunction = this.getConditionById(key);
		var condition = Ext.isFunction(conditionFunction) ? conditionFunction(options) : false;
		if (condition) {
			var RestrictionFactory = Zarafa.core.data.RestrictionFactory;
			return RestrictionFactory.createResNot(condition);
		}

		return false;
	},

	/**
	 * Unregister a Condition Definition for the given key value.
	 * This function will be used to dynamically unregister definition on runtime.
	 *
	 * @param {Zarafa.common.rules.data.ConditionFlags} key The key value on how the definition is stored
	 * in the definitions table.
	 * @return {Boolean} The true if successfully definition removed else false.
	 */
	unregisterConditionDefinition : function(key)
	{
		if (!Ext.isEmpty(this.conditionDefinitions[key])) {
			delete this.conditionDefinitions[key];
			return true;
		}
		return false;
	}
});

Zarafa.common.data.AbstractRulesFactory.registerFactory(Zarafa.common.data.RulesFactoryType.CONDITION, new Zarafa.common.data.ConditionRuleFactory());