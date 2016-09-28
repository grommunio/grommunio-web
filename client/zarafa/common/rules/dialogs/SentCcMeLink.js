Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.SentCcMeLink
 * @extends Ext.Container
 * @xtype zarafa.senttomelink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#SENT_TO_ME_ONLY SENT_TO_ME_ONLY}
 * condition Flag. This will not show anything to the user, but does generate a proper
 * restriction in {@link #getCondition}.
 */
Zarafa.common.rules.dialogs.SentCcMeLink = Ext.extend(Ext.Container, {

	/**
	 * The Condition type which is handled by this view
	 * This is set during {@link #setCondition}.
	 * @property
	 * @type Zarafa.common.rules.data.ConditionFlags
	 */
	conditionFlag : undefined,

	/**
	 * The condition property which was configured during
	 * {@link #setCondition}.
	 * @property
	 * @type Object
	 */
	 condition : undefined,

	 /**
	  * True if the condition was modified by the user, if this is false,
	  * then {@link #getCondition} will return {@link #condition} instead
	  * of returning a new object.
	  * @property
	  * @type Boolean
	  */
	isModified : false,

	/**
	 * Apply an action onto the DataView, this will parse the condition and show
	 * the contents in a user-friendly way to the user.
	 * @param {Zarafa.common.rules.data.ConditionFlags} conditionFlag The condition type
	 * which identifies the exact type of the condition.
	 * @param {Object} condition The condition to apply
	 */
	setCondition : function(conditionFlag, condition)
	{
		this.conditionFlag = conditionFlag;
		this.condition = condition;
		this.isModified = !Ext.isDefined(condition);
	},

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
		if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.SENT_CC_ME) {
			return false;
		}

		// Create a restriction
		return RestrictionFactory.createResAnd([
			RestrictionFactory.dataResProperty('PR_MESSAGE_CC_ME', Restrictions.RELOP_EQ, true, '0x0059000B'),
			RestrictionFactory.dataResProperty('PR_MESSAGE_RECIP_ME', Restrictions.RELOP_EQ, true, '0x0058000B'),
			RestrictionFactory.dataResProperty('PR_MESSAGE_TO_ME', Restrictions.RELOP_EQ, false, '0x0057000B')
		]);
	}
});

Ext.reg('zarafa.sentccmelink', Zarafa.common.rules.dialogs.SentCcMeLink);
