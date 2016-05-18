Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.RulesConditionContainer
 * @extends Ext.Container
 * @xtype zarafa.rulesconditioncontainer
 *
 * The container in which all conditions can be edited. This container
 * can be expanded to include multiple conditions, and is able to parse
 * the rules_condition property of a {@link Zarafa.common.rules.data.RulesRecord rule}.
 */
Zarafa.common.rules.dialogs.RulesConditionContainer = Ext.extend(Ext.Container, {
	/**
	 * The current number of condition boxes which are present in the container.
	 * This number is changed by {@link #addConditionBox} and {@link #removeConditionBox}.
	 * @property
	 * @type Number
	 * @private
	 */
	conditionCount : 0,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			layout : 'form',
			autoHeight: true,
			items : [{
				xtype : 'zarafa.compositefield',
				hideLabel : true,
				items : [{
					xtype : 'button',
					ref : '../addConditionBtn',
					text : _('Add condition'),
					handler : this.addConditionBox,
					scope : this
				},{
					xtype : 'button',
					ref : '../removeConditionBtn',
					text : _('Remove condition'),
					handler : this.removeConditionBox,
					scope : this
				}]
			}]
		});

		Zarafa.common.rules.dialogs.RulesConditionContainer.superclass.constructor.call(this, config);
	},

	/**
	 * Generic function to create containers in which a condition is represented. This consists of
	 * 2 components, the first one is the combobox in which the condition type is selected, and the
	 * second in which special option for the given condition can be configured.
	 * @param {Number} The index of the condition which is created
	 * @return {Object} config object to create a {@link Ext.Container}.
	 * @private
	 */
	createConditionBox : function(index)
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

		return {
			xtype : 'container',
			id : id,
			flex : 1,
			height : 25,
			layout : {
				type : 'hbox',
				align : 'stretch',
				defaultMargins : '0 5 0 0'
			},
			items : [{
				xtype : 'combo',
				width : 300,
				store : profileStore,
				mode : 'local',
				triggerAction : 'all',
				displayField : 'name',
				valueField : 'value',
				lazyInit : false,
				forceSelection : true,
				editable : false,
				value : _('Select one...'),
				listeners : {
					'select' : this.onConditionComboSelect,
					'scope' : this
				}
			}, {
				xtype : 'container',
				flex : 1,
				layout : 'card',
				activeItem : 0,
				items : this.createConditionContentPanels(id)
			}]
		};
	},

	/**
	 * Create a set of ContentPanels which are used to configure the various condition type.
	 * The array which is returned contains should be applied on a {@link Ext.Container} with
	 * a {@link Ext.layout.CardLayout CardLayout} to ensure only one container is visible
	 * at a time.
	 * In each container the user is able to set various configuration options for the
	 * condition type as selected in the combobox.
	 * @param {String} baseId The baseId which is used to create the id for the individual containers.
	 * @return {Array} Array of config objects to create a {@link Ext.Container}.
	 * @private
	 */
	createConditionContentPanels : function(baseId)
	{
		return [{
			xtype : 'container',
			id : baseId + '-empty'
		},{
			xtype : 'zarafa.userselectionlink',
			id : baseId + '-from'
		},{
			xtype : 'zarafa.wordselectionlink',
			id : baseId + '-senderwords'
		},{
			xtype : 'zarafa.wordselectionlink',
			id : baseId + '-words'
		},{
			xtype : 'zarafa.wordselectionlink',
			id : baseId + '-bodywords'
		},{
			xtype : 'zarafa.importancelink',
			id : baseId + '-importance'
		},{
			xtype : 'zarafa.userselectionlink',
			id : baseId + '-to'
		},{
			xtype : 'zarafa.senttomelink',
			id : baseId + '-to-me'
		}];
	},

	/**
	 * Function that can be used to add more conditions in a rule.
	 * @return {Ext.Container} The Condition Box which was inserted
	 * @private
	 */
	addConditionBox : function()
	{
		this.conditionCount++;

		var container = this.createConditionBox(this.conditionCount);
		container = this.insert(this.items.getCount() - 1, container);

		// Toggle the removeConditionBtn
		this.removeConditionBtn.setDisabled(this.conditionCount <= 1);

		this.doLayout();

		return container;
	},

	/**
	 * Function that can be used to remove a condition from a rule.
	 * This will always remove the last condition.
	 * @private
	 */
	removeConditionBox : function()
	{
		if (this.conditionCount > 1) {
			// Don't remove the last item, as that is the container
			// to add and remove conditions.
			this.remove(this.get(this.items.getCount() - 2));
			this.conditionCount--;

			// Toggle the removeConditionBtn
			this.removeConditionBtn.setDisabled(this.conditionCount <= 1);

			this.doLayout();
		}
	},

	/**
	 * {@link #addConditionBox add} or {@link #removeConditionBox remove}
	 * Condition Boxes for a rule, until the {@link #conditionCount} reaches
	 * the given count.
	 * @param {Number} count The desired number of condition boxes
	 * @private
	 */
	setConditionBoxCount : function(count)
	{
		while (count < this.conditionCount) {
			this.removeConditionBox();
		}
		while (count > this.conditionCount) {
			this.addConditionBox();
		}
	},

	/**
	 * Updates the panel by loading data from the record into the form panel.
	 * @param {Zarafa.common.rules.data.RulesRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;

		if (contentReset || record.isModifiedSinceLastUpdate('rule_condition')) {
			var conditions = record.get('rule_condition');
			if (Ext.isEmpty(conditions)) {
				this.setConditionBoxCount(1);
				return;
			}

			conditions = this.getConditionsArray(conditions);

			// We have to ensure that there are sufficient condition fields
			// present in the container. When the rule doesn't have any
			// condition specified, we will create an empty condition
			var count = Math.max(1, conditions.length);
			this.setConditionBoxCount(count);

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

		for (var i = 0; i < this.conditionCount; i++) {
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

		// Check if we need to create a AND restriction
		if (conditions) {
			if (conditions.length > 1) {
				conditions = Zarafa.core.data.RestrictionFactory.createResAnd(conditions);
			} else {
				conditions = conditions[0];
			}
		}

		record.set('rule_condition', conditions);
		record.setConditionsValid(conditionsValid);
	},

	/**
	 * Convert the conditions object as stored in a {@link Zarafa.common.rules.data.RulesRecord rule}
	 * and convert it to an array of individual conditions. Each element in the returned array represents
	 * a single condition.
	 * @param {Object} conditions The condition which must be converted into an array
	 * @return {Array} The array of conditions
	 * @private
	 */
	getConditionsArray : function(conditions)
	{
		// Check the conditions, if the RES property indicates a AND
		// restriction we have to check the contents, as we need to determine
		// if this represents a single condition or a list of conditions.
		if (conditions[0] === Zarafa.core.mapi.Restrictions.RES_AND) {
			var single = false;

			// Check if this AND/OR restriction represents a single
			// condition or not.
			for (var i = 0, len = conditions[1].length; i < len; i++) {
				var sub = conditions[1][i];
				if (sub && sub[0] === Zarafa.core.mapi.Restrictions.RES_PROPERTY &&
					sub[1][Zarafa.core.mapi.Restrictions.ULPROPTAG] === 'PR_MESSAGE_TO_ME') {
					single = true;
					break;
				}
			}

			// Now return the conditions
			if (single) {
				conditions = [ conditions ];
			} else {
				conditions = conditions[1];
			}
		} else {
			// Single condition, just convert it to an array
			conditions = [ conditions ];
		}

		return conditions;
	},

	/**
	 * Load a Condition from a {@Link Zarafa.common.rules.data.RulesRecord} and apply it
	 * onto the {@link Ext.Container} which was created by {@link #addConditionBox}. 
	 * @param {Ext.Container} panel The container on which the condition will be loaded
	 * @param {Object} condition The condition which should be loaded
	 * @private
	 */
	applyCondition : function(panel, condition)
	{
		var conditionFlag = this.getConditionFlagFromCondition(condition);
		var combo = panel.get(0);
		var content = panel.get(1);
		var store = combo.store;

		// Apply the correct value to the combobox.
		var index = store.findExact(combo.valueField, conditionFlag);
		if (index >= 0) {
			var record = store.getAt(index);
			combo.setValue(conditionFlag);
			this.onConditionComboSelect(combo, record, index);
		} else {
			conditionFlag = Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
			combo.setValue(_('Unknown condition'));
			combo.markInvalid(_('This condition for the current rule is unknown'));
		}

		// Fill the content with the data from the condition
		var layout = content.getLayout();
		switch (conditionFlag) {
			case Zarafa.common.rules.data.ConditionFlags.UNKNOWN:
			/* falls through*/
			default:
				break;
			case Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS:
			case Zarafa.common.rules.data.ConditionFlags.BODY_WORDS:
			case Zarafa.common.rules.data.ConditionFlags.IMPORTANCE:
			case Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM:
			case Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS:
			case Zarafa.common.rules.data.ConditionFlags.SENT_TO:
			case Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY:
				layout.activeItem.setCondition(conditionFlag, condition);
				break;
		}
	},

	/**
	 * Read a Condition object as located in the {@link Zarafa.common.rules.data.RulesRecord Rule}
	 * and convert it to the corresponding ConditionFlag which properly represents the condition.
	 * @param {Object} condition The condition which should be converted to a Condition Flag
	 * @return {Zarafa.common.rules.data.ConditionFlags} The Condition Flag
	 * @private
	 */
	getConditionFlagFromCondition : function(condition)
	{
		var Restrictions = Zarafa.core.mapi.Restrictions;

		switch (condition[0]) {
			case Restrictions.RES_COMMENT:
				switch (condition[1][Restrictions.RESTRICTION][1][Restrictions.ULPROPTAG]) {
					case 'PR_SENDER_SEARCH_KEY':
						return Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM;
					default:
						return Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
				}
				break;
			case Restrictions.RES_CONTENT:
			case Restrictions.RES_PROPERTY:
			case Restrictions.RES_SUBRESTRICTION:
				switch (condition[1][Restrictions.ULPROPTAG]) {
					case 'PR_BODY':
						return Zarafa.common.rules.data.ConditionFlags.BODY_WORDS;
					case 'PR_SUBJECT':
						return Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS;
					case 'PR_IMPORTANCE':
						return Zarafa.common.rules.data.ConditionFlags.IMPORTANCE;
					case 'PR_MESSAGE_RECIPIENTS':
						return Zarafa.common.rules.data.ConditionFlags.SENT_TO;
					case 'PR_SENDER_SEARCH_KEY':
						return Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS;
					default:
						return Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
				}
			/* falls through*/
			case Restrictions.RES_AND:
				for (var i = 0, len = condition[1].length; i < len; i++) {
					var sub = condition[1][i];

					// Check if the RES_AND contains the restriction for PR_MESSAGE_TO_ME,
					// this indicates that this restriction is the SENT_TO_ME_ONLY condition
					if (sub[0] === Restrictions.RES_PROPERTY &&
					    sub[1][Restrictions.ULPROPTAG] === 'PR_MESSAGE_TO_ME') {
						return Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY;
					}
				}
				return Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
			case Restrictions.RES_OR:
				for (var i = 0, len = condition[1].length; i < len; i++) {
					var sub = condition[1][i];
					var type = this.getConditionFlagFromCondition(sub);
					if (type !== Zarafa.common.rules.data.ConditionFlags.UNKNOWN) {
						return type;
					}
				}
				return Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
			default:
				return Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
		}
	},

	/**
	 * The event handler for the {@link Ext.form.ComboBox#select} event for the combobox for
	 * a particular action. This will update the corresponding content panel to show the correct
	 * content type.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The record which was selected from the combobox
	 * @param {Number} index The selected index from the combobox list
	 * @private
	 */
	onConditionComboSelect : function(combo, record, index)
	{
		var panel = combo.ownerCt;
		var content = panel.get(1);

		var layout = content.getLayout();
		var value = record.get(combo.valueField);

		switch (value) {
			case Zarafa.common.rules.data.ConditionFlags.UNKNOWN:
			/* falls through*/
			default:
				layout.setActiveItem(panel.id + '-empty');
				break;
			case Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM:
				layout.setActiveItem(panel.id + '-from');
				layout.activeItem.setCondition(value);
				break;
			case Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS:
				layout.setActiveItem(panel.id + '-senderwords');
				layout.activeItem.setCondition(value);
				break;
			case Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS:
				layout.setActiveItem(panel.id + '-words');
				layout.activeItem.setCondition(value);
				break;
			case Zarafa.common.rules.data.ConditionFlags.BODY_WORDS:
				layout.setActiveItem(panel.id + '-bodywords');
				layout.activeItem.setCondition(value);
				break;
			case Zarafa.common.rules.data.ConditionFlags.IMPORTANCE:
				layout.setActiveItem(panel.id + '-importance');
				layout.activeItem.setCondition(value);
				break;
			case Zarafa.common.rules.data.ConditionFlags.SENT_TO:
				layout.setActiveItem(panel.id + '-to');
				layout.activeItem.setCondition(value);
				break;
			case Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY:
				layout.setActiveItem(panel.id + '-to-me');
				layout.activeItem.setCondition(value);
				break;
		}
	}
});

Ext.reg('zarafa.rulesconditioncontainer', Zarafa.common.rules.dialogs.RulesConditionContainer);
