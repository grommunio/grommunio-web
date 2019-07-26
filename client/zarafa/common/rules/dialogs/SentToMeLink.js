Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.SentToMeLink
 * @extends Zarafa.common.rules.dialogs.BaseLink
 * @xtype zarafa.senttomelink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#SENT_TO_ME_ONLY SENT_TO_ME_ONLY}
 * condition Flag. This will not show anything to the user, but does generate a proper
 * restriction in {@link #getCondition}.
 */
Zarafa.common.rules.dialogs.SentToMeLink = Ext.extend(Zarafa.common.rules.dialogs.BaseLink, {
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
		if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY) {
			return false;
		}

		// Create a restriction
		var conditionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
		return conditionDefinition();
	}
});

Ext.reg('zarafa.senttomelink', Zarafa.common.rules.dialogs.SentToMeLink);
