Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.RulesActionsContainer
 * @extends Ext.Container
 * @xtype zarafa.rulesactionscontainer
 *
 * The container in which all actions can be edited. This container
 * can be expanded to include multiple actions, and is able to parse
 * the rules_actions property of a {@link Zarafa.common.rules.data.RulesRecord rule}.
 */
Zarafa.common.rules.dialogs.RulesActionsContainer = Ext.extend(Ext.Container, {
	/**
	 * The current number of action boxes which are present in the container.
	 * This number is changed by {@link #addActionBox} and {@link #removeActionBox}.
	 * @property
	 * @type Number
	 * @private
	 */
	actionCount : 0,

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
					ref : '../addActionBtn',
					text : _('Add action'),
					handler : this.addActionBox,
					scope : this
				},{
					xtype : 'button',
					ref : '../removeActionBtn',
					text : _('Remove action'),
					handler : this.removeActionBox,
					scope : this
				}]
			}]
		});

		Zarafa.common.rules.dialogs.RulesActionsContainer.superclass.constructor.call(this, config);
	},

	/**
	 * Generic function to create containers in which an action is represented. This consists of
	 * 2 components, the first one is the combobox in which the action type is selected, and the
	 * second in which special option for the given action can be configured.
	 * @param {Number} The index of the action which is created
	 * @return {Object} config object to create a {@link Ext.Container}.
	 * @private
	 */
	createActionBox : function(index)
	{
		var id =  'rule-action-' + String(index);
		var profileStore = {
			xtype : 'jsonstore',
			fields : [
				{ name : 'name' },
				{ name : 'value', type : 'int' }
			],
			data : Zarafa.common.rules.data.ActionProfiles
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
					'select' : this.onActionComboSelect,
					'scope' : this
				}
			}, {
				xtype : 'container',
				flex : 1,
				layout : 'card',
				activeItem : 0,
				items : this.createActionContentPanels(id)
			}]
		};
	},

	/**
	 * Create a set of ContentPanels which are used to configure the various action type.
	 * The array which is returned contains should be applied on a {@link Ext.Container} with
	 * a {@link Ext.layout.CardLayout CardLayout} to ensure only one container is visible
	 * at a time.
	 * In each container the user is able to set various configuration options for the
	 * action type as selected in the combobox.
	 * @param {String} baseId The baseId which is used to create the id for the individual containers.
	 * @return {Array} Array of config objects to create a {@link Ext.Container}.
	 * @private
	 */
	createActionContentPanels : function(baseId)
	{
		return [{
			xtype : 'container',
			id : baseId + '-empty'
		},{
			xtype : 'zarafa.folderselectionlink',
			id : baseId + '-folder'
		},{
			xtype : 'zarafa.deletelink',
			id : baseId + '-delete',
			storeEntryId: this.storeEntryId
		},{
			xtype : 'zarafa.userselectionlink',
			id : baseId + '-to'
		}];
	},

	/**
	 * Function that can be used to add more actions in a rule.
	 * @return {Ext.Container} The Action Box which was inserted
	 * @private
	 */
	addActionBox : function()
	{
		this.actionCount++;

		var container = this.createActionBox(this.actionCount);
		container = this.insert(this.items.getCount() - 1, container);

		// Toggle the removeActionBtn
		this.removeActionBtn.setDisabled(this.actionCount <= 1);

		this.doLayout();

		return container;
	},

	/**
	 * Function that can be used to remove an action from a rule.
	 * This will always remove the last action.
	 * @private
	 */
	removeActionBox : function()
	{
		if (this.actionCount > 1) {
			// Don't remove the last item, as that is the container
			// to add and remove actions.
			this.remove(this.get(this.items.getCount() - 2));
			this.actionCount--;

			// Toggle the removeActionBtn
			this.removeActionBtn.setDisabled(this.actionCount <= 1);

			this.doLayout();
		}
	},

	/**
	 * {@link #addActionBox add} or {@link #removeActionBox remove}
	 * Action Boxes for a rule, until the {@link #actionCount} reaches
	 * the given count.
	 * @param {Number} count The desired number of action boxes
	 * @private
	 */
	setActionBoxCount : function(count)
	{
		while (count < this.actionCount) {
			this.removeActionBox();
		}
		while (count > this.actionCount) {
			this.addActionBox();
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

		if (contentReset || record.isModifiedSinceLastUpdate('rule_actions')) {
			var actions = record.get('rule_actions');
			if (Ext.isEmpty(actions)) {
				this.setActionBoxCount(1);
				return;
			}

			// Force actions to be an array
			actions = [].concat(actions);

			// We have to ensure that there are sufficient action fields
			// present in the container. When the rule doesn't have any
			// actions specified, we will create an empty action
			var count = Math.max(1, actions.length);
			this.setActionBoxCount(count);

			for (var i = 0, len = actions.length; i < len; i++) {
				// Apply the action to the corresponding container
				if (actions[i]) {
					this.applyAction(this.get(i), actions[i]);
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
		var actions = [];
		var actionsValid = true;

		for (var i = 0; i < this.actionCount; i++) {
			var panel = this.get(i);
			var activeItem = panel.get(1).layout.activeItem;
			var action = null;

			if (Ext.isFunction(activeItem.getAction)) {
				action = activeItem.getAction();
			}

			// If no valid action was found, then
			// we have a problem and we can't save
			// the action. Break out of the loop
			// and invalidate the rule_actions property.
			if (!action) {
				panel.get(0).markInvalid();
				actionsValid = false;
			}

			actions.push(action);
		}

		record.set('rule_actions', actions);
		record.setActionsValid(actionsValid);
	},

	/**
	 * Load an Action from a {@Link Zarafa.common.rules.data.RulesRecord} and apply it
	 * onto the {@link Ext.Container} which was created by {@link #addActionBox}. 
	 * @param {Ext.Container} panel The container on which the action will be loaded
	 * @param {Object} action The action which should be loaded
	 * @private
	 */
	applyAction : function(panel, action)
	{
		var actionFlag = this.getActionFlagFromAction(action);
		var combo = panel.get(0);
		var content = panel.get(1);
		var store = combo.store;

		// Apply the correct value to the combobox.
		var index = store.findExact(combo.valueField, actionFlag);
		if (index >= 0) {
			var record = store.getAt(index);
			combo.setValue(actionFlag);
			this.onActionComboSelect(combo, record, index);
		} else {
			actionFlag = Zarafa.common.rules.data.ActionFlags.UNKNOWN;
			combo.setValue(_('Unknown action'));
			combo.markInvalid(_('This action for the current rule is unknown'));
		}

		// Fill the content with the data from the action
		var layout = content.getLayout();
		switch (actionFlag) {
			case Zarafa.common.rules.data.ActionFlags.UNKNOWN:
			/* falls through */
			default:
				break;
			case Zarafa.common.rules.data.ActionFlags.MOVE:
			case Zarafa.common.rules.data.ActionFlags.COPY:
			case Zarafa.common.rules.data.ActionFlags.DELETE:
			case Zarafa.common.rules.data.ActionFlags.REDIRECT:
			case Zarafa.common.rules.data.ActionFlags.FORWARD:
			case Zarafa.common.rules.data.ActionFlags.FORWARD_ATTACH:
				layout.activeItem.setAction(actionFlag, action);
				break;
		}
	},

	/**
	 * Read a Action object as located in the {@link Zarafa.common.rules.data.RulesRecord Rule}
	 * and convert it to the corresponding ActionFlag which properly represents the action
	 * to be taken.
	 * @param {Object} action The action which should be converted to a Action Flag
	 * @return {Zarafa.common.rules.data.ActionFlags} The Action Flag
	 * @private
	 */
	getActionFlagFromAction : function(action)
	{
		switch (action.action) {
			case Zarafa.core.mapi.RuleActions.OP_MOVE:
				// The MOVE action can be used for either
				// DELETE or MOVE action. The decision for this
				// depends on if the selected folder is set the
				// the "Deleted Items" folder, and if the rule_state
				// property has the ST_EXIT_LEVEL flag.
				var RulesStates = Zarafa.core.mapi.RuleStates;
				if (this.record.get('rule_state') & RulesStates.ST_EXIT_LEVEL === RulesStates.ST_EXIT_LEVEL) {
					var deletedItems = container.getHierarchyStore().getDefaultFolder('wastebasket');
					if (deletedItems && Zarafa.core.EntryId.compareEntryIds(deletedItems.get('entryid'), action.folderentryid)) {
						return Zarafa.common.rules.data.ActionFlags.DELETE;
					}
				}
				return Zarafa.common.rules.data.ActionFlags.MOVE;
			case Zarafa.core.mapi.RuleActions.OP_COPY:
				// Normal copy, nothing fancy.
				return Zarafa.common.rules.data.ActionFlags.COPY;
			case Zarafa.core.mapi.RuleActions.OP_FORWARD:
				// The exact forward action depends on the 'flavor' property.
				var FlavorFlags = Zarafa.core.mapi.FlavorFlags;
				switch (action.flavor) {
					case 0: // Forward
						return Zarafa.common.rules.data.ActionFlags.FORWARD;
					case FlavorFlags.FWD_PRESERVE_SENDER | FlavorFlags.FWD_DO_NOT_MUNGE_MSG:
						return Zarafa.common.rules.data.ActionFlags.REDIRECT;
					case FlavorFlags.FWD_AS_ATTACHMENT:
						return Zarafa.common.rules.data.ActionFlags.FORWARD_ATTACH;
					default:
						return Zarafa.common.rules.data.ActionFlags.UNKNOWN;
				}
				/* falls through */
			default:
				// Any other RuleAction is not supported
				return Zarafa.common.rules.data.ActionFlags.UNKNOWN;
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
	onActionComboSelect : function(combo, record, index)
	{
		var panel = combo.ownerCt;
		var content = panel.get(1);

		var layout = content.getLayout();
		var value = record.get(combo.valueField);

		switch (value) {
			case Zarafa.common.rules.data.ActionFlags.UNKNOWN:
			/* falls through */
			default:
				layout.setActiveItem(panel.id + '-empty');
				break;
			case Zarafa.common.rules.data.ActionFlags.MOVE:
			case Zarafa.common.rules.data.ActionFlags.COPY:
				layout.setActiveItem(panel.id + '-folder');
				layout.activeItem.setAction(value);
				break;
			case Zarafa.common.rules.data.ActionFlags.DELETE:
				layout.setActiveItem(panel.id + '-delete');
				layout.activeItem.setAction(value);
				// For the DELETE action, the rule_state
				// must contain the ST_EXIT_LEVEL flag.
				this.record.set('rule_state', this.record.get('rule_state') | Zarafa.core.mapi.RuleStates.ST_EXIT_LEVEL);
				break;
			case Zarafa.common.rules.data.ActionFlags.REDIRECT:
			case Zarafa.common.rules.data.ActionFlags.FORWARD:
			case Zarafa.common.rules.data.ActionFlags.FORWARD_ATTACH:
				layout.setActiveItem(panel.id + '-to');
				layout.activeItem.setAction(value);
				break;
		}
	}
});

Ext.reg('zarafa.rulesactionscontainer', Zarafa.common.rules.dialogs.RulesActionsContainer);
