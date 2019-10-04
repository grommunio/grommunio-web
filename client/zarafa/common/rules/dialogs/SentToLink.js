Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.SentToLink
 * @extends Zarafa.common.rules.dialogs.BaseLink
 * @xtype zarafa.senttolink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#SENT_TO_ME SENT_TO_ME}
 * condition Flag. Which checks if the user is in the TO field.
 */
Zarafa.common.rules.dialogs.SentToLink = Ext.extend(Zarafa.common.rules.dialogs.BaseLink, {
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
		if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME) {
			return false;
		}

		var conditionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
		return conditionDefinition();
	}
});

Ext.reg('zarafa.senttolink', Zarafa.common.rules.dialogs.SentToLink);
