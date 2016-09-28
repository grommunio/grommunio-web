Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.SentToLink
 * @extends Ext.Container
 * @xtype zarafa.senttolink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#SENT_TO_ME SENT_TO_ME}
 * condition Flag. Which checks if the user is in the TO field.
 */
Zarafa.common.rules.dialogs.SentToLink = Ext.extend(Ext.Container, {

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

		// Invalid conditionFlag
		if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME) {
			return false;
		}

		return Zarafa.core.data.RestrictionFactory.dataResProperty('PR_MESSAGE_TO_ME',
							Zarafa.core.mapi.Restrictions.RELOP_EQ,
		       					true,
							'0x0057000B');
	}
});

Ext.reg('zarafa.senttolink', Zarafa.common.rules.dialogs.SentToLink);
