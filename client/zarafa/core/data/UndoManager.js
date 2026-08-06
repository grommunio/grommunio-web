Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.UndoManager
 * @extends Ext.util.Observable
 *
 * The UndoManager keeps a session-wide history of undoable user actions
 * (deleting, moving and copying messages, changing flags or read state,
 * moving/resizing appointments, creating items) and can revert or re-apply
 * them, similar to the undo/redo feature in Outlook.
 *
 * Actions are captured centrally by listening to the
 * {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr} save events. Because every
 * mutation in grommunio-web is an immediate server round-trip, undo is always
 * performed as a compensating server operation (e.g. moving a deleted item
 * back out of the wastebasket), never as a local rollback.
 *
 * Since moving a message gives it a new entryid, captured move/delete/copy
 * operations ask the server to report the new entryids by attaching the
 * 'track_new_entryids' message action. The server responds with an 'undo'
 * object in the success feedback, which is placed on the record as
 * 'undoResponse' by the {@link Zarafa.core.data.ProxyResponseHandler}.
 *
 * Operations with side effects that cannot be reverted (anything that sends
 * an email, like meeting requests, cancellations or responses, as well as
 * soft deletes and recurrence exception changes) are never recorded.
 */
Zarafa.core.data.UndoManager = Ext.extend(Ext.util.Observable, {
	/**
	 * @cfg {Number} maxEntries The maximum number of actions kept in the
	 * undo history. When the limit is exceeded the oldest entry is dropped.
	 */
	maxEntries: 20,

	/**
	 * @cfg {Number} pendingTimeout Number of milliseconds after which a
	 * captured-but-unconfirmed operation is discarded (e.g. when the server
	 * never responded to the request).
	 */
	pendingTimeout: 60000,

	/**
	 * The stack of commands which can be undone. The last element is the
	 * most recent action.
	 * @property
	 * @type Array
	 */
	undoStack: undefined,

	/**
	 * The stack of commands which can be redone. The last element is the
	 * most recently undone action.
	 * @property
	 * @type Array
	 */
	redoStack: undefined,

	/**
	 * List of pending capture items: operations which have been sent to the
	 * server but for which no confirmation has been received yet. Only when
	 * the server confirms the operation is a command pushed onto the
	 * {@link #undoStack}.
	 * @property
	 * @type Array
	 * @private
	 */
	pendingItems: undefined,

	/**
	 * True while an undo or redo operation is being executed. Used to
	 * prevent re-entrant execution and to let the UI disable its buttons.
	 * @property
	 * @type Boolean
	 */
	executing: false,

	/**
	 * Message action types which imply that an email will be sent by the
	 * server while handling the operation. Such operations can never be
	 * undone and are not recorded.
	 * @property
	 * @type Array
	 * @private
	 */
	emailActionTypes: [
		'cancelInvitation', 'declineMeeting', 'declineMeetingRequest',
		'acceptMeetingRequest', 'forwardMeetingRequest',
		'acceptTaskRequest', 'declineTaskRequest',
		'reply', 'replyall', 'forward', 'snooze', 'dismiss'
	],

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};
		Ext.apply(this, config);

		this.undoStack = [];
		this.redoStack = [];
		this.pendingItems = [];
		// Items confirmed by the server but not yet turned into commands.
		// They are buffered so that all per-record write events of a single
		// gesture (the ShadowStore saves each record separately) are
		// collapsed into one undo entry, see {@link #flushConfirmed}.
		this.confirmedBuffer = [];
		// Commands whose server confirmation arrived while an undo/redo run
		// was executing; pushed onto the history once the run finishes.
		this.deferredPushes = [];
		this.gestureId = 0;

		this.addEvents(
			/**
			 * @event stackchange
			 * Fired whenever the undo or redo stack changes, or when an
			 * undo/redo operation starts or finishes executing.
			 * @param {Zarafa.core.data.UndoManager} undoManager This undo manager
			 */
			'stackchange'
		);

		Zarafa.core.data.UndoManager.superclass.constructor.call(this, config);

		Zarafa.core.data.IPMStoreMgr.on('beforerecordsave', this.onBeforeRecordSave, this);
		Zarafa.core.data.IPMStoreMgr.on('afterrecordwrite', this.onAfterRecordWrite, this);
		Zarafa.core.data.IPMStoreMgr.on('storeexception', this.onStoreException, this);
	},

	/*
	 * ---------------------------------------------------------------------
	 * Stack management
	 * ---------------------------------------------------------------------
	 */

	/**
	 * @return {Boolean} True when there is at least one action which can be undone.
	 */
	canUndo: function()
	{
		return !this.executing && this.undoStack.length > 0;
	},

	/**
	 * @return {Boolean} True when there is at least one action which can be redone.
	 */
	canRedo: function()
	{
		return !this.executing && this.redoStack.length > 0;
	},

	/**
	 * @return {Zarafa.core.data.UndoCommand} The command which will be undone
	 * by the next call to {@link #undo}, or undefined.
	 */
	peekUndo: function()
	{
		return this.undoStack[this.undoStack.length - 1];
	},

	/**
	 * @return {Zarafa.core.data.UndoCommand} The command which will be redone
	 * by the next call to {@link #redo}, or undefined.
	 */
	peekRedo: function()
	{
		return this.redoStack[this.redoStack.length - 1];
	},

	/**
	 * @return {Array} The undoable commands, most recent first.
	 */
	getUndoCommands: function()
	{
		return this.undoStack.slice().reverse();
	},

	/**
	 * Add a new command to the undo history. This clears the redo stack.
	 * When an undo/redo run is currently executing, the command is buffered
	 * and only added once the run finishes, so a server confirmation arriving
	 * mid-run cannot corrupt the stacks the run operates on.
	 * @param {Zarafa.core.data.UndoCommand} command The command to record
	 */
	push: function(command)
	{
		if (this.executing) {
			this.deferredPushes.push(command);
			return;
		}
		this.doPush(command);
	},

	/**
	 * Actually add a command to the undo history and clear the redo stack.
	 * @param {Zarafa.core.data.UndoCommand} command The command to record
	 * @private
	 */
	doPush: function(command)
	{
		this.undoStack.push(command);
		if (this.undoStack.length > this.maxEntries) {
			this.undoStack.shift();
		}
		this.redoStack = [];
		this.fireEvent('stackchange', this);
	},

	/**
	 * Undo the given number of most recent actions (default 1).
	 * The commands are executed sequentially.
	 * @param {Number} count (optional) The number of actions to undo
	 */
	undo: function(count)
	{
		this.execute('undo', count || 1);
	},

	/**
	 * Redo the given number of most recently undone actions (default 1).
	 * @param {Number} count (optional) The number of actions to redo
	 */
	redo: function(count)
	{
		this.execute('redo', count || 1);
	},

	/**
	 * Execute a number of commands from the undo or redo stack sequentially.
	 * Commands which executed successfully move to the opposite stack,
	 * commands which failed are dropped entirely and an error notification
	 * is shown.
	 * @param {String} mode Either 'undo' or 'redo'
	 * @param {Number} count The number of commands to execute
	 * @private
	 */
	execute: function(mode, count)
	{
		if (this.executing) {
			return;
		}

		var fromStack = mode === 'undo' ? this.undoStack : this.redoStack;
		if (fromStack.length === 0) {
			return;
		}

		this.executing = true;
		this.fireEvent('stackchange', this);
		this.executeNext(mode, Math.min(count, fromStack.length));
	},

	/**
	 * Execute the next command of a (multi-)undo/redo run, and schedule the
	 * remainder for when the command completes.
	 * @param {String} mode Either 'undo' or 'redo'
	 * @param {Number} remaining The number of commands still to execute
	 * @private
	 */
	executeNext: function(mode, remaining)
	{
		var fromStack = mode === 'undo' ? this.undoStack : this.redoStack;
		var toStack = mode === 'undo' ? this.redoStack : this.undoStack;

		if (remaining === 0 || fromStack.length === 0) {
			this.executing = false;
			// Apply any commands whose confirmation arrived during the run.
			if (this.deferredPushes.length > 0) {
				var deferred = this.deferredPushes;
				this.deferredPushes = [];
				Ext.each(deferred, this.doPush, this);
			}
			this.fireEvent('stackchange', this);
			return;
		}

		var command = fromStack.pop();

		command.execute(mode, function(success) {
			if (success && command.isViable()) {
				toStack.push(command);
			} else if (!success) {
				this.notifyFailure(mode, command);
			}
			this.executeNext(mode, remaining - 1);
		}.createDelegate(this));
	},

	/**
	 * Show an error notification for a command which could not be
	 * undone/redone (usually because the items were changed or removed
	 * from another client in the meantime).
	 * @param {String} mode Either 'undo' or 'redo'
	 * @param {Zarafa.core.data.UndoCommand} command The command which failed
	 * @private
	 */
	notifyFailure: function(mode, command)
	{
		var msg = mode === 'undo' ?
			_('Could not undo {0}. The item may have been moved, changed or removed in the meantime.') :
			_('Could not redo {0}. The item may have been moved, changed or removed in the meantime.');
		// The description embeds user-controlled text (e.g. a message
		// subject), and the 'error' notifier (ToastPlugin) renders the
		// message as HTML, so it must be encoded to avoid script injection.
		container.getNotifier().notify('error',
			mode === 'undo' ? _('Undo failed') : _('Redo failed'),
			String.format(msg, Ext.util.Format.htmlEncode(command.description)));
	},

	/*
	 * ---------------------------------------------------------------------
	 * Capturing operations
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Event handler for the {@link Zarafa.core.data.IPMStoreMgr#beforerecordsave}
	 * event. Inspects the records which are about to be saved and captures
	 * all undoable operations among them. For operations which will change
	 * the entryid of the items (delete/move/copy), the 'track_new_entryids'
	 * message action is attached so the server reports the new location.
	 *
	 * @param {Zarafa.core.data.IPMStore} store The store which is being saved
	 * @param {Object} data The object describing the pending create/update/destroy records
	 * @private
	 */
	onBeforeRecordSave: function(store, data)
	{
		if (this.executing) {
			return;
		}

		this.sweepPending();

		if (!Ext.isEmpty(data.destroy)) {
			this.captureDestroy(this.toArray(data.destroy));
		}
		if (!Ext.isEmpty(data.update)) {
			this.captureUpdate(this.toArray(data.update));
		}
		if (!Ext.isEmpty(data.create)) {
			this.captureCreate(this.toArray(data.create));
		}
	},

	/**
	 * Capture records which are about to be deleted. Only normal deletions
	 * (which move the items into the wastebasket) are undoable.
	 * @param {Zarafa.core.data.IPMRecord[]} records The records being deleted
	 * @private
	 */
	captureDestroy: function(records)
	{
		var items = [];
		var gesture = { id: ++this.gestureId, kind: 'delete' };

		Ext.each(records, function(record) {
			if (!this.isEligible(record) || record.phantom) {
				return;
			}
			var actions = record.getMessageActions() || {};
			// A delete gesture must not carry an action_type at all,
			// and soft deletes cannot be undone.
			if (actions.soft_delete === true || !Ext.isEmpty(actions.action_type)) {
				return;
			}

			record.addMessageAction('track_new_entryids', true);
			items.push(this.createPendingItem(record, 'delete', gesture, 'destroy'));
		}, this);

		this.registerPending(items);
	},

	/**
	 * Capture records which are about to be updated. This covers both
	 * move/copy operations (via the 'action_type' message action) and plain
	 * property changes such as flag or read-state changes and appointment
	 * drag/resize operations.
	 * @param {Zarafa.core.data.IPMRecord[]} records The records being updated
	 * @private
	 */
	captureUpdate: function(records)
	{
		var moveGesture = { id: ++this.gestureId, kind: 'move' };
		var copyGesture = { id: ++this.gestureId, kind: 'copy' };
		var propsGesture = { id: ++this.gestureId, kind: 'props' };
		var items = [];

		Ext.each(records, function(record) {
			if (!this.isEligible(record) || record.phantom) {
				return;
			}

			var actions = record.getMessageActions() || {};
			var actionType = actions.action_type;

			if (actionType === 'move' || actionType === 'copy') {
				if (Ext.isEmpty(actions.destination_parent_entryid) ||
				    Ext.isEmpty(actions.destination_store_entryid)) {
					return;
				}
				record.addMessageAction('track_new_entryids', true);
				var item = this.createPendingItem(record,
					actionType, actionType === 'move' ? moveGesture : copyGesture, 'update');
				item.dest = {
					parent_entryid: actions.destination_parent_entryid,
					store_entryid: actions.destination_store_entryid
				};
				items.push(item);
			} else if (Ext.isEmpty(actionType)) {
				// Plain property change: snapshot the original values of
				// all modified fields so they can be restored.
				var modified = record.modified;
				if (Ext.isEmpty(modified) || Object.keys(modified).length === 0) {
					return;
				}
				var item = this.createPendingItem(record, 'props', propsGesture, 'update');
				item.oldValues = {};
				item.newValues = {};
				Ext.iterate(modified, function(key) {
					item.oldValues[key] = this.cloneValue(modified[key]);
					item.newValues[key] = this.cloneValue(record.get(key));
				}, this);
				items.push(item);
			}
		}, this);

		this.registerPending(items);
	},

	/**
	 * Capture records which are about to be created. Only appointment
	 * creations are recorded (e.g. quick-create by dragging a timeslot in
	 * the calendar); creating other items (like drafts, which are saved
	 * repeatedly while composing) would flood the history.
	 * @param {Zarafa.core.data.IPMRecord[]} records The records being created
	 * @private
	 */
	captureCreate: function(records)
	{
		var gesture = { id: ++this.gestureId, kind: 'create' };
		var items = [];

		Ext.each(records, function(record) {
			if (!this.isEligible(record)) {
				return;
			}
			if (!Zarafa.core.MessageClass.isClass(record.get('message_class'), 'IPM.Appointment', true)) {
				return;
			}
			items.push(this.createPendingItem(record, 'create', gesture, 'create'));
		}, this);

		this.registerPending(items);
	},

	/**
	 * Explicitly capture a property-change gesture for records which are
	 * saved through the {@link Zarafa.core.data.ShadowStore ShadowStore}
	 * (whose saves are not announced through the IPMStoreMgr). Must be
	 * called after the property changes have been applied to the records,
	 * but before they are saved.
	 * @param {Zarafa.core.data.IPMRecord|Array} records The records to capture
	 */
	capturePropertyGesture: function(records)
	{
		if (this.executing) {
			return;
		}
		this.sweepPending();
		this.captureUpdate(this.toArray(records));
	},

	/**
	 * Explicitly capture a create gesture for a record which is saved
	 * through the {@link Zarafa.core.data.ShadowStore ShadowStore}.
	 * Must be called before the record is saved.
	 * @param {Zarafa.core.data.IPMRecord|Array} records The records to capture
	 */
	captureCreateGesture: function(records)
	{
		if (this.executing) {
			return;
		}
		this.sweepPending();
		this.captureCreate(this.toArray(records));
	},

	/**
	 * Check whether the given record may enter the undo history at all.
	 * Records whose pending save will make the server send an email
	 * (meeting requests/responses/cancellations, task requests, ...) and
	 * recurrence occurrences (which are stored as exceptions inside the
	 * series) are never undoable.
	 * @param {Zarafa.core.data.IPMRecord} record The record to check
	 * @return {Boolean} True when the record is eligible for undo
	 * @private
	 */
	isEligible: function(record)
	{
		if (!record || !(record instanceof Zarafa.core.data.IPMRecord)) {
			return false;
		}

		// Never capture the same record twice for one server round-trip
		// (e.g. when a dialog captured it explicitly and the store save is
		// announced through the IPMStoreMgr as well).
		if (this.pendingItems.some(function(item) { return item.record === record; })) {
			return false;
		}

		var actions = Ext.isFunction(record.getMessageActions) ? (record.getMessageActions() || {}) : {};
		if (actions.send === true) {
			return false;
		}
		if (!Ext.isEmpty(actions.action_type) && this.emailActionTypes.indexOf(actions.action_type) >= 0) {
			return false;
		}

		// Occurrences of a recurring series are saved as exceptions inside
		// the series; those cannot be undone as standalone items.
		if (!Ext.isEmpty(record.get('basedate'))) {
			return false;
		}

		return true;
	},

	/**
	 * Create a pending capture item for the given record.
	 * @param {Zarafa.core.data.IPMRecord} record The record being captured
	 * @param {String} kind The operation kind ('delete', 'move', 'copy', 'create', 'props')
	 * @param {Object} gesture The gesture this item belongs to
	 * @param {String} writeAction The store write action which confirms this
	 * item ('destroy', 'update' or 'create')
	 * @return {Object} the pending item
	 * @private
	 */
	createPendingItem: function(record, kind, gesture, writeAction)
	{
		return {
			record: record,
			kind: kind,
			gesture: gesture,
			writeAction: writeAction,
			expires: Date.now() + this.pendingTimeout,
			ids: {
				entryid: record.get('entryid'),
				parent_entryid: record.get('parent_entryid'),
				store_entryid: record.get('store_entryid'),
				message_class: record.get('message_class'),
				object_type: record.get('object_type')
			},
			subject: record.get('subject')
		};
	},

	/**
	 * Add pending capture items to the list of items awaiting server
	 * confirmation.
	 * @param {Array} items The pending items
	 * @private
	 */
	registerPending: function(items)
	{
		if (!Ext.isEmpty(items)) {
			this.pendingItems = this.pendingItems.concat(items);
		}
	},

	/**
	 * Discard pending capture items whose confirmation never arrived.
	 * @private
	 */
	sweepPending: function()
	{
		if (this.pendingItems.length === 0) {
			return;
		}
		var now = Date.now();
		this.pendingItems = this.pendingItems.filter(function(item) {
			return item.expires > now;
		});
	},

	/*
	 * ---------------------------------------------------------------------
	 * Confirming operations
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Event handler for the {@link Zarafa.core.data.IPMStoreMgr#afterrecordwrite}
	 * event. Fired when the server has successfully processed a create,
	 * update or destroy request. Matches the written records against the
	 * pending capture items and converts confirmed gestures into commands
	 * on the undo stack.
	 *
	 * @param {Zarafa.core.data.IPMStore} store The store which was written
	 * @param {String} action The write action ('create', 'update', 'destroy', 'open')
	 * @param {Object} result The data picked out of the response
	 * @param {Object} res The response object
	 * @param {Zarafa.core.data.IPMRecord[]} records The records which were written
	 * @private
	 */
	onAfterRecordWrite: function(store, action, result, res, records)
	{
		if (this.pendingItems.length === 0) {
			return;
		}

		records = this.toArray(records);

		this.pendingItems = this.pendingItems.filter(function(item) {
			if (item.writeAction === action && records.indexOf(item.record) >= 0) {
				this.confirmedBuffer.push(item);
				return false;
			}
			return true;
		}, this);

		// Commands are not built here directly: a gesture that saves several
		// records through the ShadowStore (batch:false) produces one write
		// event per record. Buffer the confirmed items and build the commands
		// once the current response has been fully processed, so all records
		// of a gesture end up in a single undo entry.
		if (this.confirmedBuffer.length > 0) {
			this.scheduleFlush();
		}
	},

	/**
	 * Schedule a (single) deferred {@link #flushConfirmed} pass. All
	 * synchronous write events of one server response are collected before
	 * the pass runs.
	 * @private
	 */
	scheduleFlush: function()
	{
		if (!this.flushTask) {
			this.flushTask = new Ext.util.DelayedTask(this.flushConfirmed, this);
		}
		this.flushTask.delay(0);
	},

	/**
	 * Turn the buffered, server-confirmed items into commands on the undo
	 * stack, grouping them by gesture so one user action becomes one entry.
	 * @private
	 */
	flushConfirmed: function()
	{
		var confirmed = this.confirmedBuffer;
		this.confirmedBuffer = [];
		if (confirmed.length === 0) {
			return;
		}

		// Group the confirmed items by gesture (preserving the order in
		// which the gestures were first seen), so that one user action
		// (e.g. deleting five messages) becomes one undo entry.
		var gestures = {};
		var order = [];
		Ext.each(confirmed, function(item) {
			var key = item.gesture.id;
			if (!gestures[key]) {
				gestures[key] = { gesture: item.gesture, items: [] };
				order.push(key);
			}
			gestures[key].items.push(item);
		});

		Ext.each(order, function(key) {
			var group = gestures[key];
			var command = this.buildCommand(group.gesture, group.items);
			if (command) {
				this.push(command);
			}
		}, this);
	},

	/**
	 * Event handler for the {@link Zarafa.core.data.IPMStoreMgr#storeexception}
	 * event. Discards pending capture items belonging to failed requests so a
	 * failed operation neither leaves a bogus entry nor blocks a later gesture
	 * on the same record (see {@link #isEligible}).
	 * @param {Zarafa.core.data.IPMStore} store The store on which the exception occurred
	 * @param {Ext.data.DataProxy} proxy The proxy from where the exception originated
	 * @param {String} type The exception type ('response' or 'remote')
	 * @param {String} action The action name
	 * @param {Object} options The request options
	 * @param {Object} response The response object
	 * @param {Object} arg Additional arguments, carrying the failed sendRecords
	 * @private
	 */
	onStoreException: function(store, proxy, type, action, options, response, arg)
	{
		var failed = arg && arg.sendRecords ? this.toArray(arg.sendRecords) : null;
		if (!Ext.isEmpty(failed)) {
			this.pendingItems = this.pendingItems.filter(function(item) {
				return failed.indexOf(item.record) < 0;
			});
		}
		// Clean up any remaining leftovers past their expiry as a fallback
		// (e.g. an exception which did not report the affected records).
		this.sweepPending();
	},

	/**
	 * Convert a confirmed gesture into an undoable command.
	 * @param {Object} gesture The gesture description
	 * @param {Array} items The confirmed pending items of this gesture
	 * @return {Zarafa.core.data.UndoCommand} the command, or false when none
	 * of the items could be tracked
	 * @private
	 */
	buildCommand: function(gesture, items)
	{
		switch (gesture.kind) {
			case 'delete':
			case 'move':
			case 'copy':
				return this.buildLocationCommand(gesture, items);
			case 'create':
				return this.buildCreateCommand(gesture, items);
			case 'props':
				return this.buildPropsCommand(gesture, items);
		}
		return false;
	},

	/**
	 * Build a {@link Zarafa.core.data.UndoLocationCommand} for a confirmed
	 * delete, move or copy gesture. Items for which the server could not
	 * report the new entryid are silently omitted.
	 * @param {Object} gesture The gesture description
	 * @param {Array} items The confirmed pending items
	 * @return {Zarafa.core.data.UndoLocationCommand} the command or false
	 * @private
	 */
	buildLocationCommand: function(gesture, items)
	{
		var commandItems = [];

		Ext.each(items, function(item) {
			var response = item.record.undoResponse;
			delete item.record.undoResponse;

			if (!response || !response.new_entryids) {
				return;
			}
			var newEntryid = response.new_entryids[item.ids.entryid];
			if (Ext.isEmpty(newEntryid)) {
				return;
			}

			var current = {
				entryid: newEntryid,
				parent_entryid: response.destination_parent_entryid,
				store_entryid: response.destination_store_entryid,
				message_class: item.ids.message_class,
				object_type: item.ids.object_type
			};

			var undoLoc, redoLoc;
			if (gesture.kind === 'copy') {
				// Undoing a copy moves the new copy into the wastebasket.
				var wastebasket = container.getHierarchyStore().getDefaultFolder('wastebasket');
				if (!wastebasket) {
					return;
				}
				undoLoc = {
					parent_entryid: wastebasket.get('entryid'),
					store_entryid: wastebasket.get('store_entryid')
				};
			} else {
				undoLoc = {
					parent_entryid: item.ids.parent_entryid,
					store_entryid: item.ids.store_entryid
				};
			}
			redoLoc = {
				parent_entryid: response.destination_parent_entryid,
				store_entryid: response.destination_store_entryid
			};

			commandItems.push({
				ids: current,
				undoLoc: undoLoc,
				redoLoc: redoLoc,
				subject: item.subject
			});
		}, this);

		if (commandItems.length === 0) {
			return false;
		}

		return new Zarafa.core.data.UndoLocationCommand({
			description: this.describeGesture(gesture.kind, commandItems),
			items: commandItems
		});
	},

	/**
	 * Build a {@link Zarafa.core.data.UndoLocationCommand} for a confirmed
	 * create gesture: undoing a creation moves the new item into the
	 * wastebasket, redoing it moves it back.
	 * @param {Object} gesture The gesture description
	 * @param {Array} items The confirmed pending items
	 * @return {Zarafa.core.data.UndoLocationCommand} the command or false
	 * @private
	 */
	buildCreateCommand: function(gesture, items)
	{
		var wastebasket = container.getHierarchyStore().getDefaultFolder('wastebasket');
		if (!wastebasket) {
			return false;
		}

		var commandItems = [];

		Ext.each(items, function(item) {
			// After a successful create the record has been realized and
			// carries its server-assigned entryid.
			var record = item.record;
			var entryid = record.get('entryid');
			if (Ext.isEmpty(entryid)) {
				return;
			}

			commandItems.push({
				ids: {
					entryid: entryid,
					parent_entryid: record.get('parent_entryid'),
					store_entryid: record.get('store_entryid'),
					message_class: record.get('message_class'),
					object_type: record.get('object_type')
				},
				undoLoc: {
					parent_entryid: wastebasket.get('entryid'),
					store_entryid: wastebasket.get('store_entryid')
				},
				redoLoc: {
					parent_entryid: record.get('parent_entryid'),
					store_entryid: record.get('store_entryid')
				},
				subject: record.get('subject')
			});
		}, this);

		if (commandItems.length === 0) {
			return false;
		}

		return new Zarafa.core.data.UndoLocationCommand({
			description: this.describeGesture('create', commandItems),
			items: commandItems
		});
	},

	/**
	 * Build a {@link Zarafa.core.data.UndoPropsCommand} for a confirmed
	 * property-change gesture.
	 * @param {Object} gesture The gesture description
	 * @param {Array} items The confirmed pending items
	 * @return {Zarafa.core.data.UndoPropsCommand} the command or false
	 * @private
	 */
	buildPropsCommand: function(gesture, items)
	{
		var commandItems = [];

		Ext.each(items, function(item) {
			delete item.record.undoResponse;
			commandItems.push({
				ids: item.ids,
				oldValues: item.oldValues,
				newValues: item.newValues,
				subject: item.subject
			});
		});

		if (commandItems.length === 0) {
			return false;
		}

		return new Zarafa.core.data.UndoPropsCommand({
			description: this.describePropsGesture(commandItems),
			items: commandItems
		});
	},

	/*
	 * ---------------------------------------------------------------------
	 * Descriptions
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Produce a human-readable description for a location gesture, e.g.
	 * 'Delete "Weekly report"' or 'Move 3 items to "Archive"'.
	 * @param {String} kind The gesture kind ('delete', 'move', 'copy', 'create')
	 * @param {Array} items The command items
	 * @return {String} the description
	 * @private
	 */
	describeGesture: function(kind, items)
	{
		var count = items.length;
		var subject = this.formatSubject(items[0].subject);

		switch (kind) {
			case 'delete':
				return count === 1 ?
					String.format(_('Delete {0}'), subject) :
					String.format(_('Delete {0} items'), count);
			case 'move': {
				var folder = this.formatFolder(items[0].redoLoc.parent_entryid);
				return count === 1 ?
					String.format(_('Move {0} to {1}'), subject, folder) :
					String.format(_('Move {0} items to {1}'), count, folder);
			}
			case 'copy': {
				var folder = this.formatFolder(items[0].redoLoc.parent_entryid);
				return count === 1 ?
					String.format(_('Copy {0} to {1}'), subject, folder) :
					String.format(_('Copy {0} items to {1}'), count, folder);
			}
			case 'create':
				return String.format(_('Create {0}'), subject);
		}
		return _('Action');
	},

	/**
	 * Produce a human-readable description for a property-change gesture by
	 * classifying the set of changed properties, e.g. 'Mark as read',
	 * 'Change flag' or 'Change appointment time'.
	 * @param {Array} items The command items
	 * @return {String} the description
	 * @private
	 */
	describePropsGesture: function(items)
	{
		var count = items.length;
		var subject = this.formatSubject(items[0].subject);
		var keys = {};
		Ext.each(items, function(item) {
			Ext.iterate(item.newValues, function(key) {
				keys[key] = true;
			});
		});
		var keyList = Object.keys(keys);

		var what;
		if (keyList.length === 1 && keyList[0] === 'message_flags') {
			var wasRead = (items[0].oldValues.message_flags & Zarafa.core.mapi.MessageFlags.MSGFLAG_READ) > 0;
			what = wasRead ? _('Mark as unread') : _('Mark as read');
			return count === 1 ?
				String.format(_('{0}: {1}'), what, subject) :
				String.format(_('{0}: {1} items'), what, count);
		}

		var isFlagChange = keyList.some(function(key) {
			return key.indexOf('flag_') === 0 || key === 'reminder' || key === 'reminder_time';
		});
		var isDateChange = keyList.some(function(key) {
			return key === 'startdate' || key === 'duedate' || key === 'commonstart' || key === 'commonend';
		});
		var isAppointment = Zarafa.core.MessageClass.isClass(items[0].ids.message_class, 'IPM.Appointment', true);

		if (isDateChange && isAppointment) {
			what = _('Change appointment time');
		} else if (isFlagChange && !isAppointment) {
			what = _('Change flag');
		} else if (keyList.indexOf('categories') >= 0) {
			what = _('Change categories');
		} else {
			what = _('Edit');
		}

		return count === 1 ?
			String.format(_('{0}: {1}'), what, subject) :
			String.format(_('{0}: {1} items'), what, count);
	},

	/**
	 * Format an item subject for use in a description, quoted.
	 *
	 * The quotes are added here rather than written into the translated
	 * templates, because _() html-encodes what it returns: a quote put in a
	 * template comes back as &quot; and ends up displayed literally. Keeping
	 * the templates free of characters that encode leaves the description
	 * plain text, which is what its three display sites expect. Same reason
	 * {@link #formatFolder} quotes the folder name itself.
	 *
	 * @param {String} subject The subject
	 * @return {String} the formatted subject, quoted
	 * @private
	 */
	formatSubject: function(subject)
	{
		if (Ext.isEmpty(subject)) {
			return '"' + _('No subject') + '"';
		}
		return '"' + Ext.util.Format.ellipsis(subject, 40) + '"';
	},

	/**
	 * Format a folder name for use in a description.
	 * @param {String} entryid The folder entryid
	 * @return {String} the folder display name, quoted
	 * @private
	 */
	formatFolder: function(entryid)
	{
		var folder = container.getHierarchyStore().getFolder(entryid);
		if (folder) {
			return '"' + folder.get('display_name') + '"';
		}
		return _('another folder');
	},

	/*
	 * ---------------------------------------------------------------------
	 * Utilities
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Normalize the given value to an array.
	 * @param {Mixed} value The value
	 * @return {Array} the value as array
	 * @private
	 */
	toArray: function(value)
	{
		return Array.isArray(value) ? value : [ value ];
	},

	/**
	 * Clone a property value for the undo snapshot. Dates are the only
	 * mutable value type stored in record fields.
	 * @param {Mixed} value The value to clone
	 * @return {Mixed} the cloned value
	 * @private
	 */
	cloneValue: function(value)
	{
		if (Ext.isDate(value)) {
			return new Date(value.getTime());
		}
		return value;
	}
});

/**
 * @class Zarafa.core.data.UndoCommand
 * @extends Object
 *
 * Base class for entries in the {@link Zarafa.core.data.UndoManager} history.
 * A command knows how to revert ('undo') and re-apply ('redo') one user
 * gesture by issuing compensating server operations through the
 * {@link Zarafa.core.data.ShadowStore ShadowStore}.
 */
Zarafa.core.data.UndoCommand = Ext.extend(Object, {
	/**
	 * @cfg {String} description Human-readable description of the recorded
	 * action, e.g. 'Delete 3 items'. Shown in the undo button tooltip and
	 * the history dropdown.
	 */
	description: '',

	/**
	 * @cfg {Array} items The items this command operates on.
	 */
	items: undefined,

	/**
	 * @cfg {Number} timeout Number of milliseconds to wait for the server
	 * before considering the execution failed.
	 */
	timeout: 30000,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * @return {Boolean} True when the command still has items to operate on.
	 * Items are dropped when the server can no longer track them.
	 */
	isViable: function()
	{
		return !Ext.isEmpty(this.items);
	},

	/**
	 * Execute the command.
	 * @param {String} mode Either 'undo' or 'redo'
	 * @param {Function} callback Called with a single boolean argument
	 * indicating whether the execution succeeded
	 */
	execute: Ext.emptyFn,

	/**
	 * Create a detached record which represents a server item without being
	 * part of any visible store, to be saved via the ShadowStore.
	 * @param {Object} ids The item identification (entryid, parent_entryid,
	 * store_entryid, message_class, object_type)
	 * @return {Zarafa.core.data.IPMRecord} the record
	 * @protected
	 */
	createDetachedRecord: function(ids)
	{
		var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass(
			ids.message_class || 'IPM.Note', {
				entryid: ids.entryid,
				parent_entryid: ids.parent_entryid,
				store_entryid: ids.store_entryid,
				message_class: ids.message_class,
				object_type: ids.object_type
			}, ids.entryid);

		this.fillRequiredFields(record);

		return record;
	},

	/**
	 * Give a detached record a value for every field its type insists on, so
	 * that it can be saved at all.
	 *
	 * {@link Ext.data.Store#save} drops records which fail
	 * {@link Ext.data.Record#isValid} on the floor: no request, no exception,
	 * nothing. A record is invalid while any field declared allowBlank:false is
	 * empty, and a detached record carries nothing but its ids — an appointment
	 * for instance declares startdate, duedate, commonstart and commonend that
	 * way, so undoing anything on one used to send no request at all and fail on
	 * its own timeout, reporting that the item had been changed in the meantime
	 * when nothing had touched it.
	 *
	 * The values go straight into {@link Ext.data.Record#data} rather than
	 * through set(): they exist to get the record past the check, and must not
	 * become part of what is written. A dirty field is sent as a property, and
	 * ItemModule::copy() applies whatever properties it is given to the item it
	 * moves — a placeholder date reaching that would overwrite the real one.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The detached record
	 * @private
	 */
	fillRequiredFields: function(record)
	{
		record.fields.each(function(field) {
			if (field.allowBlank === false && Ext.isEmpty(record.data[field.name])) {
				record.data[field.name] = this.placeholderFor(field);
			}
		}, this);
	},

	/**
	 * A non-empty value of the right shape for the given field, used only to
	 * satisfy {@link Ext.data.Record#isValid}. See {@link #fillRequiredFields}.
	 * @param {Ext.data.Field} field The field
	 * @return {Mixed} the placeholder
	 * @private
	 */
	placeholderFor: function(field)
	{
		// Ext resolves a field's type to one of Ext.data.Types, each carrying
		// its name in a 'type' property.
		var type = field.type ? field.type.type : 'auto';

		switch (type) {
			case 'date':
				return new Date(0);
			case 'int':
			case 'float':
				return 0;
			case 'bool':
				return false;
			default:
				// Ext.isEmpty() counts '' as empty, so a space is the smallest
				// value which passes.
				return ' ';
		}
	},

	/**
	 * Save the given detached records through the ShadowStore and invoke the
	 * callback once the server has confirmed (or rejected) the operation.
	 * @param {Array} entries Array of {record, item} pairs
	 * @param {Function} onWritten Called with (entries, success); for
	 * successful writes each entry's record may carry an 'undoResponse'
	 * @protected
	 */
	saveDetachedRecords: function(entries, onWritten)
	{
		var shadowStore = container.getShadowStore();
		var records = [];

		Ext.each(entries, function(entry) {
			shadowStore.add(entry.record);
			// Make sure the record is considered modified, otherwise
			// MAPIStore.save would skip it (message actions attached before
			// the record was added to the store do not register it).
			if (shadowStore.modified.indexOf(entry.record) === -1) {
				shadowStore.modified.push(entry.record);
			}
			records.push(entry.record);
		});

		// The ShadowStore saves each record in its own transaction
		// (batch:false), so a multi-item command produces one write (or
		// exception) event per record. Wait for every record to be accounted
		// for before completing, otherwise the items whose response has not
		// arrived yet would be dropped from the command.
		var pending = records.slice();
		var anySuccess = false;
		var completed = false;
		var timer;

		var cleanup = function() {
			shadowStore.un('write', onWrite, this);
			shadowStore.un('exception', onException, this);
			clearTimeout(timer);
			Ext.each(records, function(record) {
				// Also drop the record from the modified list: the
				// ShadowStore does not prune it on removal, and a later
				// full store save would otherwise re-issue the operation.
				shadowStore.modified.remove(record);
				shadowStore.remove(record, true);
			});
		};

		var finish = function() {
			if (completed) {
				return;
			}
			completed = true;
			cleanup.call(this);
			onWritten(entries, anySuccess);
		};

		var resolve = function(record, success) {
			var idx = pending.indexOf(record);
			if (idx === -1) {
				return;
			}
			pending.splice(idx, 1);
			if (success) {
				anySuccess = true;
			}
			if (pending.length === 0) {
				finish.call(this);
			}
		};

		var onWrite = function(store, action, result, res, writtenRecords) {
			writtenRecords = Array.isArray(writtenRecords) ? writtenRecords : [ writtenRecords ];
			Ext.each(writtenRecords, function(record) {
				resolve.call(this, record, true);
			}, this);
		};

		var onException = function(proxy, type, action, options, response, args) {
			var failedRecords = (args && args.sendRecords) ? args.sendRecords : [];
			if (!Array.isArray(failedRecords)) {
				failedRecords = [ failedRecords ];
			}
			Ext.each(failedRecords, function(record) {
				resolve.call(this, record, false);
			}, this);
		};

		shadowStore.on('write', onWrite, this);
		shadowStore.on('exception', onException, this);

		// Any records still unresolved when the timeout fires are treated as
		// failed; anySuccess still reflects the ones which did complete.
		timer = setTimeout(finish.createDelegate(this), this.timeout);

		shadowStore.save(records);
	}
});

/**
 * @class Zarafa.core.data.UndoLocationCommand
 * @extends Zarafa.core.data.UndoCommand
 *
 * Command which undoes/redoes operations that changed the location of items:
 * deletions (to the wastebasket), moves, copies and creations. Undo and redo
 * are both performed as a move between the two recorded locations. Because a
 * move gives an item a new entryid, every execution asks the server to track
 * the new entryids and updates the recorded item location accordingly.
 */
Zarafa.core.data.UndoLocationCommand = Ext.extend(Zarafa.core.data.UndoCommand, {
	/**
	 * Execute the command by moving all items to the target location of the
	 * given mode.
	 * @param {String} mode Either 'undo' or 'redo'
	 * @param {Function} callback Called with a single boolean success argument
	 */
	execute: function(mode, callback)
	{
		var entries = [];

		Ext.each(this.items, function(item) {
			var target = mode === 'undo' ? item.undoLoc : item.redoLoc;
			var record = this.createDetachedRecord(item.ids);
			record.addMessageAction('action_type', 'move');
			record.addMessageAction('destination_parent_entryid', target.parent_entryid);
			record.addMessageAction('destination_store_entryid', target.store_entryid);
			record.addMessageAction('track_new_entryids', true);
			entries.push({ record: record, item: item, target: target });
		}, this);

		if (entries.length === 0) {
			callback(false);
			return;
		}

		this.saveDetachedRecords(entries, function(entries, success) {
			if (!success) {
				callback(false);
				return;
			}

			// Update the recorded locations with the new entryids the
			// server reported. Items which could not be tracked are
			// dropped from the command.
			var viable = [];
			Ext.each(entries, function(entry) {
				var response = entry.record.undoResponse;
				delete entry.record.undoResponse;
				var newEntryid = response && response.new_entryids ?
					response.new_entryids[entry.item.ids.entryid] : false;

				if (!Ext.isEmpty(newEntryid)) {
					entry.item.ids.entryid = newEntryid;
					entry.item.ids.parent_entryid = entry.target.parent_entryid;
					entry.item.ids.store_entryid = entry.target.store_entryid;
					viable.push(entry.item);
				}
			});
			this.items = viable;
			callback(true);
		}.createDelegate(this));
	}
});

/**
 * @class Zarafa.core.data.UndoPropsCommand
 * @extends Zarafa.core.data.UndoCommand
 *
 * Command which undoes/redoes plain property changes (flags, read state,
 * categories, appointment times, ...) by re-applying the recorded old or new
 * property values to the items.
 */
Zarafa.core.data.UndoPropsCommand = Ext.extend(Zarafa.core.data.UndoCommand, {
	/**
	 * Execute the command by applying the recorded property values.
	 * @param {String} mode Either 'undo' or 'redo'
	 * @param {Function} callback Called with a single boolean success argument
	 */
	execute: function(mode, callback)
	{
		var entries = [];

		Ext.each(this.items, function(item) {
			var values = mode === 'undo' ? item.oldValues : item.newValues;
			var record = this.createDetachedRecord(item.ids);

			record.beginEdit();
			Ext.iterate(values, function(key, value) {
				record.set(key, value);
			});
			record.endEdit();

			entries.push({ record: record, item: item });
		}, this);

		if (entries.length === 0) {
			callback(false);
			return;
		}

		this.saveDetachedRecords(entries, function(entries, success) {
			callback(success);
		});
	}
});
