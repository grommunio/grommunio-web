Ext.namespace('Zarafa.common.rules.ui');

/**
 * @class Zarafa.common.rules.ui.RulesGrid
 * @extends Zarafa.common.ui.grid.GridPanel
 * @xtype zarafa.rulesgrid
 *
 * {@link Zarafa.common.rules.ui.RulesGrid RulesGrid} will be used to display
 * rules information of the current user.
 */
Zarafa.common.rules.ui.RulesGrid = Ext.extend(Zarafa.common.ui.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.rulesgrid',
			cls : 'k-rulesgrid',
			border : false,
			enableHdMenu : false,
			viewConfig : {
				forceFit : true,
				emptyText : '<div class=\'emptytext\'>' + _('No rule exists') + '</div>'
			},
			loadMask : this.initLoadMask(),
			sm : new Ext.grid.RowSelectionModel({
				singleSelect : true
			}),
			columns : this.initColumnModel(),
			listeners : {
				rowdblclick : this.onRowDblClick,
				scope : this
			},
			tbar : this.initToolbar()
		});

		Zarafa.common.rules.ui.RulesGrid.superclass.constructor.call(this, config);
	},

	/**
	 * initialize events for the grid panel.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.rules.ui.RulesGrid.superclass.initEvents.call(this);

		// register event to enable/disable buttons based on selection
		this.mon(this.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
	},

	/**
	 * Creates a {@link Ext.Toolbar} config object to be used with {@link #tbar}.
	 * @return {Ext.Toolbar} toolbar config object
	 * @private
	 */
	initToolbar : function()
	{
		return [{
			xtype : 'button',
			text : _('New'),
			handler : this.onRuleAdd,
			ref : '../addButton',
			scope : this
		}, {
			xtype : 'button',
			text : _('Delete'),
			disabled : true,
			ref : '../removeButton',
			handler : this.onRuleRemove,
			scope : this
		}, {
			xtype : 'button',
			text : _('Edit'),
			disabled : true,
			ref : '../editButton',
			handler : this.onRuleEdit,
			scope : this
		}, {
			xtype : 'button',
			iconCls : 'zarafa-rules-sequence-up',
			disabled : true,
			ref : '../upButton',
			handler : this.onRuleSequenceUp,
			scope : this
		}, {
			xtype : 'button',
			iconCls : 'zarafa-rules-sequence-down',
			disabled : true,
			ref : '../downButton',
			handler : this.onRuleSequenceDown,
			scope : this
		}];
	},

	/**
	 * Creates a column model object, used in {@link #colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel : function()
	{
		return [{
			xtype : 'checkcolumn',
			dataIndex : 'rule_state',
			header : _('Active'),
			fixed : true,
			width : 60,
			sortable : false,
			// override renderer to show active state of rule
			renderer : this.ruleStateRenderer.createDelegate(this),
			// override processEvent so we can save the change in the record
			processEvent : this.onRuleStateColumnProcessEvent.createDelegate(this)
		}, {
			dataIndex : 'rule_state',
			header : _('Out of office'),
			sortable : false,
			fixed : true,
			width : 100,
			renderer : this.ruleOutOfOfficeStateRenderer
		},{
			dataIndex : 'rule_name',
			header : _('Rule'),
			sortable : false,
			renderer : Zarafa.common.ui.grid.Renderers.text
		}];
	},

	/**
	 * Render the cell as Rule state, setting an Out of office icon in
	 * out of office column to indicate that rule is active when
	 * user is out of office rule state.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 */
	ruleOutOfOfficeStateRenderer : function(value, p, record)
	{
		var stateOnlyWhenOOF = value & Zarafa.core.mapi.RuleStates.ST_ONLY_WHEN_OOF;

		if (stateOnlyWhenOOF === Zarafa.core.mapi.RuleStates.ST_ONLY_WHEN_OOF) {
			p.css += ' icon_rule_oof';
		}
		return '';
	},


	/**
	 * Render the cell as Rule state checkbox, function will call {@link Ext.ux.grid.CheckColumn#renderer CheckColumn#renderer}
	 * after setting boolean value for rule state.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 */
	ruleStateRenderer : function(value, p, record)
	{
		value = ((value & Zarafa.core.mapi.RuleStates.ST_ENABLED) === Zarafa.core.mapi.RuleStates.ST_ENABLED);

		return Ext.ux.grid.CheckColumn.prototype.renderer.apply(this, arguments);
	},

	/**
	 * Function will be called when user toggles active/inactive state of rule.
	 * This will update the corresponding property to indicate active state of the rule.
	 * @param {String} name name of the event which triggered this function
	 * @param {Ext.EventObject} e event object
	 * @param {Zarafa.common.ui.grid.GridPanel} grid grid panel which holds this {@link Zarafa.common.ui.grid.ColumnModel ColumnModel}
	 * @param {Number} rowIndex index of the row which is toggled
	 * @param {Number} colIndex index of the column which is toggled
	 * @private
	 */
	onRuleStateColumnProcessEvent : function(name, e, grid, rowIndex, colIndex)
	{
		if(name === 'mousedown') {
			var record = grid.getStore().getAt(rowIndex);
			var rule_state = record.get('rule_state');

			if ((rule_state & Zarafa.core.mapi.RuleStates.ST_ENABLED) === Zarafa.core.mapi.RuleStates.ST_ENABLED) {
				record.set('rule_state', rule_state & ~Zarafa.core.mapi.RuleStates.ST_ENABLED);
			} else {
				record.set('rule_state', rule_state | Zarafa.core.mapi.RuleStates.ST_ENABLED);
			}
		}
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.loadMask} field
	 * @return {Ext.LoadMask} The configuration object for {@link Ext.LoadMask}
	 * @private
	 */
	initLoadMask : function()
	{
		return {
			msg : _('Loading rules') + '...'
		};
	},

	/**
	 * Event handler for the {@link #viewready} event.
	 * This will {@link Ext.grid.RowSelectionModel#selectFirstRow select the first row} in the grid.
	 * @private
	 */
	onViewReady : function()
	{
		Zarafa.common.rules.ui.RulesGrid.superclass.onViewReady.apply(this, arguments);
		this.getSelectionModel().selectFirstRow();
	},

	/**
	 * Called when {@link Ext.grid.GridPanel#store store} on the {@link #field} is
	 * loading new data.
	 * This will {@link Ext.grid.RowSelectionModel#selectFirstRow select the first row} in the grid.
	 *
	 * @param {Zarafa.core.data.MAPIStore} store The store which being loaded.
	 * @param {Ext.data.Record[]} records The records which have been loaded from the store
	 * @param {Object} options The loading options that were specified (see {@link Ext.data.Store#load load} for details)
	 * @private
	 */
	onStoreLoad : function(store, records, options)
	{
		Zarafa.common.rules.ui.RulesGrid.superclass.onStoreLoad.apply(this, arguments);
		if (!this.getSelectionModel().hasSelection()) {
			this.getSelectionModel().selectFirstRow();
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.rules.ui.RulesGrid RulesGrid} is double clicked.
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex)
	{
		// open rule edit dialog
		Zarafa.common.Actions.openRulesEditContent(grid.getStore().getAt(rowIndex));
	},

	/**
	 * Event handler will be called when selection in {@link Zarafa.common.rules.ui.RulesGrid RulesGrid}
	 * has been changed
	 * @param {Ext.grid.RowSelectionModel} selectionModel selection model that fired the event
	 * @private
	 */
	onGridSelectionChange : function(selectionModel)
	{
		var noSelection = (selectionModel.hasSelection() === false);

		this.removeButton.setDisabled(noSelection);
		this.editButton.setDisabled(noSelection);

		this.upButton.setDisabled(!selectionModel.hasPrevious());
		this.downButton.setDisabled(!selectionModel.hasNext());
	},

	/**
	 * Handler function will be called when user clicks on 'Add' button
	 * @private
	 */
	onRuleAdd : function()
	{
		// open rule edit dialog
		var ruleRecord = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RULE);
		this.getStore().add(ruleRecord);

		Zarafa.common.Actions.openRulesEditContent(ruleRecord, { removeRecordOnCancel : true });
	},

	/**
	 * Handler function will be called when user clicks on 'Remove' button.
	 * @private
	 */
	onRuleRemove : function()
	{
		var store = this.getStore();
		var sm = this.getSelectionModel();

		var ruleRecord = sm.getSelected();
		if (!ruleRecord) {
			container.getNotifier().notify('error.rules', _('Error'), _('Please select a rule.'));
			return;
		}

		// remove rule from store
		store.remove(ruleRecord);
	},

	/**
	 * Handler function will be called when user clicks on 'Edit' button.
	 * @private
	 */
	onRuleEdit : function()
	{
		var ruleRecord = this.getSelectionModel().getSelected();
		if (!ruleRecord) {
			container.getNotifier().notify('error.rules', _('Error'), _('Please select a rule.'));
			return;
		}

		// open rule edit dialog
		Zarafa.common.Actions.openRulesEditContent(ruleRecord);
	},

	/**
	 * Handler function will be called when user clicks on 'Up' button
	 * This will determine which rules to swap and call {@link #swapRules}.
	 * @private
	 */
	onRuleSequenceUp : function()
	{
		var store = this.getStore();
		var sm = this.getSelectionModel();
		var rule = sm.getSelected();

		if (!rule) {
			container.getNotifier().notify('error.rules', _('Error'), _('Please select a rule.'));
			return;
		}

		if (!sm.hasPrevious()) {
			container.getNotifier().notify('error.rules', _('Error'), _('Rule already has highest priority.'));
			return;
		}

		// Start looking for the first sequence number which is lower then
		// the current sequence number. Note that we want the rule_sequence
		// which is closest to the current rule_sequence, hence the rule:
		//    rule.get('rule_sequence') > record.get('rule_sequence') > swapRule.get('rule_sequence')
		var swapRule;
		store.each(function(record) {
			if (rule.get('rule_sequence') > record.get('rule_sequence')) {
				if (!swapRule || record.get('rule_sequence') > swapRule.get('rule_sequence')) {
					swapRule = record;
				}
			}
		}, this);

		this.swapRules(rule, swapRule);
	},

	/**
	 * Handler function will be called when user clicks on 'Down' button
	 * This will determine which rules to swap and call {@link #swapRules}.
	 * @private
	 */
	onRuleSequenceDown : function()
	{
		var store = this.getStore();
		var sm = this.getSelectionModel();
		var rule = sm.getSelected();

		if (!rule) {
			container.getNotifier().notify('error.rules', _('Error'), _('Please select a rule.'));
			return;
		}

		if (!sm.hasNext()) {
			container.getNotifier().notify('error.rules', _('Error'), _('Rule already has lowest priority.'));
			return;
		}

		// Start looking for the first sequence number which is higher then
		// the current sequence number. Note that we want the rule_sequence
		// which is closest to the current rule_sequence, hence the rule:
		//    rule.get('rule_sequence') < record.get('rule_sequence') < swapRule.get('rule_sequence')
		var swapRule;
		store.each(function(record) {
			if (rule.get('rule_sequence') < record.get('rule_sequence')) {
				if (!swapRule || record.get('rule_sequence') < swapRule.get('rule_sequence')) {
					swapRule = record;
				}
			}
		}, this);

		this.swapRules(rule, swapRule);
	},

	/**
	 * Swap to rules by changing the 'rule_sequence' property
	 * for both rules, and {@link Ext.data.Store#sort sort}
	 * the {@link #store}.
	 * @param {Zarafa.common.rules.data.RulesRecord} a The first rule
	 * @param {Zarafa.common.rules.data.RulesRecord} b The second rule
	 * @private
	 */
	swapRules : function(a, b)
	{
		var aSeq = a.get('rule_sequence');
		var bSeq = b.get('rule_sequence');

		// Swap the 2 rules
		a.set('rule_sequence', bSeq);
		b.set('rule_sequence', aSeq);

		// Reapply the sorting, this will update the UI
		this.getStore().sort('rule_sequence', 'ASC');

		// Update the 'up'/'down' button
		var sm = this.getSelectionModel();
		this.upButton.setDisabled(!sm.hasPrevious());
		this.downButton.setDisabled(!sm.hasNext());
	}
});

Ext.reg('zarafa.rulesgrid', Zarafa.common.rules.ui.RulesGrid);
