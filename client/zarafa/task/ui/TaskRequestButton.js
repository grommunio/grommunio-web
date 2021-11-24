Ext.namespace('Zarafa.task.ui');

/**
 * @class Zarafa.task.ui.TaskRequestButton
 * @extends Ext.Button
 * @xtype zarafa.taskrequestbutton
 *
 * Singleton Base class for all task request buttons which can be added to {@link Ext.Toolbar Toolbar}.
 * It contains common functions of all task request buttons and handlers for all task request buttons.
 */
Zarafa.task.ui.TaskRequestButton = Ext.extend(Ext.Button, {
	/**
	 * The record for which this ButtonGroup is shown.
	 * @property
	 * @type Ext.data.Record
	 */
	record: undefined,

	/**
	 * This property will keep track whether this component was visible or hidden last.
	 * it will be set in {@link update} function.
	 * @property
	 * @type Boolean
	 */
	visible: false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config) {
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			hidden: true,
			forceLayout: true,
			cls: 'k-tr-buttons',
			ref: 'taskRequestButtons',
			handler: this.openSendConfirmationContent,
			scope: this,

			/**
			 * Note: This is a fix for a bug: when Ext.js converts buttons to menuitems,
			 * it takes button component's initial configs into consideration.
			 * Initially this button component is hidden so we need to show/hide menuitem
			 * on the basis of visible config which is being set.
			 * in {@link #update} function.
			 */
			beforeShow: function(item) {
				item.setVisible(this.visible);
			}
		});

		Zarafa.task.ui.TaskRequestButton.superclass.constructor.call(this, config);

		/**
		 * We need to remove 'zarafa.recordcomponentupdaterplugin' plugin from initialConfig.
		 * Because Ext uses initialConfig to make a menu item from button component.
		 * This 'zarafa.recordcomponentupdaterplugin' plugin will call update function
		 * which will not be found in newly created menuitem.
		 * So it will call Ext's update function instead
		 * and beacause Ext's update function will get called with wrong parameters,
		 * text of menu item will be changed.
		 */
		this.initialConfig.plugins = [];
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update: function(record, contentReset)
	{
		if (!(record instanceof Zarafa.task.TaskRecord)) {
			this.setVisible(false);
			return;
		}

		this.record = record;
		this.visible = false;
		var isAcceptbtn = this.name === Zarafa.task.data.TaskRequestButtonNames.ACCEPT;
		var isDeclineBtn = this.name === Zarafa.task.data.TaskRequestButtonNames.DECLINE;

		if (contentReset) {
			var isMessageTaskResponse = Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.TaskRequest.Accept', 'IPM.TaskRequest.Update', 'IPM.TaskRequest.Decline', 'IPM.TaskRequest.Complete']);
			var isTaskReceived = false;
			var isTaskAccepted = false;

			// Check if we are having a sub message, if then don't display any of the buttons
			var isSubMessage = record.isSubMessage();

			// If record is instance of TaskRequestRecord, message_class property is IPM.TaskRequest and record is received task
			// then show the Accept and Decline button in preview panel toolbar
			if (record instanceof Zarafa.task.TaskRequestRecord && record.isMessageClass('IPM.TaskRequest')) {
				var iskAssignedTR = record.isReceivedTaskRequestFromAssigner();
				this.visible = iskAssignedTR && !isSubMessage;
			} else if(!isMessageTaskResponse) {
				// Condition gets true if record is other then 'IPM.TaskRequest/.Accept/.Update/.Decline'.
				// isTaskOwner gets true if user is owner of this task else false
				var isTaskOwner = record.isTaskOwner();
				// isTaskAssigned gets true if task was assigned to login user else false.
				var isTaskAssigned = record.isTaskAssigned();
				// isTaskReceived gets true if task is received task else false.
				isTaskReceived = record.isTaskReceived();
				// isTaskReceived gets true if task is Accepted by user else false.
				isTaskAccepted = record.isTaskAccepted();

				// showAcceptButton gets true if task is received task, task is assigned to user, user is owner of the task
				// and task yet not accepted else false.
				if (isAcceptbtn) {
					this.visible = (isTaskReceived && isTaskAssigned && isTaskOwner && !isTaskAccepted && !isSubMessage);
				} else if (isDeclineBtn) {
					// showDeclineButton get's true if task is received task, user is owner of the task and
					// task is assigned to user and task is accepted else false.
					this.visible = (!isSubMessage && isTaskReceived && isTaskOwner && (isTaskAssigned || isTaskAccepted || record.isTaskUpdated()));
				}
			}
			this.setVisible(this.visible);
		} else if (record.isModifiedSinceLastUpdate('taskmode')) {
			this.setVisible(this.visible);
		}

		if (isAcceptbtn && this.isVisible()) {
			this.getEl().addClass('zarafa-action');
		}
	},

	/**
	 * Opens a {@link Zarafa.task.dialogs.SendTaskRequestConfirmationContentPanel SendTaskRequestConfirmationContentPanel}
	 *
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	openSendConfirmationContent: function(button, eventObject)
	{
		if (this.record.isTaskOwner()) {
			Zarafa.task.Actions.openSendConfirmationContent(this.record, { responseType: button.responseStatus });
		}
	}
});

Ext.reg('zarafa.taskrequestbutton', Zarafa.task.ui.TaskRequestButton);