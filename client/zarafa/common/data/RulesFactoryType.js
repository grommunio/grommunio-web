Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data.RulesFactoryType
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different rule factory types.
 *
 * @singleton
 */
Zarafa.common.data.RulesFactoryType = Zarafa.core.Enum.create({

	/**
	 * Type of Condition factory.
	 * @property
	 * @type Number
	 */
	CONDITION : 0,

	/**
	 * Type of Action factory.
	 * @property
	 * @type Number
	 */
	ACTION : 1
});
