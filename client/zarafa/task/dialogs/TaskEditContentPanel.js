Ext.namespace('Zarafa.task.dialogs');

/**
 * @class Zarafa.task.dialogs.TaskEditContentPanel
 * @extends Zarafa.core.ui.MessageContentPanel
 * @xtype zarafa.taskeditcontentpanel
 *
 * this class will be used to create a task edit content panel
 */
Zarafa.task.dialogs.TaskEditContentPanel = Ext.extend(Zarafa.core.ui.MessageContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			layout : 'fit',
			xtype : 'zarafa.taskeditcontentpanel',
			closeOnSave : true,
			closeOnSend : true,
			title : _('Task'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			confirmClose : true,
			items :[{
				xtype : 'zarafa.taskpanel',
				tbar : {
					xtype: 'zarafa.tasktoolbar'
				}
			}]
		});

		Zarafa.task.dialogs.TaskEditContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Create and initialize the {@link #sendValidationQueue}. This will add various
	 * validation steps which must be executed to determine if the message can be send.
	 * @protected
	 */
	createSendValidationQueue : function()
	{
		Zarafa.task.dialogs.TaskEditContentPanel.superclass.createSendValidationQueue.apply(this, arguments);
		// Add a validation step to determine sender is not assigned task
		// to him self or assigned single task to multiple assignee.
		this.sendValidationQueue.add(this.validateSenderIsNotRecipient, this);
	},

	/**
	 * Validation function for the {@link #sendValidationQueue} to check if the Message
	 * can be send to the recipients.
	 *
	 * This validates if the user is in recipients list, if yes then the warning message
	 * throw to user as user can to assigned task to yourself. Also shows the warning message if
	 * user is trying to assigned single task to multiple user.
	 *
	 * @param {Function} callback The callback to call to continue in the queue
	 * @private
	 */
	validateSenderIsNotRecipient : function (callback)
	{
		if(!this.record.isMessageClass('IPM.Task')) {
			callback(true);
			return;
		}

		var recipientStore = this.record.getRecipientStore();
		var recipients = recipientStore.getRange();
		var isSenderIsRecipient = false;
		var isDistlist = false;
		var recipientCount = 0;
		Ext.each(recipients, function (recipient) {
			if (Zarafa.core.EntryId.compareEntryIds(container.getUser().getEntryId(), recipient.get('entryid')) && !isSenderIsRecipient) {
				isSenderIsRecipient = true;
			}

			if (recipient.get('recipient_type') === Zarafa.core.mapi.RecipientType.MAPI_TO) {
				recipientCount++;
			}

			if (recipient.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_DISTLIST) {
				isDistlist = true;
				return false;
			}
		},this);

		if (isSenderIsRecipient) {
			container.getNotifier().notify('warning.sending', _('Kopano WebApp'), _('You cannot send a task request to yourself.'));
			callback(false);
		} else if (recipientCount > 1 || isDistlist) {
			container.getNotifier().notify('warning.sending', _('Kopano WebApp'), _('A task request can only have one recipient.'));
			callback(false);
		} else {
			callback(true);
		}
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if (record.isOpened()) {
			if (record.isTaskRequest() ||
				(!contentReset && record.isModifiedSinceLastUpdate('taskhistory')
				&& record.get('taskhistory') === Zarafa.core.mapi.TaskHistory.NONE)) {
				this.closeOnSave = false;
			} else {
				this.closeOnSave = true;
			}
		}
		this.updateIconFromRecord(record);
		this.updateTitleFromRecord(record);
	},

	/**
	 * Update this panel's icon class from the record that it contains
	 * First obtains the icon class from a mapping, then calls {@link #setIcon}
	 * 
	 * @param {Zarafa.core.data.MAPIRecord} record The record bound to this component
	 * @private
	 */
	updateIconFromRecord : function(record)
	{
		//TODO: create a new icon mapping for tabs
		var iconCls = Zarafa.common.ui.IconClass.getIconClass(record);
		this.setIcon(iconCls);
	},

	/**
	 * When record has been updated, title also has to be - for instance if we have the subject 
	 * in the title and the subject changes
	 * Calls {@link #setTitle} this.setTitle in order to update
	 * @param {Zarafa.core.data.MAPIRecord} record The record that has been updated
	 */
	updateTitleFromRecord : function(record)
	{
		var subject = record.get('subject');
		if(!Ext.isEmpty(subject)){
			this.setTitle(subject);
		} else {
			this.setTitle(this.initialConfig.title);
		}
	},

	/**
	 * Save all changes made to the {@link #record} and send 
	 * the message to the specified recipients.
	 */
	sendRecord : function()
	{
		if(!this.record.isTaskRequest()) {
			// can not send a non task request record
			return;
		}

		return Zarafa.task.dialogs.TaskEditContentPanel.superclass.sendRecord.apply(this, arguments);
	}
});

// register dialog
Ext.reg('zarafa.taskeditcontentpanel', Zarafa.task.dialogs.TaskEditContentPanel);
