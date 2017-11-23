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

		var RestrictionFactory = Zarafa.core.data.RestrictionFactory;
		var Restrictions = Zarafa.core.mapi.Restrictions;
		var value = this.receivedDate.getValue().getTime()/1000;

		return RestrictionFactory.dataResProperty('PR_MESSAGE_DELIVERY_TIME', Restrictions.RELOP_LT, value);
	}
});

Ext.reg('zarafa.receivedbeforelink', Zarafa.common.rules.dialogs.ReceivedBeforeLink);
