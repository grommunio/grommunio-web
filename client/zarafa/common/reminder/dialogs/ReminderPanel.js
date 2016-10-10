Ext.namespace('Zarafa.common.reminder.dialogs');

/**
 * @class Zarafa.common.reminder.dialogs.ReminderPanel
 * @extends Ext.Panel
 * @xtype zarafa.reminderpanel
 */
Zarafa.common.reminder.dialogs.ReminderPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.common.reminder.data.ReminderStore} store store that will be used to get reminder information.
	 */
	store : undefined,

	/**
	 * @cfg {Ext.Template/String} activeReminderTemplate The template or template string which
	 * must be applied to the {@link Zarafa.common.reminder.dialogs.ReminderPanel #activeReminder} to build selected reminder info when the
	 * {@link Zarafa.common.reminder.data.ReminderRecord record} has been {@link #update updated}.
	 * The arguments of this template will be the {@link Zarafa.common.reminder.data.ReminderRecord#data record.data} field.
	 */
	activeReminderTemplate :
		'<tpl>' +
			'<div>'+
				'<span class="zarafa-reminder-dialog-active-reminder-icon {[Zarafa.common.ui.IconClass.getIconClassFromMessageClass(false, values.message_class)]}"></span>'+
				'<span class="zarafa-reminder-dialog-active-reminder-subject">' +
					'<tpl if="!Ext.isEmpty(values.subject)">' +
						// @FIXME this should be changed to truncate strings based on dialog width
						'{values.subject:htmlEncodeEllipsis(60)}'+
					'</tpl>' +
					'<tpl if="Ext.isEmpty(values.subject)">' +
						'&nbsp;'+
					'</tpl>' +
				'</span>'+
			'</div>'+
			'<div>'+
				'<span>' +
					// Use &quot; instead of " or \" as neither will be accepted by the XTemplate for creating a string
					'<tpl if="Zarafa.core.ContainerClass.isClass(values.message_class, &quot;IPM.Task&quot;, true)">' +
						'<tpl if="Ext.isDefined(values.task_duedate)">' +
							_('Due') + ': {values.task_duedate:date("' +
							// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
							_('l jS F Y') + '")}' +
						'</tpl>' +
						'<tpl if="Ext.isDefined(values.reminder_time) && !Ext.isDefined(values.task_duedate)">' +
							_('Reminder time') + ': {values.reminder_time:date("' +
							// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
							_('l jS F Y G:i') + '")}'+
						'</tpl>' +
					'</tpl>' +
					// Use &quot; instead of " or \" as neither will be accepted by the XTemplate for creating a string
					'<tpl if="!Zarafa.core.ContainerClass.isClass(values.message_class, &quot;IPM.Task&quot;, true)">' +
						'<tpl if="Ext.isDefined(values.reminder_time)">' +
							_('Start time') + ': {values.reminder_time:date("' +
							// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
							_('l jS F Y G:i') + '")}'+
						'</tpl>' +
					'</tpl>' +
				'</span>'+
			'</div>'+
			// @TODO show location data
		'</tpl>',

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.reminderpanel',
			layout: {
				type : 'vbox',
				align : 'stretch',
				pack  : 'start'
			},
			header: false,
			border: false,
			defaults: {
				border: false
			},
			items: [
				this.activeReminderPanel(),
				this.reminderGrid(config.store),
				this.reminderAction(),
				this.reminderSnooze()
			]
		});

		Zarafa.common.reminder.dialogs.ReminderPanel.superclass.constructor.call(this, config);

		if (Ext.isString(this.activeReminderTemplate)) {
			this.activeReminderTemplate = new Ext.XTemplate(this.activeReminderTemplate, {
				compiled: true
			});
		}
	},

	/**
	 * Create the {@link Ext.Panel panel} containing the information about active/selected reminder
	 * and some extra information about it.
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	activeReminderPanel : function()
	{
		return {
			xtype: 'panel',
			cls:'zarafa-reminder-dialog-active-reminder',
			layout: 'fit',
			ref: 'activeReminder',
			height : 40
		};
	},

	/**
	 * Create the {@link Zarafa.common.reminder.dialogs.ReminderGrid ReminderGrid} object.
	 * @param {Zarafa.common.reminder.ReminderStore} store reminder store.
	 * @return {Object} The configuration object for the reminder grid
	 * @private
	 */
	reminderGrid : function(store)
	{
		return{
			xtype: 'zarafa.remindergrid',
			ref : 'reminderGridView',
			store : store,
			border : true,
			flex : 2
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the form button fields
	 * which performs different action on selected reminders
	 * @return {Object} Configuration object for the panel with reminder action fields
	 * @private
	 */
	reminderAction : function()
	{
		return{
			xtype : 'panel',
			layout : 'fit',
			height : 40,
			ref : 'reminderAction',
			minButtonWidth : 90,
			buttons : [{
				text	: _('Dismiss All'),
				handler	: this.onDismissAll,
				ref: '../../dismissAllButton',
				scope	: this
			},{
				text	: _('Open Item'),
				handler	: this.onOpenItem,
				ref: '../../openButton',
				scope	: this
			},{
				text	: _('Dismiss'),
				handler	: this.onDismiss,
				ref: '../../dismissButton',
				scope	: this
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the form snooze button fields
	 * which will set the snoozing time for selected reminders
	 * @return {Object} Configuration object for the panel with snooze field
	 * @private
	 */
	reminderSnooze : function()
	{
		var reminderStore = {
			xtype: 'jsonstore',
			fields: ['name', 'value'],
			// Remove the first value of the ReminderPeriods array because
			// we don't need to snooze with a period of 0 minutes.
			data : Zarafa.calendar.data.ReminderPeriods.slice(1)
		};

		return{
			xtype: 'panel',
			cls: 'zarafa-reminder-dialog-snooze',
			layout: {
				type : 'vbox',
				align : 'stretch',
				pack  : 'start'
			},
			height : 80,
			ref: 'reminderAction',
			items:[{
				xtype: 'displayfield',
				value:  _('Click Snooze to be reminded again in') + ': ',
				hideLabel : true,
				height : 25,
				ref: '../snoozeInfoText'
			},{
				xtype: 'panel',
				layout: 'hbox',
				border: false,
				flex : 1,
				items: [{
					xtype: 'combo',
					ref: '../../snoozeTimeCombo',
					name: 'snooze',
					flex : 1,
					store: reminderStore,
					mode: 'local',
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'value',
					value : container.getSettingsModel().get('zarafa/v1/main/reminder/default_snooze_time'),
					lazyInit: false,
					forceSelection: true,
					editable: false
				},{
					xtype: 'spacer',
					width: 10
				},{
					xtype	: 'button',
					width : 90,
					text	: _('Snooze'),
					handler	: this.onSnooze,
					ref: '../../snoozeButton',
					scope	: this
				}]
			}]
		};
	},

	/**
	 * initialize events for the {@link Zarafa.common.reminder.dialogs.ReminderPanel ReminderPanel}
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.reminder.dialogs.ReminderPanel.superclass.initEvents.call(this);

		this.mon(this.reminderGridView, 'viewready', this.onViewReady, this);
		this.mon(this.reminderGridView.getSelectionModel(), 'selectionchange', this.onSelectionChange, this);
		this.mon(this.reminderGridView.getSelectionModel(), 'selectionchange', this.toggleFields, this);
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.reminder.dialogs.ReminderGrid ReminderGrid}
	 * is ready. This will automatically select the first row in the grid.
	 * @private
	 */
	onViewReady: function()
	{
		this.reminderGridView.getSelectionModel().selectFirstRow();
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.common.reminder.dialogs.ReminderGrid ReminderGrid}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.common.reminder.dialogs.ReminderPanel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange : function()
	{
		var selections = this.reminderGridView.getSelectionModel().getSelections();

		// clear the previous contents
		var el = this.activeReminder.getEl();
		if(Ext.isDefined(el.dom)) {
			el.dom.innerHTML = '';
		}

		if (selections.length == 1) {
			this.activeReminderTemplate.overwrite(el.dom , selections[0].data);
		} else {
			el.createChild({
				tag: 'div',
				html: String.format(
					npgettext('reminder.dialog', '{0} reminder is selected.', '{0} reminders are selected.', selections.length),
					selections.length
				)
			});
		}

		this.doLayout();
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.common.reminder.dialogs.ReminderGrid grid}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed.
	 *
	 * Function will disable buttons if there isn't any reminder selected.
	 * @private
	 */
	toggleFields : function()
	{
		var reminderCount = this.reminderGridView.getStore().getCount();

		var hasSelection = false;
		if(reminderCount > 0) {
			hasSelection = this.reminderGridView.getSelectionModel().hasSelection();
		}

		// If any reminder is not selected then disable buttons and fields.
		this.dismissButton.setDisabled(!hasSelection);
		this.openButton.setDisabled(!hasSelection);
		this.snoozeTimeCombo.setDisabled(!hasSelection);
		this.snoozeButton.setDisabled(!hasSelection);
		this.snoozeInfoText.setDisabled(!hasSelection);

		// if any reminder is present then show dismiss all button
		// @FIXME this should be done on store events instead of here
		this.dismissAllButton.setDisabled(reminderCount <= 0);
	},

	/**
	 * Function will send request to dismiss all reminder present at the given time.
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	onDismissAll : function()
	{
		this.store.dismissReminders(this.store.getRange());

		// close the dialog, if error occurs in dismiss all then reminder dialog will popup again after reminder interval
		this.dialog.close();
	},

	/**
	 * Function will open appointment/task/mail item for the selected reminder item.
	 * if multiple reminders are selected then it will open only the first item.
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	onOpenItem : function()
	{
		var record = this.reminderGridView.getSelectionModel().getSelected();

		if(record) {
			Zarafa.common.Actions.openReminderRecord(record);
		}
	},

	/**
	 * Function will send request to dismiss selected reminder
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	onDismiss : function()
	{
		var selectedRecords = this.reminderGridView.getSelectionModel().getSelections();

		this.store.dismissReminders(selectedRecords);

		// we have selected all reminders to dismiss, so a virtual dismiss all
		if(this.store.getCount() === 0) {
			// close the dialog, if error occurs in dismiss then reminder dialog will popup again after reminder interval
			this.dialog.close();
		}
	},

	/**
	 * Function will set the snooze timing for selected reminders
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	onSnooze : function()
	{
		var selectedRecords = this.reminderGridView.getSelectionModel().getSelections();
		this.store.snoozeReminders(selectedRecords, this.snoozeTimeCombo.getValue());
	}
});

Ext.reg('zarafa.reminderpanel', Zarafa.common.reminder.dialogs.ReminderPanel);
