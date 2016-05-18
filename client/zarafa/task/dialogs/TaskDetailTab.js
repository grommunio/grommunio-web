Ext.namespace('Zarafa.task.dialogs');

/**
 * @class Zarafa.task.dialogs.TaskDetailTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.taskdetailtab
 *
 * details tab in the {@link Zarafa.task.dialogs.TaskEditPanel}
 * that is used to create Tasks.
 */
Zarafa.task.dialogs.TaskDetailTab = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype : 'zarafa.taskdetailtab',
			title : _('Details'),
			border : false,
			bodyStyle: 'background-color: inherit;',
			defaults : {
				bodyStyle: 'background-color: inherit;',
				border : false,
				xtype : 'panel'
			},
			items : [
				this.createDatePanel(),
				this.createWorkPanel(),
				this.createCompanyPanel(),
				this.createUpdateListPanel()
			]
		});

		Zarafa.task.dialogs.TaskDetailTab.superclass.constructor.call(this, config);

	},

	/**
	 * Create the {@link Ext.Panel panel} containing the form elements
	 * to set the date complete for this Task
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createDatePanel : function()
	{
		return{
			layout : 'form',
			items : [{
				xtype : 'datefield',
				// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
				format : ('d/m/Y'),
				fieldLabel :_('Date Complete'),
				anchor : '35%',
				name : 'date_completed',
				listeners :{
					'change' : this.onCompleteDateChange,
					scope : this
				}
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel panel} containing the form elements
	 * to set the work properties for this Task
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createWorkPanel : function()
	{
		return{
			layout : 'column',
			defaults:{
					layout:'form',
					bodyStyle: 'background-color: inherit',
					border:false,
					xtype:'panel'
			},
			items : [{//1 col
				columnWidth : 0.35,
				defaults:{
					anchor:'100%'
				},
				items:[{
					xtype: 'zarafa.durationfield',
					fieldLabel:_('Total Work'),
					name: 'totalwork',
					listeners :{
						'change' : this.onPropertyChange,
						scope : this
					}
				},{
					xtype : 'zarafa.durationfield',
					fieldLabel:_('Actual Work'),
					name : 'actualwork',
					listeners :{
						'change' : this.onPropertyChange,
						scope : this
					}
				}]
			},{//2 col
				columnWidth : 0.65,
				style : 'padding-left : 10px;',
				defaults:{
					anchor:'100%'
				},
				items : [{
					xtype: 'textfield',
					fieldLabel:_('Mileage'),
					name : 'mileage',
					listeners :{
						'change' : this.onPropertyChange,
						scope : this
					}
				},{
					xtype : 'textfield',
					fieldLabel:_('Billing Information'),
					name : 'billing_information',
					listeners :{
						'change' : this.onPropertyChange,
						scope : this
					}
				}]
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel panel} containing the form elements
	 * to set the companies for this Task
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createCompanyPanel : function()
	{
		return{
			layout : 'form',
			items : [{
				xtype : 'textfield',
				fieldLabel:_('Companies'),
				anchor : '100%',
				name : 'companies',
				listeners :{
					'change' : this.onPropertyChange,
					scope : this
				}
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel panel} containing the form elements
	 * to set the User List for this Assigned Task.
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createUpdateListPanel : function()
	{
		return{
			bodyStyle: 'background-color: inherit;padding: 3px 0px 3px 0px; border-style: solid none none none;',
			border : true,
			layout : 'form',
			items : [{
				xtype : 'textfield',
				fieldLabel:_('Update List'),
				anchor : '100%',
				readOnly : true,
				name : 'updatelist'
			},{
				xtype : 'button',
				width: 150,
				ref : '../createUnassignedCopy',
				text : _('Create Unassigned Copy'),
				name : 'create_unassigned_copy'
			}]
		};
	},
	/**
	 * Enable/disable/hide/unhide all {@link Ext.Component Components} within the {@link Ext.Panel Panel}
	 * using the given {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	updateUI : function(record, contentReset)
	{
		if (contentReset === true || record.isModified('taskstate')) {
			switch (record.get('taskstate')) {
			case Zarafa.core.mapi.TaskState.ACCEPT:
				this.createUnassignedCopy.setDisabled(false);
				break;
			default:
				this.createUnassignedCopy.setDisabled(true);
				break;
			}
			this.doLayout();
		}
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.IPMRecord record} is received
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update : function(record, contentReset)
	{
		this.record = record;
		this.updateUI(record, contentReset);
		this.getForm().loadRecord(record);
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.IPMRecord record} is received
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 */
	updateRecord : function(record)
	{
		this.getForm().updateRecord(record);
	},

	/**
	 * Event handler which is triggereed when the Completion Date has been
	 * changed. This will check the value and will either mark the task
	 * as {@link Zarafa.core.mapi.TaskStatus#COMPLETE complete} or
	 * {@link Zarafa.core.mapi.TaskStatus#NOT_STARTED not started}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onCompleteDateChange : function(field, newValue, oldValue)
	{
		this.record.beginEdit();
		if (Ext.isDate(newValue)) {
			this.record.set('status', Zarafa.core.mapi.TaskStatus.COMPLETE);
			this.record.set('complete', true);
			this.record.set('percent_complete', 1);
			this.record.set('date_completed', newValue);
		} else {
			this.record.set('status', Zarafa.core.mapi.TaskStatus.NOT_STARTED);
			this.record.set('complete', false);
			this.record.set('percent_complete', 0);
			this.record.set('date_completed', null);
		}
		this.record.endEdit();
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onPropertyChange : function(field, newValue, oldValue)
	{
		if (!Ext.isEmpty(field.name) && field.validateValue(field.processValue(newValue))) {
			var record = this.record;
			record.set(field.name, newValue);
		}
	}
});

Ext.reg('zarafa.taskdetailtab', Zarafa.task.dialogs.TaskDetailTab);
