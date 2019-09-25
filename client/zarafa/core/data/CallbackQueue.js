Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.CallbackQueue
 * @extends Ext.util.Observable
 *
 * A Special queue containing callback functions which can be used
 * to serialize a series of actions/validations where it is possible
 * that each action/validation might use a {@link Ext.MessageBox MessageBox}
 * to request the user input. While the {@link Ext.MessageBox MessageBox}
 * is opened, the queue will be paused until the user has closed the message.
 */
Zarafa.core.data.CallbackQueue = Ext.extend(Ext.util.Observable, {
	/**
	 * The queue which contains all the tasks which should be run
	 * @property
	 * @type Array
	 * @private
	 */
	queue : undefined,

	/**
	 * Indicates that {@link #run} has been called, and the various callbacks
	 * in the {@link #queue} are being executed.
	 * @property
	 * @type Boolean
	 * @private
	 */
	running : false,

	/**
	 * Internal counter to keep track at which task is currently being executed,
	 * this will be reset when the {@link #run queue starts} and will be updated
	 * after the {@link #onCompleteTask completion of each task}.
	 * @property
	 * @type Number
	 * @private
	 */
	currentTask : 0,

	/**
	 * The function which is provided to {@link #run} which should be called as
	 * soon as the last task has been called. It will be called with the scope
	 * {@link #completionScope}.
	 * @property
	 * @type Function
	 * @private
	 */
	completionFn : undefined,

	/**
	 * The scope for the {@link #completionFn} which is provided to {@link #run}.
	 * @property
	 * @type Object
	 * @private
	 */
	completionScope : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		// Initialize the queue
		config.queue = [];

		this.addEvents(
			/**
			 * @event startqueue
			 * Event which is fired when the queue is about to start
			 * @param {Zarafa.core.data.CallbackQueue} queue The queue which is started
			 */
			'startqueue',
			/**
			 * @event completequeue
			 * Event which is fired when the last callback from the queue has been completed.
			 * @param {Zarafa.core.data.CallbackQueue} queue The queue which has completed
			 * @param {Boolean} success True if all callbacks were executed successfully
			 */
			'completequeue',
			/**
			 * @event starttask
			 * Event which is fired when a task has started
			 * @param {Zarafa.core.data.CallbackQueue} queue The queue to which the task belongs
			 * @param {Function} fn The task function which has been started
			 * @param {Object} scope The scope of the function which has started
			 */
			'starttask',
			/**
			 * @event completetask
			 * Event which is fired when a task has completed
			 * @param {Function} fn The task function which has been completed
			 * @param {Object} scope The scope of the function which has completed
			 * @param {Boolean} success True if the callback was executed successfully
			 */
			'completetask'
		);

		Ext.apply(this, config);

		Zarafa.core.data.CallbackQueue.superclass.constructor.call(this, config);
	},

	/**
	 * Add a callback function to the end of the {@link #queue}. When {@link #run} is called,
	 * this function will be executed with the provided scope.
	 * @param {Function} fn The function which will be called
	 * @param {Object} scope The scope in which the function will be called
	 */
	add : function(fn, scope)
	{
		this.queue.push({ fn : fn, scope : scope });
	},

	/**
	 * Remove a callback function which was previously registered using {@link #add}.
	 * This will search for the task in the {@link #queue} which matches the given
	 * function and scope exactly, and removed it from the {@link #queue}.
	 * @param {Function} fn The function to remove
	 * @param {Object} scope The scope of the function
	 */
	remove : function(fn, scope)
	{
		var queue = this.queue;

		for (var i = 0; i < queue.length; i++) {
			var task = queue[i];

			// Check if this is the same function and scope,
			// if so remove it from the queue.
			if (task.fn === fn && task.scope === scope) {
				this.queue.splice(i, 1);
				return;
			}
		}
	},

	/**
	 * Run all Callback functions in the {@link #queue}. This will fire the {@link #start} event,
	 * and starts all tasks {@link #currentTask starting with} 0.
	 */
	run : function(fn, scope)
	{
		this.running = true;
		this.currentTask = 0;
		this.completionFn = fn;
		this.completionScope = scope;

		this.fireEvent('startqueue', this);

		this.doTask(this.currentTask);
	},

	/**
	 * @returns {Boolean} True if the queue is currently running
	 */
	isRunning : function()
	{
		return this.running;
	},

	/**
	 * Called to execute the task at the specified location in the {@link #queue}.
	 * This will execute the callback function, and pass the {@link #onCompleteTask} function
	 * as callback function.
	 * @param {Number} index The index in the queue of the callback to execute
	 * @private
	 */
	doTask : function(index)
	{
		var task = this.queue[index];
		this.fireEvent('starttask', this, task.fn, task.scope);
		task.fn.call(task.scope, this.onCompleteTask.createDelegate(this, [ task ], 1));
	},

	/**
	 * Callback function for the task which was executed using {@link #doTask}. This
	 * checks if the task was successfully completed and if so if this was the last task.
	 * If either the task has failed, or this was the last task, the queue will be stopped,
	 * and the {@link #complete} event will be fired. Otherwise {@link #doTask} will be
	 * called to execute the {@link #currentTask next task}.
	 * @param {Boolean} success True if the task completed successfully
	 * @param {Object} task The task which was completed successfully
	 * @private
	 */
	onCompleteTask : function(success, task)
	{
		// If not provided, then assume success
		success = success !== false;

		this.fireEvent('completetask', this, task.fn, task.scope, success);

		if (success && this.currentTask < (this.queue.length - 1)) {
			this.currentTask++;
			this.doTask(this.currentTask);
		} else {
			if (this.completionFn) {
				this.completionFn.call(this.completionScope, success);
				this.completionFn = undefined;
				this.completionScope = undefined;
			}
			this.fireEvent('completequeue', this, success);
			this.running = false;
		}
	}
});
