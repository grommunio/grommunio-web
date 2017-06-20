Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.RecordComponentPlugin
 * @extends Object
 * @ptype zarafa.recordcomponentplugin
 *
 * This plugin is used on a root {@link Ext.Container container} in which multiple children are
 * located which share a {@link Zarafa.core.data.MAPIRecord record} for displaying or editing.
 * This can for example occur in a {@link Ext.Window Dialog} which is used for editing a message,
 * or in the {@link Zarafa.core.ui.PreviewPanel PreviewPanel} for displaying a message.
 *
 * If the {@link #allowWrite} option is enabled, the {@link #record} will be editable, this will be done
 * by copying the {@link #record} into the {@link Zarafa.core.data.ShadowStore ShadowStore}
 * from where it can be saved to the server.
 *
 * The components located in the root {@link Ext.Container container} can use the
 * {@link Zarafa.core.ui.RecordComponentUpdaterPlugin RecordComponentUpdaterPlugin} for handling the notifications
 * from this plugin.
 *
 * When this plugin is being installed, it will set a reference to itself on the {@link #field}
 * with the name 'recordComponentPlugin'.
 */
Zarafa.core.plugins.RecordComponentPlugin = Ext.extend(Object, {
	/**
	 * The contained on which this plugin has been installed.
	 * @property
	 * @type Ext.Container
	 */
	field : undefined,

	/**
	 * @cfg {Boolean} ignoreUpdates True if the {@link #field} should not be listening to changes
	 * made to the {@link #record} from a {@link Zarafa.core.data.MAPIStore Store}. This will force
	 * the {@link #useShadowStore} option to be enabled.
	 */
	ignoreUpdates : false,

	/**
	 * @cfg {Boolean} allowWrite True if the {@link #field} supports
	 * the editing and saving of the {@link #record}.
	 */
	allowWrite : false,

	/**
	 * True when the {@link #field} has been layed out.
	 * @property
	 * @type Boolean
	 */
	isLayoutCalled : false,

	/**
	 * The record which is currently displayed in {@link #field}.
	 * @property
	 * @type Zarafa.core.data.MAPIRecord
	 */
	record : undefined,

	/**
	 * The cheapCopy argument of {@link #setRecord}, this is used when {@link #setRecord} was
	 * called when the panel has not been rendered yet and the call is deferred.
	 * @property
	 * @type Boolean
	 */
	cheapCopy : undefined,

	/**
	 * @cfg {Boolean} useShadowStore True, if the {@link #record} should be pushed into the
	 * shadowStore.
	 */
	useShadowStore : false,

	/**
	 * Indicates if the {@link #record} has been changed by the user since it has been loaded.
	 * If this is changed to true for the first time, the {@link #userupdaterecord} event will be
	 * fired on the {@link #field}.
	 * @property
	 * @type Boolean
	 * @private
	 */
	isChangedByUser : false,

	/**
	 * @cfg {Array} loadTasks An array of objects containing tasks which should be executed
	 * in order to properly load all data into the Component. The object should contain the
	 * 'fn' field which contains the function to be called, this will be called with the following
	 * arguments:
	 *  - container {@link Ext.Container} The container on which this plugin is installed
	 *  - record {@link Zarafa.core.data.MAPIRecord} The record which is being loaded
	 *  - task {@link Object} The task object which was registered
	 *  - callback {@link Function} The callback function which should be called when the task
	 *    has completed its work.
	 * The task should also contain the 'scope' property which refers to the scope in which the
	 * 'fn' should be called. If the task contains the 'defer' property, the call to 'fn' will
	 * be defferred for the given number of milliseconds.
	 */
	loadTasks : undefined,

	/**
	 * @cfg {Boolean} enableOpenLoadTask True to create a {@link #loadTask} which will
	 * {@link Zarafa.core.data.MAPIRecord#open open} the {@link #record} when it is set
	 * on the {@link #field}.
	 */
	enableOpenLoadTask : true,

	/**
	 * @cfg {Number} autoOpenLoadTaskDefer The 'defer' configuration option for the task
	 * which will be put in {@link #loadTasks} when {@link #enableOpenLoadTask} is true.
	 * This can be used to delay the opening of the record.
	 */
	autoOpenLoadTaskDefer : 0,

	/**
	 * List of {@link Ext.util.DelayedTask} instances which will be filled in when
	 * tasks in {@link #loadTasks} was configured with a 'defer' property.
	 * @property
	 * @type Array
	 * @private
	 */
	scheduledTasks : undefined,

	/**
	 * The list of Tasks from {@link #loadTasks} which have been started but are awaiting
	 * the call to the callback function.
	 * @property
	 * @type Array
	 * @private
	 */
	pendingTasks : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		// Apply a default value for the useShadowStore
		// based on the other settings.
		if (!Ext.isDefined(config.useShadowStore)) {
			if (config.allowWrite === true) {
				config.useShadowStore = true;
			}
			if (config.ignoreUpdates === true) {
				config.useShadowStore = true;
			}
		}

		Ext.apply(this, config);
	},

	/**
	 * Initializes the {@link Ext.Component Component} to which this plugin has been hooked.
	 * @param {Ext.Component} The parent field to which this component is connected
	 */
	init : function(field)
	{
		this.field = field;
		field.recordComponentPlugin = this;

		this.field.addEvents(
			/**
			 * @event beforesetrecord
			 *
			 * Fired from {@link #field}
			 *
			 * Fires when a record is about to be added to the {@link #field}
			 * This will allow Subclasses modify the {@link Zarafa.core.data.MAPIRecord record} before
			 * it has been hooked into the {@link #field}.
			 * @param {Ext.Container} panel The panel to which the record was set
			 * @param {Zarafa.core.data.MAPIRecord} record The record which is going to be set
			 * @param {Zarafa.core.data.MAPIRecord} oldrecord The oldrecord which is currently set
			 * @return {Boolean} false if the record should not be set on this panel.
			 */
			'beforesetrecord',
			/**
			 * @event setrecord
			 *
			 * Fired from {@link #field}
			 *
			 * Fires when a record has been added to the {@link #field}.
			 * No event handler may modify any properties inside the provided record (if this
			 * is needed for the Panel initialization, use the {@link #beforesetrecord} event).
			 * @param {Ext.Container} panel The panel to which the record was set
			 * @param {Zarafa.core.data.MAPIRecord} record The record which was set
			 * @param {Zarafa.core.data.MAPIRecord} oldrecord The oldrecord which was previously set
			 */
			'setrecord',
			/**
			 * @event beforeloadrecord
			 *
			 * Fired from {@link #field}
			 *
			 * Fires when a record is going to be {@link Zarafa.core.data.MAPIRecord#isOpened opened},
			 * or if there are registered {@link #loadTasks} to be executed.
			 * No event handler may modify any properties inside the provided record.
			 *
			 * @param {Ext.Container} panel The panel to which the record was set
			 * @param {Zarafa.core.data.MAPIRecord} record The record which was updated
			 * @return {Boolean} false if the record should not be loaded.
			 */
			'beforeloadrecord',
			/**
			 * @event loadrecord
			 *
			 * Fired from {@link #field}
			 *
			 * Fires when a record has been {@link Zarafa.core.data.MAPIRecord#isOpened opened},
			 * and all registered {@link #loadTasks} have been executed.
			 * No event handler may modify any properties inside the provided record.
			 *
			 * @param {Ext.Container} panel The panel to which the record was set
			 * @param {Zarafa.core.data.MAPIRecord} record The record which was updated
			 */
			'loadrecord',
			/**
			 * @event updaterecord
			 *
			 * Fired from {@link #field}
			 *
			 * Fires when the record of this {@link #field} was updated,
			 * through a {@link Zarafa.core.data.MAPIStore store}.
			 * No event handler may modify any properties inside the provided record.
			 * @param {Ext.Container} panel The panel to which the record was set
			 * @param {String} action write Action that ocurred. Can be one of
			 * {@link Ext.data.Record.EDIT EDIT}, {@link Ext.data.Record.REJECT REJECT} or
			 * {@link Ext.data.Record.COMMIT COMMIT}
			 * @param {Zarafa.core.data.MAPIRecord} record The record which was updated
			 */
			'updaterecord',
			/**
			 * @event userupdaterecord
			 *
			 * Fired from {@link #field}
			 *
			 * Fires when the record of this {@link #field} was changed by the user.
			 * This allows the UI to apply special indicators to show the user that
			 * the user might need to save his changes.
			 * @param {Ext.Container} panel The panel to which the record was set
			 * @param {Zarafa.core.data.MAPIRecord} record The record which is dirty
			 */
			'userupdaterecord',
			/**
			 * @event exceptionrecord
			 *
			 * Fired from {@link #field}
			 *
			 * Fires when an exception event was fired by the {@link Ext.data.DataProxy}.
			 * No event handler may modify any properties inside the provided record.
			 * @param {String} type See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
			 * for description.
			 * @param {String} action See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
			 * for description.
			 * @param {Object} options See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
			 * for description.
			 * @param {Object} response See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
			 * for description.
			 * @param {Zarafa.core.data.MAPIRecord} record The record which was subject of the request
			 * that encountered an exception.
			 * @param {String} error (Optional) Passed when a thrown JS Exception or JS Error is
			 * available.
			 */
			'exceptionrecord',
			/**
			 * @event writerecord
			 *
			 * Fired from {@link #field}
			 *
			 * Fires when write event was fired by the {@link Zarafa.core.data.MAPIStore store}.
			 * @param {Ext.data.Store} store
			 * @param {String} action [Ext.data.Api.actions.create|update|destroy]
			 * @param {Object} result The 'data' picked-out out of the response for convenience.
			 * @param {Ext.Direct.Transaction} res
			 * @param {Zarafa.core.data.IPMRecord[]} records Store's records, the subject(s) of the write-action
			 */
			'writerecord'
		);

		// Raise an event after all components have been layout, we can then call this.setRecord
		// to force all components to be aware of the Record which is bound to this component.
		// we can't do that in the constructor because then nobody is listening to the event
		// yet. Neither can we do it after rendering, since that only indicates that this container.
		// has been rendered and not the components.
		this.field.on('afterlayout', this.onAfterFirstLayout, this, {single : true});

		// Add event listener for the 'close' event, if we are editing the record, then the
		// record must be removed from the shadowStore when closing the dialog.
		this.field.on('close', this.onClose, this);
	},

	/**
	 * Start editing on a {@link Zarafa.core.data.MAPIRecord record} by hooking
	 * it into the {@link Zarafa.core.data.ShadowStore ShadowStore} and mark the
	 * {@link Zarafa.core.data.MAPIRecord record} as being edited. This function
	 * should only be called when {@link #useShadowStore} is set to true.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to edit
	 * @private
	 */
	startShadowRecordEdit : function(record)
	{
		if(this.useShadowStore) {
			container.getShadowStore().add(record);
		}
	},

	/**
	 * Stop editing on a {@link Zarafa.core.data.MAPIRecord record} by unhooking it
	 * from the {@link Zarafa.core.data.ShadowStore ShadowStore}. This function
	 * should only be called when {@link #useShadowStore} is set to true.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to finish editing
	 * @private
	 */
	endShadowRecordEdit : function(record)
	{
		if(this.useShadowStore) {
			container.getShadowStore().remove(record, true);
		}
	},

	/**
	 * Check if the given {@link Zarafa.core.data.MAPIRecord record} matches the {@link #record}
	 * which is used inside this container. When we have {@link #allowWrite} support, we only accept updates
	 * when the record is exactly the same as the record inside the container. But when we have
	 * read-only support, we accept updates from all records with the same entryid.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to compare
	 * @return {Boolean} True if the given record matches the record inside this container
	 * @private
	 */
	isRecordInContainer : function(record)
	{
		if (this.allowWrite === true && this.useShadowStore === false) {
			return (this.record && this.record === record);
		} else {
			return (this.record && this.record.equals(record));
		}
	},

	/**
	 * Set the {@link Zarafa.core.data.MAPIRecord record} which must be shown inside the {@link #field}
	 * When the field has not yet {@link #isLayoutCalled layed out}, then the {@link #record} is
	 * set, but all work is deferred to the first {@link #doLayout layout} action on this container.
	 * Otherwise this function will call {@link #beforesetrecord} to check if the record should be
	 * set on this field. Depending on the {@link Zarafa.core.data.MAPIRecord#isOpened opened} status
	 * of the record, it will call to the server to open the record (and wait with displaying the
	 * record until the server has responsed) or display the record directly.
	 * @param {Zarafa.core.data.MAPIRecord} record The record to set
	 * @param {Boolean} cheapCopy true to prevent the record from being copied. This is usually the case
	 * when {@link #allowWrite} is enabled, and the given record is not a phantom.
	 */
	setRecord : function(record, cheapCopy)
	{
		var oldrecord = this.record;

		if (this.record === record) {
			return;
		}

		// Cancel any scheduled tasks which
		// might have been registered for
		// the previous record.
		if (this.scheduledTasks) {
			Ext.each(this.scheduledTasks, function(task) {
				task.cancel();
			});
			this.scheduledTasks = [];
		}

		// Clear all pending tasks for the
		// previous registered record.
		if (this.pendingTasks) {
			this.pendingTasks = [];
		}

		// Layout has not yet been called, cache the record
		// until the onAfterFirstLayout has been called, which will
		// set the record again.
		if (this.isLayoutCalled === false) {
			this.record = record;
			this.cheapCopy = cheapCopy;
			return;
		}

		if (this.field.fireEvent('beforesetrecord', this, record, oldrecord) === false) {
			return;
		}

		// Unhook the old record from the modifications tracking
		if (oldrecord) {
			oldrecord.setUpdateModificationsTracking(false);
			if (this.ignoreUpdates !== true) {
				this.field.mun(oldrecord.getStore(), 'update', this.onUpdateRecord, this);
				this.field.mun(oldrecord.getStore(), 'write', this.onWrite, this);
				this.field.mun(oldrecord.getStore(), 'exception', this.onExceptionRecord, this);
			}
			if (this.useShadowStore === true) {
				this.endShadowRecordEdit(oldrecord);
			}
		}

		// If we are clearing the record, we will take a shortcut, simply fire the
		// 'setrecord' event.
		if (!record) {
			this.record = record;
			this.field.fireEvent('setrecord', this, record, oldrecord);
			return;
		}

		// Check if the record must be move into the ShadowStore. When the record
		// is a phantom we can safely move it, otherwise we need to create a copy.
		// If the cheapCopy argument was provided, then it means we have already
		// received a copy and we can move it without problems.
		if (this.useShadowStore) {
			if (record.phantom !== true && cheapCopy !== true) {
				record = record.copy();
			}
			this.startShadowRecordEdit(record);
		}

		// All preparations have been completed, it is now time to set
		// the Record correctly into the component.
		this.record = record;

		// remove modified from modal dialog record
		if(this.record.isModalDialogRecord) {
			delete this.record.modified;
		}

		this.record.setUpdateModificationsTracking(true);
		this.field.fireEvent('setrecord', this, record, oldrecord);

		// Register the exception event handler, as we want to catch exceptions for
		// opening the record as well.
		if (this.ignoreUpdates !== true) {
			this.field.mon(record.getStore(), 'exception', this.onExceptionRecord, this);
		}

		// If the record is not yet opened, we must open the record now,
		// Add the 'openTaskHandler' to the loadTasks so we can start loading it.
		var tasks = this.loadTasks ? this.loadTasks.clone() : [];
		if (!record.isOpened() && this.enableOpenLoadTask) {
			tasks.push({
				fn : this.openTaskHandler,
				scope : this,
				defer : this.autoOpenLoadTaskDefer
			});
		}

		// Start loading the record.
		this.doLoadRecord(record, tasks);
	},

	/**
	 * Task handler for {@link #loadTasks} in case the {@link #record} needs
	 * to be opened. This will open the record, and wait for the response from
	 * the server.
	 * @param {Ext.Component} component The component which contains the record
	 * @param {Zarafa.core.data.MAPIRecord} record The record to be opened
	 * @param {Object} task The task object
	 * @parma {Function} callback The function to call when the task has been
	 * completed.
	 * @private
	 */
	openTaskHandler : function(component, record, task, callback)
	{
		var fn = function(store, record) {
			if (this.isRecordInContainer(record)) {
				this.field.mun(store, 'open', fn, this);

				if (this.record !== record) {
					this.record.applyData(record);
				}
				callback();
			}
		};
		this.field.mon(record.getStore(), 'open', fn, this);
		record.open();
	},

	/**
	 * Obtain the current {@link #record} which has been sent to all
	 * listeners of the {@link #setrecord} event.
	 *
	 * @return {Zarafa.core.data.MAPIRecord} The record which is currently active
	 */
	getActiveRecord : function()
	{
		// The setrecord event is called during setRecord, but always after
		// isLayoutCalled.
		if (this.isLayoutCalled === true) {
			return this.record;
		}
	},

	/**
	 * Event handler which is triggered after the {@link #field}
	 * is first time layed out. This will reset the current {@link #record}
	 * to trigger the {@link #setrecord} event for the initial Record.
	 *
	 * @param {Ext.Component} component This component
	 * @param {ContainerLayout} layout The layout
	 * @private
	 */
	onAfterFirstLayout : function(component, layout)
	{
		this.isLayoutCalled = true;

		if (this.record) {
			// Force record reload by clearing this.record first.
			var record = this.record;
			this.record =  undefined;
			this.setRecord(record, this.cheapCopy);
		}
	},

	/**
	 * This will check if any {@link #loadTasks tasks} have been registered.
	 * If there are, this will fire the {@link #beforeloadrecord} event, and
	 * starts executing the tasks. When it is done, the {@link #loadrecord} event
	 * is fired.
	 * Finally in all cases, the function {@link #afterLoadRecord} is called
	 * to complete the loading of the record.
	 * @param {Zarafa.core.data.MAPIRecord} record The record to load
	 * @param {Array} Array of Task objects as copied from {@link this.loadTasks}.
	 * @private
	 */
	doLoadRecord : function(record, tasks)
	{
		this.pendingTasks = [];
		this.scheduledTasks = [];

		// Check if we have any loading tasks, if we do, then start executing
		// them and wait for all of them to complete before continuing
		// to afterLoadRecord.
		if (!Ext.isEmpty(tasks)) {
			if (this.field.fireEvent('beforeloadrecord', this.field, record) !== false) {
				Ext.each(tasks, function(task) {
					// Add it to the pendingTasks list, so we can
					// keep track of the pending completion events.
					this.pendingTasks.push(task);

					// Check if the task should be deferred, if so
					// then use a Ext.util.DelayedTask to schedule it.
					if (task.defer && task.defer > 0) {
						var delayTask = new Ext.util.DelayedTask(this.doTask, this, [ record, task ]);

						// Add it to the scheduledTasks, so we can
						// keep track of the tasks (and cancel them
						// if needed).
						this.scheduledTasks.push(delayTask);
						delayTask.delay(task.defer);
					} else {
						this.doTask(record, task);
					}
				}, this);
			}
		} else {
			this.afterLoadRecord(record);
		}

	},

	/**
	 * Execute a task as registerd in the {@link #loadTasks registered tasks}.
	 * @param {Zarafa.core.data.MAPIRecord} record The record to perform the action on
	 * @param {Object} task The task object from {@link #loadTasks}
	 * @private
	 */
	doTask : function(record, task)
	{
		if (this.isRecordInContainer(record)) {
			task.fn.call(task.scope || task, this.field, record, task, this.doLoadRecordCallback.createDelegate(this, [ task ]));
		}
	},

	/**
	 * Callback function used when executing {@link #loadTasks tasks}. Each
	 * time this function is called, the task is removed from the {@link #loadTasks}
	 * list. If this was the last task, {@link #loadrecord} event is fired, and
	 * {@link #afterLoadRecord} will be called.
	 * @param {Object} task The task which was completed
	 * @private
	 */
	doLoadRecordCallback : function(task)
	{
		var record = this.record;

		// Unregister the task when it is completed.
		this.pendingTasks.remove(task);

		// Check if this was the last task...
		if (this.pendingTasks.length === 0) {
			// If all pending Tasks were done, all
			// scheduled tasks have been completed as well
			this.scheduledTasks = [];

			this.field.fireEvent('loadrecord', this.field, record);
			this.afterLoadRecord(record);
		}
	},

	/**
	 * Reset the {@link #isChangedByUser} property to false and fire the {@link #userupdaterecord} event
	 * to signal the value change. This will tell all components that the {@link #record} contains
	 * no modifications from the user.
	 * @private
	 */
	resetUserChangeTracker : function()
	{
		this.isChangedByUser = false;
		this.field.fireEvent('userupdaterecord', this.field, this.record, this.isChangedByUser);
	},

	/**
	 * Set the {@link #isChangedByUser} property to true and fire the {@link #userupdaterecord} event
	 * when this means the property was changed. This will tell all components that the {@link #record}
	 * contains modifications from the user.
	 * @private
	 */
	registerUserChange: function()
	{
		if (this.isChangedByUser !== true) {
			this.isChangedByUser = true;
			this.field.fireEvent('userupdaterecord', this.field, this.record, this.isChangedByUser);
		}
	},

	/**
	 * Check if the given record contains user changes. This will check the contents for
	 * {@link Zarafa.core.data.MAPIRecord#updateModifications updateModifications} and
	 * {@link Zarafa.core.data.MAPIRecord#updateSubStoreModifications updateSubStoreModifications}
	 * to see if they were modified.
	 * @param {Zarafa.core.data.MAPIRecord} record The record to validate
	 * @private
	 */
	checkForUserChanges : function(record)
	{
		var updateModifications = record.updateModifications;
		var updateSubStoreModifications = record.updateSubStoreModifications;

		if ((updateModifications && Object.keys(updateModifications).length > 0) ||
		    (updateSubStoreModifications && Object.keys(updateSubStoreModifications).length > 0)) {
			this.registerUserChange();
		}
	},

	/**
	 * Called by {@link #doLoadRecord} when all {@link #loadTasks} have been executed
	 * (or when no tasks were registered}.
	 *
	 * This will register additional event handlers on the {@link Zarafa.core.data.MAPIStore store}.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record which has been loaded
	 * @private
	 */
	afterLoadRecord : function(record)
	{
		if (this.ignoreUpdates !== true) {
			this.resetUserChangeTracker();

			var store = this.record.getStore();
			this.field.mon(store, {
				'update' : this.onUpdateRecord,
				'write' : this.onWrite,
				'scope' : this
			});
		}
	},

	/**
	 * Event handler will be called when the {@link Zarafa.core.data.MAPIStore Store} has
	 * updated the {@link Zarafa.core.data.MAPIRecord record}. This function will fire
	 * {@link #updaterecord} event to notify that the record is updated.
	 *
	 * @param {Zarafa.core.data.IPMStore} store The store in which the record is located.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has been updated
	 * @param {String} operation The update operation being performed. Value may be one of
	 * {@link Ext.data.Record.EDIT EDIT}, {@link Ext.data.Record.REJECT REJECT} or
	 * {@link Ext.data.Record.COMMIT COMMIT}
	 * @private
	 */
	onUpdateRecord : function(store, record, operation)
	{
		if (!this.isRecordInContainer(record)) {
			return;
		}

		// Check if this exact record was updated, or if this is an external notification.
		// If this was a notification, then we only accept committed changes, before applying
		// the update to our current active record.
		if (this.record !== record) {
			if (operation !== Ext.data.Record.COMMIT) {
				return;
			}

			this.record.applyData(record);
		}

		if (this.ignoreUpdates !== true) {
			if (operation === Ext.data.Record.COMMIT) {
				this.resetUserChangeTracker();
			} else {
				this.checkForUserChanges(record);
			}
		}

		this.field.fireEvent('updaterecord', this.field, operation, this.record);
	},

	/**
	 * Event handler will be called when the {@link Zarafa.core.data.MAPIStore Store} has
	 * fired an exception event.
	 * @param {Ext.data.DataProxy} proxy The proxy which fired the event.
	 * No event handler may modify any properties inside the provided record.
	 * @param {String} type See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {String} action See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Object} options See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Object} response See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was subject of the request
	 * that encountered an exception.
	 * @param {String} error (Optional) Passed when a thrown JS Exception or JS Error is
	 * available.
	 * @private
	 */
	onExceptionRecord : function(proxy, type, action, options, response, args)
	{
		/** Extract the record from the args, and pull it out of an array if that is the case.
		 * If the array length is bigger than 1, we can discard this exception as this
		 * RecordCompontentPlugin can only handle one at a time. In that case the record variable
		 * will remain an array and will not pass the next IF-statement when it is compared against
		 * the MAPIRecord class.
		 */
		var record = args.sendRecords;
		if(Array.isArray(record) && record.length == 1){
			record = record[0];
		}
		// If it is not a record or if the record is not the record in the Container we should skip it
		if(!(record instanceof Zarafa.core.data.MAPIRecord) || !this.isRecordInContainer(record)){
			return;
		}
		var error = args.error || undefined;

		this.field.fireEvent('exceptionrecord', type, action, options, response, record, error);
	},

	/**
	 * Event handler will be called when the {@link Zarafa.core.data.MAPIStore Store} has
	 * fired a write event.
	 * Store fires it if the server returns 200 after an Ext.data.Api.actions CRUD action.
	 *
	 * @param {Ext.data.Store} store
	 * @param {String} action [Ext.data.Api.actions.create|update|destroy]
	 * @param {Object} result The 'data' picked-out out of the response for convenience.
	 * @param {Ext.Direct.Transaction} res
	 * @param {Zarafa.core.data.IPMRecord[]} records Store's records, the subject(s) of the write-action
	 * @private
	 */
	onWrite : function(store, action, result, res, records)
	{
		// If records isn't array then make it.
		records = [].concat(records);

		for (var i = 0, len = records.length; i < len; i++) {
			if (this.record === records[i]) {
				if(action == Ext.data.Api.actions.destroy) {
					// the record has been destroyed and removed from store
					// so user made changes are not usefull anymore
					this.resetUserChangeTracker();
				}
				this.field.fireEvent('writerecord', store, action, result, res, records[i]);
				return;
			}
		}
	},

	/**
	 * Event handler which is called when the container is being closed.
	 * This will remove the {@link Zarafa.core.data.MAPIRecord record} from the
	 * {@link Zarafa.core.data.ShadowStore ShadowStore} (when the record was being {@link #allowWrite edited}).
	 * @param {Ext.Component} container The parent container on which this plugin is installed.
	 * @private
	 */
	onClose : function(dialog)
	{
		if (this.record) {
			this.endShadowRecordEdit(this.record);
		}
	}
});

Ext.preg('zarafa.recordcomponentplugin', Zarafa.core.plugins.RecordComponentPlugin);
