Ext.namespace('Grommunio.common.rules.dialogs');

/**
 * @class Grommunio.common.rules.dialogs.NoneLink
 * @extends Grommunio.common.rules.dialogs.BaseLink
 * @xtype grommunio.nonelink
 *
 * Condition component for the {@link Grommunio.common.rules.data.ConditionFlags#NONE NONE}
 * This will match every incoming message.
 */
Grommunio.common.rules.dialogs.NoneLink = Ext.extend(Grommunio.common.rules.dialogs.BaseLink, {
	/**
	 * Obtain the condition as configured by the user
	 * @return {Object} The condition
	 */
	getCondition: function()
	{
		if (this.isModified !== true) {
			return this.condition;
		}

		// Invalid conditionFlag
		if (this.conditionFlag !== Grommunio.common.rules.data.ConditionFlags.NONE) {
			return false;
		}

		var conditionFactory = container.getRulesFactoryByType(Grommunio.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
		return conditionDefinition();
	}
});

Ext.reg('grommunio.nonelink', Grommunio.common.rules.dialogs.NoneLink);
