Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.RulesEditPanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.ruleeditpanel
 *
 * Will generate UI for {@link Zarafa.common.rules.dialogs.RulesEditContentPanel RulesEditContentPanel}.
 */
Zarafa.common.rules.dialogs.RulesEditPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.ruleseditpanel',
			layout : 'anchor',
			autoScroll : true,
			items : this.createPanelItems(config)
		});

		Zarafa.common.rules.dialogs.RulesEditPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will create panel items for {@link Zarafa.common.rules.dialogs.RulesEditPanel RulesEditPanel}
	 * @param {Object} config the Configuration structure from the constructor.
	 * @return {Array} array of items that should be added to panel.
	 * @private
	 */
	createPanelItems : function(config)
	{
		return [{
			xtype : 'displayfield',
			value : _('Rule name'),
			height : 20
		}, {
			xtype : 'textfield',
			name : 'rule_name',
			width : 250,
			listeners : {
				change : this.onChange,
				scope : this
			}
		}, {
			xtype : 'spacer',
			height : 15
		}, {
			xtype : 'displayfield',
			value : _('When the message') + '...',
			height : 20
		}, {
			xtype : 'zarafa.rulesconditioncontainer',
			anchor : '100%'
		}, {
			xtype : 'spacer',
			height : 15
		}, {
			xtype : 'displayfield',
			value : _('Do the following') + '...',
			height : 20
		}, {
			xtype : 'zarafa.rulesactionscontainer',
			anchor : '100%',
			storeEntryId : config.storeEntryId
		}, {
			xtype : 'spacer',
			height : 15
		},	{
			xtype : 'displayfield',
			value : _('Exceptions'),
			height : 20
		},	{
			xtype: 'zarafa.rulesexceptionscontainer',
			anchor: '100%'
		},	{
			xtype : 'spacer',
			height : 15
		}, {
			xtype : 'checkbox',
			ref : 'onlyIfOOFCheckbox',
			hidden : this.hideCheckBox(),
			boxLabel : _('Apply only when Out of Office is active'),
			handler : this.onToggleIfOOF,
			scope : this
		}, {
			xtype : 'checkbox',
			ref : 'stopProcessingCheckbox',
			boxLabel : _('Stop processing more rules'),
			handler : this.onToggleStopProcessing,
			scope : this
		}];
	},

	/**
	 * Save the changes in record when change event is fired on fields.
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onChange : function(field, value)
	{
		this.record.set(field.name, value);
	},

	/**
	 * Function will hide the "Apply only when..." check box when
	 * ZCP version is less than 5.6.
	 */
	hideCheckBox : function(){
		var version = container.getVersion();
		var mapiVersion = version.getZCP();
		return version.versionCompare(mapiVersion, '5.6') === -1 ? true : false;
	},

	/**
	 * Function will be called when user toggles state of checkbox to indicate that
	 * this will be last rule to be executed after that no rules should be executed.
	 * @param {Ext.form.Checkbox} checkbox The Checkbox being toggled.
	 * @param {Boolean} checked The new checked state of the checkbox.
	 * @private
	 */
	onToggleStopProcessing : function(checkbox, checked)
	{
		var state = this.record.get('rule_state');

		if (checked) {
			state |= Zarafa.core.mapi.RuleStates.ST_EXIT_LEVEL;
		} else {
			state &= ~Zarafa.core.mapi.RuleStates.ST_EXIT_LEVEL;
		}

		this.record.set('rule_state', state);
	},

	/**
	 * Function will be called when user toggles "Apply only when Out of Office.." of checkbox
	 * to indicate that this will be the rule to be executed only when user is out of office.
	 *
	 * @param {Ext.form.Checkbox} checkbox The Checkbox being toggled.
	 * @param {Boolean} checked The new checked state of the checkbox.
	 * @private
	 */
	onToggleIfOOF : function(checkbox, checked)
	{
		var state = this.record.get('rule_state');
		if (checked) {
			state |= Zarafa.core.mapi.RuleStates.ST_ONLY_WHEN_OOF;
		} else {
			state &= ~Zarafa.core.mapi.RuleStates.ST_ONLY_WHEN_OOF;
		}
		this.record.set('rule_state', state);
	},

	/**
	 * Updates the panel by loading data from the record into the form panel.
	 * @param {Zarafa.rules.delegates.data.RulesRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;

		this.getForm().loadRecord(record);

		var RuleStates = Zarafa.core.mapi.RuleStates;
		var state = record.get('rule_state');

		this.stopProcessingCheckbox.setValue((state & RuleStates.ST_EXIT_LEVEL) === RuleStates.ST_EXIT_LEVEL);
		this.onlyIfOOFCheckbox.setValue((state & RuleStates.ST_ONLY_WHEN_OOF) === RuleStates.ST_ONLY_WHEN_OOF);
	},

	/**
	 * Update the given {@link Zarafa.core.data.IPMRecord record} with
	 * the values from this {@link Ext.Panel panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 */
	updateRecord : function(record)
	{
		record.beginEdit();

		this.getForm().updateRecord(record);

		var state = this.record.get('rule_state');
		if (this.stopProcessingCheckbox.getValue()) {
			state |= Zarafa.core.mapi.RuleStates.ST_EXIT_LEVEL;
		} else {
			state &= ~Zarafa.core.mapi.RuleStates.ST_EXIT_LEVEL;
		}

		if (this.onlyIfOOFCheckbox.getValue()) {
			state |= Zarafa.core.mapi.RuleStates.ST_ONLY_WHEN_OOF;
		} else {
			state &= ~Zarafa.core.mapi.RuleStates.ST_ONLY_WHEN_OOF;
		}

		this.record.set('rule_state', state);

		record.endEdit();
	}
});

Ext.reg('zarafa.ruleseditpanel', Zarafa.common.rules.dialogs.RulesEditPanel);
