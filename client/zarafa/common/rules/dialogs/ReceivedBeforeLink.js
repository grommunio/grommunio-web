Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.ReceivedBeforeLink
 * @extends Ext.Container
 * @xtype zarafa.receivedbeforelink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#RECEIVED_BEFORE RECEIVED_BEFORE}
 * condition. This will allow the user to select a date and can generate a proper
 * condition for it.
 */
Zarafa.common.rules.dialogs.ReceivedBeforeLink = Ext.extend(Ext.Container, {

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
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items : [{
				xtype : 'datefield',
				width: 120,
				ref : 'receivedDate',
				listeners : {
					select : function() { this.isModified = true; },
					scope : this
				}
			}]
		});

		Zarafa.common.rules.dialogs.ReceivedBeforeLink.superclass.constructor.call(this, config);
	},

	/**
	 * Apply an action onto the DataView, this will parse the condition and show
	 * the contents in a user-friendly way to the user.
	 * @param {Zarafa.common.rules.data.ConditionFlags} conditionFlag The condition type
	 * which identifies the exact type of the condition.
	 * @param {Object} condition The condition to apply
	 */
	setCondition : function(conditionFlag, condition)
	{
		if (condition) {
			var date = condition[1][Zarafa.core.mapi.Restrictions.VALUE]['PR_MESSAGE_DELIVERY_TIME'];
			this.receivedDate.setValue(new Date(date * 1000));
		} else {
			this.receivedDate.setValue(new Date());
		}

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
		var value = this.receivedDate.getValue().getTime()/1000;

		return RestrictionFactory.dataResProperty('PR_MESSAGE_DELIVERY_TIME', Restrictions.RELOP_LT, value);
	}
});

Ext.reg('zarafa.receivedbeforelink', Zarafa.common.rules.dialogs.ReceivedBeforeLink);
