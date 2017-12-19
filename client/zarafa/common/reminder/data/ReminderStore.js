/*
 * #dependsFile client/zarafa/common/reminder/data/ReminderProxy.js
 */
Ext.namespace('Zarafa.common.reminder.data');

/**
 * @class Zarafa.common.reminder.data.ReminderStore
 * @extends Zarafa.core.data.MAPIStore
 * @xtype zarafa.reminderstore
 */
Zarafa.common.reminder.data.ReminderStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @cfg {String} actionType type of action that should be used to send request to server,
	 * valid action types are defined in {@link Zarafa.core.Actions Actions}, default value is 'list'.
	 */
	actionType : Zarafa.core.Actions['list'],

	/**
	 * Checksum that will be generated from records that are received from server, this checksum will be
	 * used to check if server did sent us new data than the data shown in previous reminder dialog.
	 * @property
	 * @type Number
	 */
	lastChecksum : undefined,

	/**
	 * Flag is used to indicate that we should reload the data in {@link Zarafa.common.reminder.data.ReminderStore ReminderStore}
	 * after receiving response of snooze or dismiss actions, so we don't have to wait untill new polling request is sent to get reminder data
	 * because it could happen that there are still some reminders pending for action and user has only selected some reminders
	 * for snoozing or dismissing.
	 * @property
	 * @type Boolean
	 */
	refreshStore : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};
		
		var recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_REMINDER);

		Ext.applyIf(config, {
			proxy: new Zarafa.common.reminder.data.ReminderProxy(),
			writer: new Zarafa.core.data.JsonWriter(),
			reader: new Zarafa.core.data.JsonReader({ dynamicRecord : false }, recordType),

			// @FIXME when batching the delete requests then there is some problem with response router and
			// it updates the grid view twice with the same data
			batch : false
		});

		Zarafa.common.reminder.data.ReminderStore.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize events which Zarafa.common.reminder.data.ReminderStore ReminderStore} will listen to.
	 * @protected
	 */
	initEvents : function()
	{
		this.on('exception', this.onError, this);
		Zarafa.common.reminder.data.ReminderStore.superclass.initEvents.call(this);
	},

	/**
	 * <p>Loads the Record cache from the configured <tt>{@link #proxy}</tt> using the configured <tt>{@link #reader}</tt>.</p>
	 * <br> Function just adds 'list' as actionType in options and calls parent {@link Zarafa.core.data.IPFStore#load} method.
	 * <br> Check documentation of {@link Ext.data.Store#load} for more information.
	 */
	load : function(options)
	{
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		// Load should always cancel the previous actions.
		if (!Ext.isDefined(options.cancelPreviousRequest)) {
			options.cancelPreviousRequest = true;
		}

		// ignore action type passed in options and instead use action type from config
		Ext.apply(options, {
			actionType : this.actionType
		});

		return Zarafa.common.reminder.data.ReminderStore.superclass.load.call(this, options);
	},

	/**
	 * Event handler will be called when an error/exception is occured at server side,
	 * and error is returned. And interval will be cleared to avoid more errors.
	 * @param {Zarafa.core.data.MAPIProxy} proxy object that received the error
	 * and which fired exception event.
	 * @param {String} type 'request' if an invalid response from server recieved,
	 * 'remote' if valid response received from server but with succuessProperty === false.
	 * @param {String} action Name of the action {@link Ext.data.Api.actions}.
	 * @param {Object} options The options for the action that were specified in the request.
	 * @param {Object} response response received from server depends on type.
	 * @param {Mixed} args
	 */
	onError : function(proxy, type, action, options, response, args)
	{
		// if any error occurs in getting reminders then we don't need to nag users by displaying error message
		// every time so we will show the error message once and clear the timer, so no more requests for reminder will be sent
		if(action === Ext.data.Api.actions.read) {
			this.clearReminderInterval();
		}

		// clear the checksum, after getting error we should always show the reminder dialog even if no reminders are changed
		this.lastChecksum = undefined;
	},


	/**
	 * Initialize remider requests to the server. Listen to the aftersend event in the 
	 * {@link Zarafa.core.Request Request} object to reset the counter everytime the clients sends a 
	 * request to the server.
	 */
	initializeReminderInterval : function()
	{
		var interval = container.getSettingsModel().get('zarafa/v1/main/reminder/polling_interval');

		// Fire reminder request automatically at specific interval
		if (Ext.isNumber(interval) && interval > 0) {
			this.on('load', this.sendReminderRequest, this, { buffer : interval * 1000});
			this.sendReminderRequest.defer(interval * 1000, this);
		}
	},

	/**
	 * Function which is called periodically to send a reminder request to the server.
	 * @private
	 */
	sendReminderRequest : function()
	{
		this.load();
	},

	/**
	 * Function will reset reminder request interval.
	 * @private
	 */
	resetReminderInterval : function()
	{
		this.clearReminderInterval();
		this.initializeReminderInterval();
	},

	/**
	 * Function will clear reminder request interval.
	 * @private
	 */
	clearReminderInterval : function()
	{
		this.un('load', this.sendReminderRequest, this);
	},

	/**
	 * Function is used as a callback for 'read' action, we have overriden it to
	 * support search also using same 'read' action instead of creating new action.
	 * this will check that if action type is list then will do normal processing and
	 * add {@link Zarafa.core.data.IPMRecords[] records} to {@link Zarafa.core.data.ListModuleStore store}
	 * and if action type is search then it will call {@link #updateSearchInfo} as a callback function.
	 * @param {Object} data data that is returned by the proxy after processing it. will contain
	 * {@link Zarafa.core.data.IPMRecords records}.
	 * @param {Object} options options that are paased through {@link #load} event.
	 * @param {Boolean} success success status of request.
	 */
	loadRecords : function(data, options, success)
	{
		Zarafa.common.reminder.data.ReminderStore.superclass.loadRecords.apply(this, arguments);

		if (success !== false) {
			var records = data.records;

			// @FIXME server sends md5 checksum for this checking, so its better to use that checksum here
			var newChecksum = Ext.util.JSON.encode(Ext.pluck(records, 'id'));

			// if checksum has been changed that means we should update the store with new data
			if(this.lastChecksum !== newChecksum) {
				if (records.length > 0) {
					var notificationMessage = String.format(ngettext('There is {0} reminder', 'There are {0} reminders', records.length), records.length);
					container.getNotifier().notify('info.reminder', _('Reminders'), notificationMessage);
				}

				// We call this function regardless of the number of reminders,
				// as it will close an already opened window when 0 reminders are loaded.
				Zarafa.common.Actions.openReminderContent(records);

				this.lastChecksum = newChecksum;
			}
		}
	},

	/**
	 * Function dismisses the reminder which are passed to the function.
	 * @param {Zarafa.common.reminder.data.ReminderRecord[]} reminderRecords 
	 * reminder records which are going to be dismissed
	 */
	dismissReminders : function(reminderRecords)
	{
		Ext.each(reminderRecords, function(reminderRecord) {
			reminderRecord.addMessageAction('action_type', 'dismiss');
		}, this);

		this.remove(reminderRecords);
		this.refreshStore = true;
		this.save(reminderRecords);
	},

	/**
	 * Function will snooze the reminder with the time passed to the function.
	 * @param {Zarafa.common.reminder.data.ReminderRecord[]} reminderRecords
	 * reminder records which are going to be snoozed.
	 * @param {Number} snoozeTime time in minutes, after which reminder will be pop-up again.
	 */
	snoozeReminders : function(reminderRecords, snoozeTime)
	{
		Ext.each(reminderRecords, function(reminderRecord) {
			reminderRecord.addMessageAction('action_type', 'snooze');
			reminderRecord.addMessageAction('snoozeTime', snoozeTime);
		}, this);

		this.remove(reminderRecords);
		this.refreshStore = true;
		this.save(reminderRecords);
	},

	/**
	 * Event handler which is raised when the {@link #write} event has been fired. This will
	 * send list request for reminders and will reset reminder polling interval.
	 *
	 * @param {Zarafa.core.data.MAPIStore} store The store which fired the event
	 * @param {String} action [Ext.data.Api.actions.create|update|destroy]
	 * @param {Object} result The 'data' picked-out out of the response for convenience
	 * @param {Ext.Direct.Transaction} res The transaction
	 * @param {Record/Record[]} records The records which were written to the server
	 * @private
	 */
	onWrite : function(store, action, result, res, records)
	{
		records = [].concat(records);

		for (var i = 0, len = records.length; i < len; i++) {
			if(records[i].getMessageAction("action_type") == "dismiss" || records[i].getMessageAction("action_type") == "snooze") {
				if(this.refreshStore) {
					// send request to get updated data
					this.sendReminderRequest();

					this.refreshStore = false;
					break;
				}
			}
		}

		Zarafa.common.reminder.data.ReminderStore.superclass.onWrite.apply(this, arguments);
	}
});

Ext.reg('zarafa.reminderstore', Zarafa.common.reminder.data.ReminderStore);
