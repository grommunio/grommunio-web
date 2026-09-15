/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.data');


/**
 * @class Grommunio.common.data.AbstractRulesFactory
 * The factory class for getting sub factory objects of type {@link Grommunio.common.data.ConditionRuleFactory},
 * {@link Grommunio.common.data.ActionRulesFactory}.
 *
 * This is an abstract class which manages sub factories related to Rules.
 *
 * @singleton
 */
Grommunio.common.data.AbstractRulesFactory = {

	/**
	 * Key-value map of Factory Definitions as registered by
	 * {@link Grommunio.common.data.AbstractRulesFactory#registerFactory}.
	 *
	 * @property
	 * @type Object
	 */
	factoryDefinitions: {},

	/**
	 * Register a new Factory Definition for the given key value.
	 * This function will be used to dynamically register a Rules Factories,
	 * like {@link Grommunio.common.data.ActionRulesFactory} and {@link Grommunio.common.data.ConditionRuleFactory}.
	 *
	 * @param {Grommunio.common.data.RulesFactoryType} key The key value on how the factory is stored
	 * in the definitions table.
	 * @param {Object} factoryType object of factory which needs to be registered.
	 * @return {Object} The factory Definition or false if given factory is not registered or
	 * If there exists factory definition for the key then return it.
	 */
	registerFactory: function(key, factoryType)
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
	 * @param {Grommunio.common.data.RulesFactoryType} key The key value on how the definition is stored
	 * in the definitions table.
	 * @return {Function} registered Factory Definition from definitions table
	 * or false if given factory is not registered.
	 */
	getFactoryById: function(key)
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
	 * @param {Grommunio.common.data.RulesFactoryType} key The key value on how the definition is stored
	 * in the definitions table.
	 * @return {Boolean} The true if successfully definition removed else false.
	 */
	unregisterFactory: function(key)
	{
		if (!Ext.isEmpty(this.factoryDefinitions[key])) {
			delete this.factoryDefinitions[key];
			return true;
		}
		return false;
	}
};
