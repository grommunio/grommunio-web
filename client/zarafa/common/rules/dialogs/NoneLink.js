Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.NoneLink
 * @extends Zarfa.common.rules.BaseLink
 * @xtype zarafa.nonelink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#NONE NONE}
 * This will match every incoming message.
 */
Zarafa.common.rules.dialogs.NoneLink = Ext.extend(Zarafa.common.rules.dialogs.BaseLink, {
	/**
	 * Obtain the condition as configured by the user
	 * @return {Object} The condition
	 */
	getCondition : function()
	{
		if (this.isModified !== true) {
			return this.condition;
		}

		// Invalid conditionFlag
		if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.NONE) {
			return false;
		}

		var conditionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
		return conditionDefinition();
	}
});

Ext.reg('zarafa.nonelink', Zarafa.common.rules.dialogs.NoneLink);
