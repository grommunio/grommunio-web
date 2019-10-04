Ext.namespace('Zarafa.common.data');


/**
 * @class Zarafa.common.data.AbstractRulesFactory
 * The factory class for getting sub factory objects of type {@link Zarafa.common.data.ConditionRuleFactory},
 * {@link Zarafa.common.data.ActionRulesFactory}.
 *
 * This is an abstract class which manages sub factories related to Rules.
 *
 * @singleton
 */
Zarafa.common.data.AbstractRulesFactory = {

	/**
	 * Key-value map of Factory Definitions as registered by
	 * {@link Zarafa.common.data.AbstractRulesFactory#registerFactory}.
	 *
	 * @property
	 * @type Object
	 */
	factoryDefinitions : {},

	/**
	 * Register a new Factory Definition for the given key value.
	 * This function will be used to dynamically register a Rules Factories,
	 * like {@link Zarafa.common.data.ActionRulesFactory} and {@link Zarafa.common.data.ConditionRuleFactory}.
	 *
	 * @param {Zarafa.common.data.RulesFactoryType} key The key value on how the factory is stored
	 * in the definitions table.
	 * @param {Object} factoryType object of factory which needs to be registered.
	 * @return {Object} The factory Definition or false if given factory is not registered or
	 * If there exists factory definition for the key then return it.
	 */
	registerFactory : function(key, factoryType)
	{
		if (this.factoryDefinitions[key]) {
			return this.factoryDefinitions[key];
		}

		if (!Ext.isEmpty(key) && Ext.isObject(factoryType)) {
			this.factoryDefinitions[key] = factoryType;
			return this.factoryDefinitions[key];
		}
		return false;
	},

	/**
	 * Get Factory Definition for the given key value.
	 *
	 * @param {Zarafa.common.data.RulesFactoryType} key The key value on how the definition is stored
	 * in the definitions table.
	 * @return {Function} registered Factory Definition from definitions table
	 * or false if given factory is not registered.
	 */
	getFactoryById : function(key)
	{
		if (!Ext.isEmpty(this.factoryDefinitions[key])) {
			return this.factoryDefinitions[key];
		}
		return false;
	},

	/**
	 * Unregister the Factory Definition for the given key value.
	 * This function will be used to dynamically unregister definition on runtime.
	 *
	 * @param {Zarafa.common.data.RulesFactoryType} key The key value on how the definition is stored
	 * in the definitions table.
	 * @return {Boolean} The true if successfully definition removed else false.
	 */
	unregisterFactory : function(key)
	{
		if (!Ext.isEmpty(this.factoryDefinitions[key])) {
			delete this.factoryDefinitions[key];
			return true;
		}
		return false;
	}
};