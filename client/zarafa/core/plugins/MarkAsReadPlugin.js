Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.MarkAsReadPlugin
 * @extends Object
 * @ptype zarafa.markasreadplugin
 *
 * Special plugin which must be used in combination with the
 * {@link Zarafa.core.plugins.RecordComponentPlugin}. This will
 * mark the message as read after a certain time.
 */
Zarafa.core.plugins.MarkAsReadPlugin = Ext.extend(Object, {
	/**
	 * The component which has been {@link #init initialized} on
	 * this plugin.
	 * @property
	 * @type Ext.Component
	 */
	field: undefined,

	/**
	 * The record which has been {@link #onSetRecord set} on the
	 * {@link #field}.
	 * @property
	 * @type Zarafa.core.data.MAPIRecord
	 */
	record: undefined,

	/**
	 * timer that is used to set message as read after specified seconds
	 * @property
	 * @type Number
	 */
	readFlagTimer: undefined,

	/**
	 * Indicate that setting/starting up the {@link #readFlagTimer} will be
	 * ignored and record will be marked as read directly.
	 * @property
	 * @type Boolean
	 */
	ignoreReadFlagTimer: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * Initializes the {@link Ext.Component Component} to which this plugin has been hooked.
	 * @param {Ext.Component} field The component on which the plugin is installed
	 */
	init: function(field)
	{
		this.field = field;
		field.markAsReadPlugin = this;

		this.field.on('render', this.onRender, this);

		if (field.addInternalAction) {
			field.addInternalAction('send_read_receipt');
		}
	},

	/**
	 * Event handler for the {@link Ext.Component#render render} event
	 * on the {@link #field}. This will register the event handlers which
	 * are needed to listen for record changes.
	 */
	onRender: function()
	{
		this.field.on({
			'setrecord': this.onSetRecord,
			'beforesetrecord': this.onBeforeSetRecord,
			'beforeloadrecord': this.onBeforeLoadRecord,
			'loadrecord': this.onLoadRecord,
			'close': this.onDestroy,
			'destroy': this.onDestroy,
			'scope': this
		});
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#setrecord setrecord} event
	 * on the {@link #field}. This will {@link #resetReadFlagTimer stop} the {@link #readFlagTimer}.
	 * @param {Ext.Component} field The component which fired the event
	 * @param {Zarafa.core.data.MAPIRecord} record The new record which is being set
	 * @param {Zarafa.core.data.MAPIRecord} oldrecord The old record which was previously set
	 * @private
	 */
	onSetRecord: function(field, record, oldrecord)
	{
		// If the record is the same, the data of the record was just updated. No need to mark it as
		// read/unread then.
		if ( record && oldrecord && record.equals(oldrecord) ){
			return;
		}

		this.resetReadFlagTimer();

		// here, parameter named 'record' is the instance of shadowstore record.
		if(record && record.isOpened()) {
			// if shadowstore record is opened then fire load event on original record(record of list view)
			// as we are using that record to mark it as read.
			this.onLoadRecord(this.field, this.record);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#beforesetrecord beforesetrecord} event
	 * on the {@link #field}. This will get the original record because it is {@link Ext.data.Record#copy copied} within
	 * {@link Zarafa.core.plugins.RecordComponentPlugin#setRecord setRecord} method to start shadow editing.
	 * @param {Ext.Component} field The component which fired the event
	 * @param {Zarafa.core.data.MAPIRecord} record The new record which is being set
	 * @param {Zarafa.core.data.MAPIRecord} oldrecord The old record which was previously set
	 * @private
	 */
	onBeforeSetRecord: function(field, record, oldrecord)
	{

		this.resetReadFlagTimer();

		// Only IPMRecords will be handled by this plugin,
		// all other records will be discarded.
		if (record instanceof Zarafa.core.data.IPMRecord) {
			this.record = record;

			var store = this.record.getStore();

			if(Ext.isDefined(store)) {
				this.field.mon(store, 'load', this.onStoreLoad, this);
				this.field.mon(store, 'remove', this.onStoreRemove, this);
			}

		} else {
			this.record = undefined;
		}
	},

	/**
	 * Called when {@link Zarafa.mail.ui.MailGrid#store store} is loading new data.
	 * This will {@link Zarafa.core.plugins.MarkAsReadPlugin#resetReadFlagTimer reset}
	 * the {@link Zarafa.core.plugins.MarkAsReadPlugin#readFlagTimer}.
	 *
	 * @param {Zarafa.core.data.MAPIStore} store The store which being loaded.
	 * @param {Ext.data.Record[]} records The records which have been loaded from the store
	 * @param {Object} options The loading options that were specified (see {@link Ext.data.Store#load load} for details)
	 * @private
	 */
	onStoreLoad: function(store, records, options)
	{
		this.resetReadFlagTimer();
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.mail.ui.MailGrid#store store} fires the
	 * remove event. This will {@link Zarafa.core.plugins.MarkAsReadPlugin#resetReadFlagTimer reset}
	 * the {@link Zarafa.core.plugins.MarkAsReadPlugin#readFlagTimer} if
	 * {@link Zarafa.core.plugins.MarkAsReadPlugin#record record} is removed
	 * from {@link Zarafa.mail.ui.MailGrid#store store}
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The store which fired the event
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} record The record which was deleted
	 * @private
	 */
	onStoreRemove: function(store, record)
	{
		// Check if the removed record is the one which referred by the markAsRead plugin
		if (this.record === record) {
			this.resetReadFlagTimer();
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#beforeloadrecord beforeloadrecord}
	 * event on the {@link #field}. When the record is unread and about to be
	 * opened, this piggybacks a mark_read message action onto the open request
	 * so the server can set the read flag in the same round-trip. This avoids
	 * a separate save request from {@link #onLoadRecord}/{@link #markAsRead}.
	 * @param {Ext.Component} field The component which fired the event
	 * @param {Zarafa.core.data.MAPIRecord} record The (shadow) record about to be loaded
	 * @private
	 */
	onBeforeLoadRecord: function(field, record)
	{
		if (!record || record.phantom || record.isRead() || record.isOpened()) {
			return;
		}

		// If mark_read was already added (e.g. by openMessageContent), skip.
		if (record.getMessageAction('mark_read')) {
			return;
		}

		// Task requests are excluded because they are transformed into
		// task records by openMessageContent.
		if (record.isMessageClass('IPM.TaskRequest', true)) {
			return;
		}

		if (!record.needsReadReceipt()) {
			record.addMessageAction('mark_read', true);
		} else {
			var handling = container.getSettingsModel().get('zarafa/v1/contexts/mail/readreceipt_handling');
			if (handling === 'never') {
				record.addMessageAction('mark_read', true);
				record.addMessageAction('send_read_receipt', false);
			} else if (handling === 'always') {
				record.addMessageAction('mark_read', true);
				record.addMessageAction('send_read_receipt', true);
			}
			// 'ask': don't piggyback, let onLoadRecord handle it so
			// the user gets the read-receipt confirmation dialog.
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#loadrecord loadrecord} event
	 * on the {@link #field}. This will {@link #startReadFlagTimer start} the {@link #readFlagTimer}.
	 * If the record was already marked as read by a piggybacked mark_read action
	 * on the open request, this synchronizes the read flag to the original record
	 * in the list store so that the grid updates without a separate server request.
	 * @param {Ext.Component} field The component which fired the event
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was updated
	 * @private
	 */
	onLoadRecord: function(field, record)
	{
		if (record && !record.phantom && !record.isRead()) {
			// decide based on flag if we want to instantly mark as read or start the timer
			if (this.ignoreReadFlagTimer) {
				this.markAsRead();
			} else {
				this.startReadFlagTimer();
			}
		} else if (record && record.isRead() && this.record &&
			Ext.isFunction(this.record.isRead) && !this.record.isRead()) {
			// The server already marked the message as read (via
			// piggybacked mark_read on the open request).  Sync the
			// read flag to the original record so the list grid
			// reflects the new state without a separate save request.
			var flags = this.record.get('message_flags') | Zarafa.core.mapi.MessageFlags.MSGFLAG_READ;
			this.record.data['message_flags'] = flags;
			if (this.record.store) {
				this.record.store.fireEvent('update', this.record.store, this.record, Ext.data.Record.COMMIT);
			}
		}
	},

	/**
	 * Start the {@link #readFlagTimer} if it was not yet fired already.
	 * This will check the settings for the desired timeout, and delay the call
	 * to {@link #markAsRead} as configured.
	 * @private
	 */
	startReadFlagTimer: function()
	{
		if (!this.readFlagTimer) {
			var timeout = container.getSettingsModel().get('zarafa/v1/contexts/mail/readflag_time') * 1000;
			this.readFlagTimer = this.markAsRead.defer(timeout, this);
		}
	},

	/**
	 * Stop the {@link #readFlagTimer} if it is still pending.
	 * This will clear the timeout and delete the {@link #readFlagTimer} making it
	 * available again for rescheduling.
	 * @private
	 */
	resetReadFlagTimer: function()
	{
		if (this.readFlagTimer) {
			window.clearTimeout(this.readFlagTimer);
			delete this.readFlagTimer;
		}
	},

	/**
	 * Event handler for the {@link #readFlagTimer}, this will mark the {@link #record}
	 * as {@link Zarafa.common.Actions.markAsRead read}.
	 * @private
	 */
	markAsRead: function()
	{
		if (this.record && !Ext.isEmpty(this.record.getStore())) {
			Zarafa.common.Actions.markAsRead(this.record);
		}
		delete this.readFlagTimer;
	},

	/**
	 * Event handler for the {@link Ext.Container#destroy destroy} event.
	 * This will {@link #resetReadFlagTimer cancel} the {@link #readFlagTimer} to
	 * prevent the record from being marked as read.
	 * @private
	 */
	onDestroy: function()
	{
		this.resetReadFlagTimer();
		this.record = undefined;
	}
});

Ext.preg('zarafa.markasreadplugin', Zarafa.core.plugins.MarkAsReadPlugin);
