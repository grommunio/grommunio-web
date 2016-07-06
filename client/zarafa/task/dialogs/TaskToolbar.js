Ext.namespace('Zarafa.task.dialogs');

/**
 * @class Zarafa.task.dialogs.TaskToolbar
 * @extends Zarafa.core.ui.ContentPanelToolbar
 * @xtype zarafa.tasktoolbar
 */
Zarafa.task.dialogs.TaskToolbar = Ext.extend(Zarafa.core.ui.ContentPanelToolbar, {
	// Insertion points for this class
	/**
	 * @insert context.task.taskeditcontentpanel.toolbar.actions
	 * Insertion point for the Actions buttons in the Edit Task Toolbar
	 * @param {Zarafa.task.dialogs.TaskToolbar} toolbar This toolbar
	 */
	/**
	 * @insert context.task.taskeditcontentpanel.toolbar.options
	 * Insertion point for the Options buttons in the Edit Task Toolbar
	 * @param {Zarafa.task.dialogs.TaskToolbar} toolbar This toolbar
	 */

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
			insertionPointBase : 'context.task.taskcontentpanel',
			actionItems: this.createActionButtons(),
			optionItems: this.createOptionButtons()
		});

		Zarafa.task.dialogs.TaskToolbar.superclass.constructor.call(this, config);
	},

	/**
	 * Create all buttons which should be added by default the the 'Actions' Buttons.
	 * These buttons are used to  send, save add attachments, delete, status of the message. And it contains
	 * also buttons to check the recipient names .
	 *
	 * @return {Array} The {@link Ext.Button Button} elements which should be
	 * added in the Options section of the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createActionButtons : function()
	{
		return [{
			xtype: 'button',
			// Hide, this functionality is not yet implemented
			hidden : true,
			overflowText: _('Send task to assignee'),
			tooltip: {
				title: _('Send assignment'),
				text: _('Send task to assignee')
			},
			iconCls: 'icon_sendEmail',
			ref: 'sendBtn',
			handler: this.onSendTask,
			scope: this
		},{
			xtype : 'button',
			ref : 'saveBtn',
			text : _('Save'),
			overflowText : _('Save task'),
			tooltip: {
				title: _('Save & Close'),
				text: _('Save task and close dialog') + ' (Ctrl + S)'
			},
			cls : 'zarafa-action',
			iconCls : 'buttons-icon_save_white',
			handler: this.onSave,
			scope : this
		}, {
			xtype : 'button',
			ref : 'deleteBtn',
			overflowText : _('Delete'),
			tooltip: {
				title: _('Delete'),
				text: _('Delete this task')
			},
			iconCls : 'icon_delete',
			handler : this.onDelete,
			scope : this
		},{
			xtype : 'zarafa.attachmentbutton',
			plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
			overflowText : _('Add Attachment'),
			tooltip: {
				title: _('Add attachment'),
				text: _('Add attachments to this task')
			},
			iconCls : 'icon_attachment',
			ref : 'attachmentButton',
			// Add a listener to the component added event to set use the correct update function when the toolbar overflows
			// (i.e. is too wide for the panel) and Ext moves the button to a menuitem.
			listeners : {
				added : this.onAttachmentButtonAdded,
				scope : this
			}
		}, {
			xtype : 'button',
			ref: 'markCompleteBtn',
			overflowText : _('Mark as Complete'),
			tooltip: {
				title: _('Mark as Complete'),
				text: _('Mark this task as complete')
			},
			iconCls : 'icon_task_complete',
			handler : this.onComplete,
			scope : this
		}, {
			xtype : 'button',
			overflowText : _('Print'),
			tooltip : {
				title : _('Print'),
				text : _('Print this task')
			},
			iconCls : 'icon_print',
			handler : this.onPrint,
			scope : this
		},{
			xtype: 'button',
			// Hide, this functionality is not yet implemented
			hidden : true,
			overflowText: _('Check names'),
			tooltip: {
				title: _('Check names'),
				text: _('Check all recipient names')
			},
			iconCls: 'icon_checkNames',
			ref: 'checkNamesBtn',
			handler: this.onCheckNames,
			scope: this
		}];
	},
	
	/**
	 * Event listener for the added event of the {@link Zarafa.common.attachment.ui.AttachmentButton attachmentButton}
	 * Adds the update function to the item when Ext converts the button to a menu item
	 * (which happens when the toolbar overflows, i.e. is too wide for the containing panel)
	 * 
	 * @param {Ext.Component} item The item that was added. This can be a {@link Zarafa.common.attachment.ui.AttachmentButton}
	 * or a {@link Ext.menu.Item}
	 */
	onAttachmentButtonAdded : function(item)
	{
		if ( item.isXType('menuitem') ){
			// Set the update function to the update function of the original button
			// otherwise the Ext.Component.update function would be called by the recordcomponentupdaterplugin
			item.update = Zarafa.common.attachment.ui.AttachmentButton.prototype.update.createDelegate(this.attachmentButton);
		}
	},

	/**
	 * Create all buttons which should be added by default the the `Options` buttons.
	 * This contains the buttons to aggisn the task set the task as recurrence.
	 *
	 * @return {Array} The {@link Ext.Button Button} elements which should be
	 * added in the Options section of the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createOptionButtons : function()
	{
		return [{
			xtype: 'button',
			// Hide, this functionality is not yet implemented
			hidden : true,
			text: _('Recurrence'),
			overflowText: _('Recurrence'),
			tooltip: {
				title: _('Recurrence'),
				text: _('Open the recurrence dialog')
			},
			iconCls: 'icon_recurrence',
			handler : this.onRecurrence,
			scope: this
		},{
			xtype: 'button',
			// Hide, this functionality is not yet implemented
			hidden : true,
			text: _('Assign Task'),
			overflowText: _('Assign Task'),
			tooltip: {
				title: _('Assign Task'),
				text: _('Assign Task')
			},
			iconCls: 'icon_create_task_request',
			ref: 'assignTask',
			handler: this.onAssignment,
			scope: this
		},{
			xtype: 'button',
			// Hide, this functionality is not yet implemented
			hidden : true,
			text: _('Cancel Assignment'),
			tooltip: {
				title: _('Cancel Assignment'),
				text: _('Cancel assigned attendee for this task')
			},
			overflowText: _('Cancel Assignment'),
			iconCls: 'icon_cancel_meeting_request',
			ref: 'cancelAssignmetBtn',
			handler: this.onCancelAssignment,
			scope: this
		},{
			xtype: 'button',
			overflowText: _('Categories'),
			tooltip: {
				title: _('Categories'),
				text: _('Open the categories dialog')
			},
			iconCls: 'icon_categories',
			handler: this.onCategories,
			scope: this
		},{
			xtype: 'button',
			overflowText: _('Private'),
			tooltip: {
				title: _('Private'),
				text: _('Mark this task as private')
			},
			iconCls: 'icon_private',
			ref: 'setPrivate',
			enableToggle : true,
			toggleHandler: this.onPrivateGroupToggle,
			scope: this
		}];
	},

	/**
	 * Event handler when the "Save" button has been pressed.
	 * This will {@link Zarafa.core.data.RecordContentPanel#saveRecord save} the given record.
	 * it also checks whether the meesage is a meeting, and iff to will send the changes to attendees aswell
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onSave : function(button)
	{
		this.dialog.saveRecord();
	},

	/**
	 * Event handler when the "Check Names" button has been pressed.
	 * This will {@link Zarafa.core.data.IPMRecipient#resolve resolve} all recipients.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onCheckNames : function(button)
	{
		this.record.getRecipientStore().resolve(undefined, { cancelPreviousRequest : true });
	},

	/**
	 * Event handler which is called when the "Recurrence" button has been pressed.
	 * This will open the {@link Zarafa.common.recurrence.dialogs.RecurrenceContentPanel RecurrenceContentPanel}.
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onRecurrence : function(button)
	{
		Zarafa.common.Actions.openRecurrenceContent(this.record, false);
	},

	/**
	 * Event handler which is called when the "Assign Task" button has
	 * been pressed. This will update the "Assiging" state of the record which
	 * will trigger the update of all UI components.
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onAssignment : function(button)
	{
		this.record.beginEdit();
		this.record.set('taskstate', Zarafa.core.mapi.TaskState.OWNER_NEW);
		this.record.set('taskmode', Zarafa.core.mapi.TaskMode.REQUEST);
		this.record.endEdit();
	},

	/**
	 * Event handler which is called when the "Cancel Assignment" button has
	 * been pressed. This will cancel the "assigned" state of the record which
	 * will trigger the update of all UI components.
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onCancelAssignment : function(button)
	{
		this.record.beginEdit();
		this.record.set('taskstate', Zarafa.core.mapi.TaskState.NORMAL);
		this.record.set('taskmode', Zarafa.core.mapi.TaskMode.NOTHING);
		this.record.endEdit();
	},

	/**
	 * Event handler which is is called when the user presses the "Mark as Complete" button.
	 * This will mark the record as "complete".
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onComplete : function(button)
	{
		this.record.beginEdit();
		this.record.set('complete', true);
		this.record.set('percent_complete', 1);
		this.record.set('status', Zarafa.core.mapi.TaskStatus.COMPLETE);
		this.record.set('date_completed', new Date());
		this.record.endEdit();

		/**
		 * Send request for saving the record as after marking task as complete
		 * it should save all the properties and close the dialog.
		 */
		this.dialog.saveRecord();
	},

	/**
	 * Event handler which is called when the user pressed the 'Categories' button.
	 * This will open the {@link Zarafa.common.categories.dialogs.CategoriesContentPanel CategoriesContentPanel}.
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onCategories : function(button)
	{
		Zarafa.common.Actions.openCategoriesContent(this.record, {autoSave : false});
	},

	/**
	 * Event handler which is called when the user pressed the 'Delete' button.
	 * This will call {@link Zarafa.core.ui.RecordContentPanel#deleteRecord} to delete the record
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onDelete : function(button)
	{
		this.dialog.deleteRecord();
	},
	/**
	 * Event handler which is called when the user pressed the 'Print' button.
	 * This will call {@link Zarafa.common.Actions.openPrintDialog} to print the record
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onPrint : function()
	{
		Zarafa.common.Actions.openPrintDialog(this.record);
	},
	/**
	 * Event handler which is called when the PrivateGroup button
	 * has been toggled. If this is the case 'private' is updated.
	 *
	 * @param {Ext.Button} button The button which was toggled
	 * @private
	 */
	onPrivateGroupToggle : function(button)
	{
		this.record.beginEdit();
		this.record.set('private', button.pressed);
		if (button.pressed) {
			this.record.set('sensitivity', Zarafa.core.mapi.Sensitivity['PRIVATE']);
		} else {
			this.record.set('sensitivity', Zarafa.core.mapi.Sensitivity['NONE']);
		}
		this.record.endEdit();
	},

	/**
	 * Updates the toolbar by updating the Toolbar buttons based on the settings
	 * from the {@link Zarafa.core.data.IPMRecord record}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		var layout = false;

		this.record = record;

		if(record.isSubMessage()) {
			this.deleteBtn.setVisible(false);
			this.sendBtn.setVisible(false);
			this.saveBtn.setVisible(false);
			this.checkNamesBtn.setVisible(false);
			this.cancelAssignmetBtn.setVisible(false);
			this.markCompleteBtn.setVisible(false);
			this.setPrivate.setVisible(false);

			layout = true;
		} else {
			this.saveBtn.setVisible(true);
			this.deleteBtn.setVisible(true);
			this.markCompleteBtn.setVisible(true);
			this.setPrivate.setVisible(true);

			// Only enable Disabled button when it is not a phantom
			this.deleteBtn.setDisabled(record.phantom === true);

			if (contentReset === true || record.isModifiedSinceLastUpdate('complete')) {
				this.markCompleteBtn.setDisabled(record.get('complete'));
			}

			if (contentReset === true || record.isModifiedSinceLastUpdate('private')) {
				this.setPrivate.toggle(record.get('private'), true);
			}

			if (contentReset === true || record.isModified('taskmode')) {
				switch (record.get('taskmode')) {
				/*
				 * Disabled, this functionality is not yet implemented
				case Zarafa.core.mapi.TaskMode.REQUEST:
					this.send.setVisible(true);
					this.checkNames.setVisible(true);
					this.assignTask.setVisible(false);
					this.cancelAssignmetBtn.setVisible(true);
					break;
				*/
				case Zarafa.core.mapi.TaskMode.NOTHING:
				/* falls through */
				default:
					this.sendBtn.setVisible(false);
					this.checkNamesBtn.setVisible(false);
					// Disabled, this functionality is not yet implemented
					//this.assignTask.setVisible(true);
					this.cancelAssignmetBtn.setVisible(false);
					break;
				}

				layout = true;
			}
		}

		if(layout) {
			this.doLayout();
		}
	},

	/**
	 * Send the {@link Zarafa.core.data.IPMRecord record} to the recipient
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onSendTask : function(button)
	{
		this.dialog.sendRecord();
	}

});

Ext.reg('zarafa.tasktoolbar', Zarafa.task.dialogs.TaskToolbar);
