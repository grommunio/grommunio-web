Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.SentToMeLink
 * @extends Ext.Container
 * @xtype zarafa.senttomelink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#SENT_TO_ME_ONLY SENT_TO_ME_ONLY}
 * condition Flag. This will not show anything to the user, but does generate a proper
 * restriction in {@link #getCondition}.
 */
Zarafa.common.rules.dialogs.SentToMeLink = Ext.extend(Ext.Container, {

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
		if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY) {
			return false;
		}

		// Create a restriction
		return RestrictionFactory.createResAnd([
			// The PR_MESSAGE_TO_ME property should be set to 'true'
			RestrictionFactory.dataResProperty('PR_MESSAGE_TO_ME', Restrictions.RELOP_EQ, true, '0x0057000B'),
			// The PR_DISPLAY_TO property should not contain the ';' character (this implies a single recipient).
			RestrictionFactory.createResNot(
				RestrictionFactory.dataResContent('PR_DISPLAY_TO', Restrictions.FL_SUBSTRING, ';', '0x0E04001E')
			),
			// The PR_DISPLAY_CC property should be empty
			RestrictionFactory.dataResProperty('PR_DISPLAY_CC', Restrictions.RELOP_EQ, '', '0x00E03001E')
		]);
	}
});

Ext.reg('zarafa.senttomelink', Zarafa.common.rules.dialogs.SentToMeLink);
