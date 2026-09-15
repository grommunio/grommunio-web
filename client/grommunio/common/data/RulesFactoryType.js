Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.common.data.RulesFactoryType
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different rule factory types.
 *
 * @singleton
 */
Grommunio.common.data.RulesFactoryType = Grommunio.core.Enum.create({

	/**
	 * Type of Condition factory.
	 * @property
	 * @type Number
	 */
	CONDITION: 0,

	/**
	 * Type of Action factory.
	 * @property
	 * @type Number
	 */
	ACTION: 1
});
