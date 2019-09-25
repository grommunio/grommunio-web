Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.NameToCcLink
 * @extends Zarafa.common.rules.dialogs.BaseLink
 * @xtype zarafa.senttomelink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#NAME_TO_CC NAME_TO_CC}
 * condition Flag. This will not show anything to the user, but does generate a proper
 * restriction in {@link #getCondition}.
 */
Zarafa.common.rules.dialogs.NameToCcLink = Ext.extend(Zarafa.common.rules.dialogs.BaseLink, {
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
		if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.NAME_TO_CC) {
			return false;
		}

		return Zarafa.core.data.RestrictionFactory.dataResProperty('PR_MESSAGE_RECIP_ME',
				Zarafa.core.mapi.Restrictions.RELOP_EQ, true, '0x0059000B');
	}
});

Ext.reg('zarafa.nametocclink', Zarafa.common.rules.dialogs.NameToCcLink);
