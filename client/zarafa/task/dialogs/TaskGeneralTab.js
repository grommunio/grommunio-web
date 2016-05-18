Ext.namespace('Zarafa.task.dialogs');

/**
 * @class Zarafa.task.dialogs.TaskGeneralTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.taskgeneraltab
 *
 * Main tab in the {@link Zarafa.task.dialogs.TaskPanel}
 * that is used to create Tasks and also Assign Task
 */
Zarafa.task.dialogs.TaskGeneralTab = Ext.extend(Ext.form.FormPanel, {
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
			xtype : 'zarafa.taskgeneraltab',
			title : _('Task'),
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			bodyStyle: 'background-color: inherit;',
			defaults : {
				border : true,
				bodyStyle: 'background-color: inherit; padding: 3px 0px 3px 0px; border-style: none none solid none;'
			},
			items : [
				this.createRecipientPanel(),
				this.createSubjectPanel(),
				this.createInfoPanel(),
				this.createReminderPanel(),
				this.createTaskRequestSettingPanel(),
				this.createAttachmentPanel(),
				this.createBodyPanel()
			]
		});

		Zarafa.task.dialogs.TaskGeneralTab.superclass.constructor.call(this, config);
	},

	/**
	 * Create the {@link Zarafa.common.ui.RecipientField RecipientField}
	 * where the recipients for the Meeting requests can be selected
	 * @return {Object} Configuration object for the panel containing the composite field
	 * @private
	 */
	createRecipientPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'fit',
			ref: 'recipientPanel',
			items: [{
				xtype : 'zarafa.compositefield',
				anchor : '100%',
				items: [{
					xtype: 'button',
					text: _('To'),
					width: 100
				},{
					xtype: 'zarafa.recipientfield',
					plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
					flex: 1
				}]
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel panel} containing the form elements
	 * to set the subject
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createSubjectPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'form',
			items : [{
				xtype: 'textfield',
				fieldLabel : _('Subject'),
				anchor : '100%',
				value: undefined,
				name : 'subject',
				listeners :{
					'change' : this.onPropertyChange,
					scope : this
				}
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel panel} containing the form elements
	 * to set the date, status and priority fields which must be applied to this task
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createInfoPanel : function()
	{
		var statusStore = {
			xtype: 'jsonstore',
			fields: ['name', 'value'],
			data : Zarafa.task.data.TaskStatus.status
		};

		var importanceStore = {
			xtype: 'jsonstore',
			fields: ['name', 'value'],
			data : Zarafa.common.data.ImportanceFlags.flags
		};

		return {
			xtype: 'panel',
			layout: 'hbox',
			anchor: '100%',
			ref: 'datePanel',
			items: [{
				xtype: 'zarafa.dateperiodfield',
				ref: '../dateField',
				allowBlank : true,
				defaultPeriod: container.getSettingsModel().get('zarafa/v1/contexts/task/default_task_period'),
				width: 300,
				listeners: {
					change: this.onDateRangeFieldChange,
					scope: this
				},
				startFieldConfig: {
					fieldLabel: _('Start date'),
					labelWidth: 100
				},
				endFieldConfig: {
					fieldLabel: _('End date'),
					labelWidth: 100
				}
			},{
				xtype: 'spacer',
				width: 10
			},{
				xtype: 'panel',
				flex: 1,
				border: false,
				bodyStyle: 'background-color: inherit;',
				items: [{
					xtype : 'combo',
					anchor: '100%',
					plugins: [ 'zarafa.fieldlabeler' ],
					fieldLabel:_('Status'),
					labelWidth: 100,
					width: 285,
					editable : false,
					mode : 'local',
					triggerAction : 'all',
					autoSelect : true,
					store : statusStore,
					displayField : 'name',
					valueField : 'value',
					value: statusStore.data[0].value,
					name : 'status',
					listeners : {
						scope : this,
						'select' : this.onStatusSelect
					}
				},{
					xtype: 'container',
					layout: 'hbox',
					anchor: '100%',
					border: false,
					bodyStyle: 'background-color: inherit;',
					items: [{
						xtype : 'combo',
						plugins : [ 'zarafa.fieldlabeler' ],
						fieldLabel :_('Priority'),
						width : 100,
						editable : false,
						mode : 'local',
						triggerAction : 'all',
						autoSelect : true,
						store : importanceStore,
						displayField : 'name',
						valueField : 'value',
						value : importanceStore.data[1].value,
						name : 'importance',
						listeners :{
							select : this.onImportanceSelect,
							scope : this
						}
					},{
						xtype: 'spacer',
						width: 10
					},{
						xtype: 'zarafa.spinnerfield',
						plugins: [ 'zarafa.fieldlabeler', 'zarafa.percentspinner' ],
						fieldLabel: _('% Complete'),
						labelWidth: 100,
						name: 'percent_complete',
						width : 70,
						minValue : 0,
						defaultValue : 0,
						incrementValue : 0.25,
						maxValue : 1,
						listeners :{
							spin : this.onCompleteSpin,
							scope : this
						}
					}]
				}]
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the form fields
	 * for setting the reminder information.
	 * @return {Object} Configuration object for the panel with reminder fields
	 * @private
	 */
	createReminderPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'fit',
			ref : 'reminderPanel',
			items: [{
				xtype: 'zarafa.compositefield',
				items: [{
					xtype : 'checkbox',
					name : 'reminder',
					width : 100,
					boxLabel : _('Reminder') + ':',
					handler : this.onToggleReminder,
					scope : this
				},{
					xtype :'zarafa.datetimefield',
					ref: '../../reminderDate',
					name : 'reminder_time',
					width : 217,
					timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/task/reminder_time_stepping'),
					listeners :{
						'change' : this.onPropertyChange,
						scope : this
					},
					dateFieldConfig : {
						flex : 0
					}
				},{
					xtype: 'spacer',
					width: 23
				},{
					hideLabel: true,
					xtype : 'textfield',
					ref: '../../ownerField',
					plugins: [ 'zarafa.fieldlabeler' ],
					fieldLabel : _('Owner'),
					labelWidth: 70,
					readOnly: true,
					flex: 1,
					name : 'owner',
					listeners :{
						'change' : this.onPropertyChange,
						scope : this
					}
				}]
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the form fields
	 * for setting the task request information such as task occurence and userlist.
	 * @return {Object} Configuration object for the panel with reminder fields
	 * @private
	 */
	createTaskRequestSettingPanel : function()
	{
		return{
			layout : 'form',
			ref : 'taskRequestSettingPanel',
			items : [{
					xtype : 'checkbox',
					boxLabel : _('Keep copy of task in task list'),
					name : 'taskupdates',
					listeners :{
						'change' : this.onPropertyChange,
						scope : this
					}
				},{
					xtype : 'checkbox',
					boxLabel : _('Send me a status report when task is completed'),
					name : 'tasksoc',
					listeners :{
						'change' : this.onPropertyChange,
						scope : this
					}

				}]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} which contains all attachment selection fields
	 * @return {Object} configuration object for the panel containing the attachment fields
	 * @private
	 */
	createAttachmentPanel : function()
	{
		return {
			xtype: 'zarafa.resizablecompositefield',
			hideLabel: true,
			anchor: '100%',
			cls: 'zarafa-taskcreatepanel-field-attachments',
			autoHeight: true,
			items: [{
				xtype: 'zarafa.attachmentbutton',
				plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
				width: 100,
				text: _('Attachments') + ':',
				autoHeight: true
			},{
				xtype: 'zarafa.attachmentfield',
				plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
				flex: 1,
				hideLabel: true
			}]
		};
	},
	
	/**
	 * Create the {@link Ext.Panel Panel} containing the
	 * {@link Zarafa.common.ui.htmleditor.HtmlEditor HtmlEditor} form field.
	 * @return {Object} Configuration object containing the HtmlEditor
	 * @private
	 */
	createBodyPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'fit',
			border: false,
			flex: 1,
			items: [{
				xtype: 'zarafa.editorfield',
				ref: '../editorField',
				hideLabel: true,
				flex: 1,
				useHtml: false,
				listeners: {
					change : this.onBodyChange,
					scope : this
				}
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
		var startDate = record.get('startdate');
		var startDateUpdate = false;
		if (Ext.isDate(startDate)) {
			startDate = startDate.toUTC(); // The startdate is an UTC representation
			startDateUpdate = contentReset || record.isModifiedSinceLastUpdate('startdate');
		}

		var dueDate = record.get('duedate');
		var dueDateUpdate = false;
		if (Ext.isDate(dueDate)) {
			dueDate = dueDate.toUTC(); // The duedate is an UTC representation
			dueDateUpdate = contentReset || record.isModifiedSinceLastUpdate('duedate');
		}

		if (startDateUpdate || dueDateUpdate) {
			this.dateField.getValue().set(startDate, dueDate);
		}

		if (contentReset === true || record.isModified('taskmode')) {
			switch (record.get('taskmode')) {
			case Zarafa.core.mapi.TaskMode.REQUEST:
				this.recipientPanel.setVisible(true);
				this.taskRequestSettingPanel.setVisible(true);
				this.reminderPanel.setVisible(false);
				break;

			case Zarafa.core.mapi.TaskMode.NOTHING:
			/* falls through */
			default:
				this.recipientPanel.setVisible(false);
				this.taskRequestSettingPanel.setVisible(false);
				this.reminderPanel.setVisible(true);
				break;
			}
			this.doLayout();
		}

		if (contentReset === true || record.isModifiedSinceLastUpdate('reminder')) {
			if (record.get('reminder')) {
				this.reminderDate.enable();
			} else {
				this.reminderDate.disable();
			}
		}

		if (contentReset === true) {
			// Check if the store in which the record is located is the public store
			// if it is, then the owner field should be made editable.
			var store = container.getHierarchyStore().getById(record.get('store_entryid'));
			if (store) {
				this.ownerField.setReadOnly(!store.isPublicStore());
			}
		}
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.IPMRecord record} is received.
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;
		this.updateUI(record, contentReset);

		if (contentReset && record.isOpened()) {
			this.editorField.setValue(record.getBody(this.editorField.isHtmlEditor()));
		}

		if(contentReset || record.isModifiedSinceLastUpdate('reminder_time')) {
			// Update reminder
			record.set('flagdueby', record.get('reminder_time'));
		}

		this.getForm().loadRecord(record);
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.IPMRecord record} is received.
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 */
	updateRecord : function(record)
	{
		record.beginEdit();

		this.getForm().updateRecord(record);

		// Update the start & due date
		this.updateStartDueDate(record, this.dateField.getValue());

		// Update the body
		this.onBodyChange(this.editorField.getEditor(), this.editorField.getValue());

		record.endEdit();
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
			this.record.set(field.name, newValue);
		}
	},

	/**
	 * Event handler which is triggered when priority field
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Ext.data.Record} record The data record returned from the underlying store
	 * @param {Number} index The index of the selected item in the dropdown list
	 * @private
	 */
	onImportanceSelect : function(field, record, selectedIndex)
	{
		var newValue = record.get(field.valueField);
		if (!Ext.isEmpty(field.name) && field.validateValue(field.processValue(newValue))) {
			this.record.set(field.name, newValue);
		}
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
	onBodyChange : function(field, newValue, oldValue)
	{
		var record = this.record;

		record.beginEdit();
		record.setBody(this.editorField.getValue(), this.editorField.isHtmlEditor());
		record.endEdit();
	},

	/**
	 * A function called when the checked value changes for the
	 * reminder checkbox.
	 * @param {Ext.form.Checkbox} checkbox The Checkbox being toggled.
	 * @param {Boolean} checked The new checked state of the checkbox.
	 * @private
	 */
	onToggleReminder : function(checkbox, checked)
	{
		this.record.beginEdit();
		this.record.set('reminder', checked);
		if (checked) {
			if (!Ext.isDate(this.record.get('reminder_time'))) {
				var dueDate = this.record.get('duedate');
				var time = container.getSettingsModel().get('zarafa/v1/contexts/task/default_reminder_time');

				if (!Ext.isDate(dueDate)) {
					dueDate = new Date().add(Date.DAY, 1);
				}

				this.record.set('reminder_time', dueDate.clearTime(true).add(Date.MINUTE, time));
			}
		} else {
			this.record.set('reminder_time', null);
		}
		this.record.endEdit();
	},

	/**
	 * Event handler which is triggered when status fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Ext.data.Record} record The data record returned from the underlying store
	 * @param {Number} index The index of the selected item in the dropdown list
	 * @private
	 */
	onStatusSelect : function(field, record, number)
	{
		var newValue = record.get(field.valueField);

		this.record.beginEdit();
		this.record.set(field.name, newValue);

		if(newValue === Zarafa.core.mapi.TaskStatus.COMPLETE){
			this.record.set('complete', true);
			this.record.set('percent_complete', 1);
			this.record.set('date_completed', new Date());
		} else if (newValue === Zarafa.core.mapi.TaskStatus.NOT_STARTED) {
			this.record.set('complete', false);
			this.record.set('percent_complete', 0);
			this.record.set('date_completed', null);
		} else {
			this.record.set('complete', false);

			// When the status is in progress, we reset the percent_complete
			// counts to 75% when it was previously marked as complete,
			// and we set it to 25% when it was previously marked as not started.
			var curComplete = this.record.get('percent_complete');
			if (curComplete === 0) {
				this.record.set('percent_complete', 0.25);
			} else if (curComplete === 1) {
				this.record.set('percent_complete', 0.75);
			}

			this.record.set('date_completed', null);
		}
		this.record.endEdit();
	},

	/**
	 * Event handler which is triggered when status fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was spinned.
	 * @private
	 */
	onCompleteSpin : function(field)
	{
		var newValue = field.getValue();

		this.record.beginEdit();
		if(newValue >= 0 && newValue < 0.1){
			this.record.set('status', Zarafa.core.mapi.TaskStatus.NOT_STARTED);
			this.record.set('complete', false);
			this.record.set('percent_complete', newValue);
			this.record.set('date_completed', null);
		}else if(newValue >= 0.1 && newValue < 1){
			this.record.set('status', Zarafa.core.mapi.TaskStatus.IN_PROGRESS);
			this.record.set('complete', false);
			this.record.set('percent_complete', newValue);
			this.record.set('date_completed', null);
		}else if(newValue === 1){
			this.record.set('status', Zarafa.core.mapi.TaskStatus.COMPLETE);
			this.record.set('complete', true);
			this.record.set('percent_complete', newValue);
			this.record.set('date_completed', new Date());
		}
		this.record.endEdit();
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.ui.DateRangeField} has been changed.
	 * This will update the start and due date inside the {@link #record} accordingly.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The original value for the field
	 * @private
	 */
	onDateRangeFieldChange : function(field, newRange, oldRange)
	{
		this.updateStartDueDate(this.record, newRange);
	},

	/**
	 * Update the 'startdate' and 'duedate' in the given record from
	 * the given daterange.
	 * @param {Zarafa.core.data.MAPIRecord} record the Record to update
	 * @param {Zarafa.core.DateRange} daterange the Daterange to apply
	 * @private
	 */
	updateStartDueDate : function(record, daterange)
	{
		var startDate = daterange.getStartDate();
		var dueDate = daterange.getDueDate();

		record.beginEdit();

		if(Ext.isDate(startDate)) {
			// The startDate is represented in UTC time,
			// so convert it to local to get the time for the property
			record.set('startdate', startDate.fromUTC());
			record.set('commonstart', startDate.clone());
		} else {
			record.set('startdate', null);
			record.set('commonstart', null);
		}

		if(Ext.isDate(dueDate)) {
			// The dueDate is represented in UTC time,
			// so convert it to local to get the time for the property
			record.set('duedate', dueDate.fromUTC());
			record.set('commonend', dueDate.clone());
		} else {
			record.set('duedate', null);
			record.set('commonend', null);
		}

		record.endEdit();
	}
});

Ext.reg('zarafa.taskgeneraltab', Zarafa.task.dialogs.TaskGeneralTab);
