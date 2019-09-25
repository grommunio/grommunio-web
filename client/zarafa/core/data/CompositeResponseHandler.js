Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.CompositeResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * This class specializes in wrapping multiple {@link Zarafa.core.data.AbstractResponseHandler AbstractResponseHandler}
 * objects into a single interface to be used by the {@link Zarafa.core.ResponseRouter ResponseRouter}.
 *
 * Each call into this class, will result in the same call into each {@link Zarafa.core.data.AbstractResponseHandler sub-handler}.
 */
Zarafa.core.data.CompositeResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {
	/**
	 * @cfg {Zarafa.core.data.AbstractResponseHandler[]} handlers The array of notification handlers
	 * which have been wrapped by this composite handler.
	 */
	handlers : undefined,

	/**
	 * Array of objects containing the {@link Zarafa.core.data.AbstractResponseHandler ResponseHandlers} which
	 * are active for the current transaction. This is a subset of {@link #handlers}. Any ResponseHandler not in this list,
	 * has returned false during {@link #start}. For each ResponseHandler we also keep track of the success status, this
	 * indicates the value for the 'success' argument to {@link #done}.
	 * @property
	 * @type Array
	 */
	activeHandlers : undefined,

	/**
	 * The main handler to begin a Response processing transaction.
	 * @param {String} moduleName The name of the PHP module from which this response originated.
	 * @param {String} moduleId The unique identifier for the PHP response.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the response was received
	 * @return {Boolean} False when the given data object cannot be handled by this response handler,
	 * and the transaction must be canceled.
	 */
	start : function(moduleName, moduleId, data, timestamp)
	{
		this.activeHandlers = [];

		for (var i = 0, len = this.handlers.length; i < len; i++) {
			var handler = this.handlers[i];
			if (handler.start(moduleName, moduleId, data, timestamp) !== false) {
				this.activeHandlers.push({ handler : handler, success : true });
			}
		}

		return this.activeHandlers.length > 0;
	},

	/**
	 * The handler for handling the given command from a Response.
	 * @param {Zarafa.core.Actions} action The action which must be executed.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	handle : function(action, data)
	{
		for (var i = 0, len = this.activeHandlers.length; i < len; i++) {
			var handler = this.activeHandlers[i];
			handler.success = handler.handler.handle(action, data);
		}
	},

	/**
	 * The main handler to complete a Response processing transaction.
	 * @param {Boolean} success True if no errors were returned from the PHP-side.
	 */
	done : function(success)
	{
		for (var i = 0, len = this.activeHandlers.length; i < len; i++) {
			var handler = this.activeHandlers[i];
			handler.handler.done(handler.success);
		}
	}
});
