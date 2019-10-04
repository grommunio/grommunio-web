Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.SensitivityLink
 * @extends Zarafa.common.rules.dialogs.BaseLink
 * @xtype zarafa.sensitivitylink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#IMPORTANCE IMPORTANCE}
 * condition. This will allow the user to select the preferred sensitivity and can generate a proper
 * condition for it.
 */
Zarafa.common.rules.dialogs.SensitivityLink = Ext.extend(Zarafa.common.rules.dialogs.BaseLink, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items : [{
				xtype : 'combo',
				ref : 'sensitivityCombo',
				width : 100,
				store : {
					xtype : 'jsonstore',
					fields : [ 'name', 'value' ],
					data : Zarafa.common.data.SensitivityFlags.flags
				},
				mode : 'local',
				triggerAction : 'all',
				displayField : 'name',
				valueField : 'value',
				lazyInit : false,
				forceSelection : true,
				editable : false,
				listeners : {
					select : function() { this.isModified = true; },
					scope : this
				}
			}]
		});

		Zarafa.common.rules.dialogs.SensitivityLink.superclass.constructor.call(this, config);
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
		var sensitivity = Zarafa.core.mapi.Sensitivity['NONE'];

		if (condition) {
			sensitivity = condition[1][Zarafa.core.mapi.Restrictions.VALUE]['PR_SENSITIVITY'];
		}

		this.sensitivityCombo.setValue(sensitivity);
		Zarafa.common.rules.dialogs.SensitivityLink.superclass.setCondition.apply(this, arguments);
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

		var value = this.sensitivityCombo.getValue();
		var conditionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);

		return conditionDefinition({value : value});
	}
});

Ext.reg('zarafa.sensitivitylink', Zarafa.common.rules.dialogs.SensitivityLink);
