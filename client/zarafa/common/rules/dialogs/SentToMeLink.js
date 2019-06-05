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

		var RestrictionFactory = Zarafa.core.data.RestrictionFactory;
		var Restrictions = Zarafa.core.mapi.Restrictions;

		// Invalid conditionFlag
		if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY) {
			return false;
		}

		// Create a restriction
		return RestrictionFactory.createResAnd([
			// The PR_MESSAGE_TO_ME property should be set to 'true'
			RestrictionFactory.dataResProperty('PR_MESSAGE_TO_ME', Restrictions.RELOP_EQ, true),
			// The PR_DISPLAY_TO property should not contain the ';' character (this implies a single recipient).
			RestrictionFactory.createResNot(
				RestrictionFactory.dataResContent('PR_DISPLAY_TO', Restrictions.FL_SUBSTRING, ';')
			),
			// The PR_DISPLAY_CC property should be empty
			RestrictionFactory.dataResProperty('PR_DISPLAY_CC', Restrictions.RELOP_EQ, '')
		]);
	}
});

Ext.reg('zarafa.senttomelink', Zarafa.common.rules.dialogs.SentToMeLink);
