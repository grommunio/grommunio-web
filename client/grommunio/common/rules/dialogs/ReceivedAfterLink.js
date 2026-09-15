Ext.namespace('Grommunio.common.rules.dialogs');

/**
 * @class Grommunio.common.rules.dialogs.ReceivedAfterLink
 * @extends Grommunio.common.rules.dialogs.BaseLink
 * @xtype grommunio.receivedafterlink
 *
 * Condition component for the {@link Grommunio.common.rules.data.ConditionFlags#RECEIVED_AFTER RECEIVED_AFTER}
 * condition. This will allow the user to select a date and can generate a proper
 * condition for it.
 */
Grommunio.common.rules.dialogs.ReceivedAfterLink = Ext.extend(Grommunio.common.rules.dialogs.BaseLink, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: [{
				xtype: 'datefield',
				width: 120,
				ref: 'receivedDate',
				listeners: {
					select: function() { this.isModified = true; },
					scope: this
				}
			}]
		});

		Grommunio.common.rules.dialogs.ReceivedAfterLink.superclass.constructor.call(this, config);
	},

	/**
	 * Apply an action onto the DataView, this will parse the condition and show
	 * the contents in a user-friendly way to the user.
	 * @param {Grommunio.common.rules.data.ConditionFlags} conditionFlag The condition type
	 * which identifies the exact type of the condition.
	 * @param {Object} condition The condition to apply
	 */
	setCondition: function(conditionFlag, condition)
	{
		if (condition) {
			var date = condition[1][Grommunio.core.mapi.Restrictions.VALUE]['PR_MESSAGE_DELIVERY_TIME'];
			this.receivedDate.setValue(new Date(date * 1000));
		} else {
			this.receivedDate.setValue(new Date());
		}

		Grommunio.common.rules.dialogs.ReceivedAfterLink.superclass.setCondition.apply(this, arguments);
	},

	/**
	 * Obtain the condition as configured by the user
	 * @return {Object} The condition
	 */
	getCondition: function()
	{
		if (this.isModified !== true) {
			return this.condition;
		}

		var date = this.receivedDate.getValue();
		date.setHours(23);
		date.setMinutes(59);
		date.setSeconds(59);
		var value = date.getTime() / 1000;

		var conditionFactory = container.getRulesFactoryByType(Grommunio.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
		return conditionDefinition({value: value});
	}
});

Ext.reg('grommunio.receivedafterlink', Grommunio.common.rules.dialogs.ReceivedAfterLink);
