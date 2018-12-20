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
			cls: 'k-taskdetailtab',
			title : _('Details'),
			border : false,
			labelAlign: 'left',
			defaults : {
				border : false,
				xtype : 'panel'
			},
			items : [
				this.createTaskInfoPanel(),
				this.createDatePanel(),
				this.createWorkPanel(),
				this.createCompanyPanel(),
				this.createUpdateListPanel()
			]
		});

		Zarafa.task.dialogs.TaskDetailTab.superclass.constructor.call(this, config);

	},

	/**
	 * Create the {@link Ext.DataView DataView} containing the information about assigned task request
	 * from assigner/assignee.
	 *
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createTaskInfoPanel : function ()
	{
		return {
			xtype: 'zarafa.taskinfo',
			ref : 'taskInfoPanel',
			hidden : true
		};
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
			ref : 'datePanel',
			cls : 'k-datepanel',
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
			ref: 'workPanel',
			cls: 'k-workpanel',
			defaults:{
					layout:'form',
					border:false,
					xtype:'panel'
			},
			items : [{//1 col
				columnWidth : 0.35,
				cls: 'k-col0',
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
				cls: 'k-col1',
				labelWidth: 150,
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
		return {
			layout: 'form',
			ref: 'companyPanel',
			cls: 'k-companypanel',
			items: [{
				xtype: 'textfield',
				fieldLabel: _('Companies'),
				anchor: '100%',
				name: 'companies',
				listeners: {
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
		return {
			layout: 'form',
			cls: 'k-updatelistpanel',
			items: [{
				xtype: 'textfield',
				fieldLabel:_('Update List'),
				ref: '../updateList',
				anchor: '100%',
				readOnly: true,
				name: 'updatelist'
			},{
				xtype: 'button',
				width: 150,
				ref: '../createUnassignedCopy',
				handler: this.onCreateUnassignedCopy,
				text: _('Create Unassigned Copy'),
				name: 'create_unassigned_copy',
				scope: this
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
		var isTaskAssignerCopy = (record.get('taskhistory') === Zarafa.core.mapi.TaskHistory.DECLINED || record.isTaskAssigned() || record.isTaskOrganized());

		this.taskInfoPanel.setVisible(isTaskAssignerCopy);

		this.datePanel.setVisible(!isTaskAssignerCopy);
		this.workPanel.setVisible(!isTaskAssignerCopy);
		this.companyPanel.setVisible(!isTaskAssignerCopy);
		this.updateList.setVisible(!isTaskAssignerCopy);

		if (contentReset === true || record.isModified('taskstate')) {
			switch (record.get('taskstate')) {
				case Zarafa.core.mapi.TaskState.ACCEPT:
					// If task have taskupdates property to false or user(as assignee) decline the task
					// then disable "Create unassigned copy" button. because in this case we don't have
					// associated task in task folder so we can't able to create unassigned copy of task.
					this.createUnassignedCopy.setDisabled(!record.get('taskupdates') || record.isTaskDeclined());
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
	 * Event handler triggered when 'Create unassigned copy' button has been
	 * pressed. it will create new unassigned task copy from selected assigned task.
	 *
	 * @param {Ext.button} button The button which has been pressed
	 */
	onCreateUnassignedCopy : function (button)
	{
		var hierarchyStore = container.getHierarchyStore();
		var folder = hierarchyStore.getFolder(this.record.get('parent_entryid'));
		var record = this.record.convertToTask(folder);
		record.setUpdateModificationsTracking(true);
		record.beginEdit();
		record.set('subject', this.record.get('conversation_topic') +" ("+ _("copy") +")");
		record.set('taskstate', Zarafa.core.mapi.TaskState.OWNER_NEW);
		record.set('taskmode', Zarafa.core.mapi.TaskMode.NOTHING);
		record.set('taskhistory', Zarafa.core.mapi.TaskHistory.NONE);
		record.set('ownership', Zarafa.core.mapi.TaskOwnership.NEWTASK);
		record.set('task_acceptance_state', Zarafa.core.mapi.TaskAcceptanceState.NOT_DELEGATED);
		record.set('date_completed', null);
		record.set('updatecount', 1);
		record.set('icon_index', Zarafa.core.mapi.IconIndex['task']);
		record.set('taskfcreator', true);
		record.set('tasklastdelegate', '');
		record.set('task_goid', '');
		record.set('entryid', '');
		var store = container.getHierarchyStore().getById(record.get('store_entryid'));
		if(store) {
			record.set('owner', store.get('display_name'));
		}
		Zarafa.core.data.UIFactory.openCreateRecord(record);
		// We need to record endEdit after creating tab panel because
		// it will remove the updateModifications object
		// and because of that record is not trite as dirty so it will
		// not ask for the "Save change..." message box when user
		// trying to close that tab.
		record.endEdit();
		this.dialog.close();
	},

	/**
	 * Event handler which is triggered when the Completion Date has been
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
