Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.RulesConditionContainer
 * @extends Zarafa.common.rules.dialogs.BaseContainer
 * @xtype zarafa.rulesconditioncontainer
 *
 * The container in which all conditions can be edited. This container
 * can be expanded to include multiple conditions, and is able to parse
 * the rules_condition property of a {@link Zarafa.common.rules.data.RulesRecord rule}.
 */
Zarafa.common.rules.dialogs.RulesConditionContainer = Ext.extend(Zarafa.common.rules.dialogs.BaseContainer, {

	/**
	 * Array which holds selected Conditions by user.
	 * This Array is changed by {@link #update}.
	 * @property
	 * @type Array
	 * @private
	 */
	conditions: [],

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = Ext.apply(config || {},{
			id : 'rule-condition-container',
			addBtnName : _('Add condition'),
			removeBtnName : _('Remove condition')
		});

		Zarafa.common.rules.dialogs.RulesConditionContainer.superclass.constructor.call(this, config);
	},

	/**
	 * Generic function to create containers in which a condition is represented. This consists of
	 * two components, the first one is the combobox in which the condition type is selected, and the
	 * second in which special option for the given condition can be configured.
	 * @param {Number} The index of the condition which is created
	 * @return {Object} config object to create a {@link Ext.Container}.
	 * @private
	 */
	createComboBoxContainer : function(index)
	{
		var id =  'rule-condition-' + String(index);
		var profileStore = {
			xtype : 'jsonstore',
			fields : [
				{ name : 'name' },
				{ name : 'value', type : 'int' }
			],
			data : Zarafa.common.rules.data.ConditionProfiles
		};

		return Zarafa.common.rules.dialogs.RulesConditionContainer.superclass.createComboBoxContainer.call(this, id, profileStore);
	},


	/**
	 * Updates the panel by loading data from the record into the form panel.
	 * @param {Zarafa.common.rules.data.RulesRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;
		var conditions = record.getConditions(this);

		// If conditions exist in record then only compare with config property conditions.
		var isConditionsChanged = conditions ? !conditions.equals(this.conditions) : false;
		if (contentReset || isConditionsChanged) {
			//update conditions config with the latest conditions.
			this.conditions = conditions;

			if (Ext.isEmpty(conditions)) {
				this.setBoxContainerCount(1);
				return;
			}

			// We have to ensure that there are sufficient condition fields
			// present in the container. When the rule doesn't have any
			// condition specified, we will create an empty condition
			var count = Math.max(1, conditions.length);
			this.setBoxContainerCount(count);

			for (var i = 0, len = conditions.length; i < len; i++) {
				// Apply the action to the corresponding container
				if (conditions[i]) {
					this.applyCondition(this.get(i), conditions[i]);
				}
			}
		}
	},

	/**
	 * Update the given {@link Zarafa.core.data.IPMRecord record} with
	 * the values from this {@link Ext.Panel panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 */
	updateRecord : function(record)
	{
		var conditions = [];
		var conditionsValid = true;

		for (var i = 0; i < this.boxContainerCount; i++) {
			var panel = this.get(i);
			var combo = panel.get(0);
			var activeItem = panel.get(1).layout.activeItem;
			var condition = null;

			if (Ext.isFunction(activeItem.getCondition)) {
				condition = activeItem.getCondition();
			}

			// If no valid condition was found, then
			// we have a problem and we can't save
			// the action. Break out of the loop
			// and invalidate the rule_condition property.
			if (!condition) {
				combo.markInvalid();
				conditionsValid = false;
			}
			conditions.push(condition);
		}
		record.setConditionsValid(conditionsValid);

		// Set latest Conditions in the record.
		this.updateConditionsInRecord(record, conditions);
	}
});

Ext.reg('zarafa.rulesconditioncontainer', Zarafa.common.rules.dialogs.RulesConditionContainer);
