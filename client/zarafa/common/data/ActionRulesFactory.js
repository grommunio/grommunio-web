/*
 * #dependsFile client/zarafa/common/rules/data/RulesData.js
 */
Ext.namespace('Zarafa.common.data');


/**
 * @class Zarafa.common.data.ActionRulesFactory
 * The factory class which holds and manages definition of Rules Actions.
 *
 * @singleton
 */
Zarafa.common.data.ActionRulesFactory = Ext.extend(Object,{

	/**
	 * Key-value map of Action Definitions as registered by
	 * {@link Zarafa.common.rules.data.RulesData#getAction}.
	 *
	 * @property
	 * @type Object
	 */
	actionDefinitions : {},

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};
		this.actionDefinitions = Zarafa.common.rules.data.RulesData.getAction();

		Zarafa.common.data.ActionRulesFactory.superclass.constructor.call(this, config);
	},

	/**
	 * Register a new Action Definition for the given key value.
	 * This function will be used to dynamically register an action definition on runtime.
	 *
	 * @param {Zarafa.common.rules.data.ActionFlags} key The key value on how the definition is stored
	 * in the definitions table.
	 * @param {Function} actionFunction which should return action object for the given key.
	 * @return {Function} The Action Definition or false if given condition is not registered.
	 * If there already exists a definition then function will return that definition.
	 */
	registerActionDefinition : function(key, actionFunction)
	{
		if (this.actionDefinitions[key]) {
			return this.actionDefinitions[key];
		}

		if (!Ext.isEmpty(key) && Ext.isFunction(actionFunction)) {
			this.actionDefinitions[key] = actionFunction;
			return this.actionDefinitions[key];
		}
		return false;
	},

	/**
	 * Get Action Definition for the given key value.
	 *
	 * @param {Zarafa.common.rules.data.ActionFlags} key The key value on how the definition is stored
	 * in the definitions table.
	 * @return {Function} registered Action Definition from definitions table or false if given condition is not registered.
	 */
	getActionById : function(key)
	{
		if (!Ext.isEmpty(this.actionDefinitions[key])) {
			return this.actionDefinitions[key];
		}
		return false;
	},

	/**
	 * Unregister the Action Definition for the given key value.
	 * This function will be used to dynamically unregister definition on runtime.
	 *
	 * @param {Zarafa.common.rules.data.ActionFlags} key The key value on how the definition is stored
	 * in the definitions table.
	 * @return {Boolean} true if successfully definition removed else false.
	 */
	unregisterActionDefinition : function(key)
	{
		if (!Ext.isEmpty(this.actionDefinitions[key])) {
			delete this.actionDefinitions[key];
			return true;
		}
		return false;
	}
});

Zarafa.common.data.AbstractRulesFactory.registerFactory(Zarafa.common.data.RulesFactoryType.ACTION, new Zarafa.common.data.ActionRulesFactory());