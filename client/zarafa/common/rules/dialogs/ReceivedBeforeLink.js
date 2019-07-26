Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.ReceivedBeforeLink
 * @extends Zarafa.common.rules.dialogs.ReceivedAfterLink
 * @xtype zarafa.receivedbeforelink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#RECEIVED_BEFORE RECEIVED_BEFORE}
 * condition. This will allow the user to select a date and can generate a proper
 * condition for it.
 */
Zarafa.common.rules.dialogs.ReceivedBeforeLink = Ext.extend(Zarafa.common.rules.dialogs.ReceivedAfterLink, {
	/**
	 * Obtain the condition as configured by the user
	 * @return {Object} The condition
	 */
	getCondition : function()
	{
		if (this.isModified !== true) {
			return this.condition;
		}

		var value = this.receivedDate.getValue().getTime()/1000;
		var conditionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);

		return conditionDefinition({value : value});
	}
});

Ext.reg('zarafa.receivedbeforelink', Zarafa.common.rules.dialogs.ReceivedBeforeLink);
