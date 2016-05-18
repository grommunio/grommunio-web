Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.AbstractResponseHandler
 * @extends Object
 *
 * The main interface used by the {@link Zarafa.core.ResponseRouter ResponseRouter}
 * for handling responses recieved by the PHP-side.
 *
 * This class is used as 'scoped' object, containing all information for handling
 * a specific server-response or server-notification.
 *
 * The {@link #start} function will be called directly before the
 * {@link Zarafa.core.ResponseRouter ResponseRouter} starts processing
 * the Response from the server which is intended for this handler.
 *
 * After this function the {@link #handle} function will be invoked
 * for each object inside the responds. Subclasses should not overwrite
 * this function directly, instead they can implement the specific handles
 * they need. Each {@link Zarafa.core.Actions} action will invoke the handler
 * with the same name but with 'do' prefixed. For example, the action
 * {@link Zarafa.core.Actions#item} will cause the function 'doItem' to be
 * invoked. Likewise, the action {@link Zarafa.core.Actions#open} will cause
 * the function 'doOpen' to be invoked.
 *
 * Finally the {@link #done} function is called to indicate the entire
 * response has been processed. The handler can then complete the
 * transaction by updating the {@link Ext.data.Store}.
 */
Zarafa.core.data.AbstractResponseHandler = Ext.extend(Object, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * The handler which is invoked when no valid response was returned
	 * for the Request. This could be a HTTP-404 error, or the PHP-side returned
	 * an invalid object which could not be parsed by a {@link Ext.data.DataReader DataReader}.
	 * @param {Object} responseObject The raw browser response object (e.g.: XMLHttpRequest)
	 * @param {Object} args (optional) A Javascript error object if the response could not
	 * have been parsed by a {@link Ext.data.DataReader DataReader}.
	 */
	responseFailure : Ext.emptyFn,

	/**
	 * The main handler to begin a Response processing transaction.
	 * @param {String} moduleName The name of the PHP module from which this response originated.
	 * @param {String} moduleId The unique identifier for the PHP response.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the response was received
	 * @return {Boolean} False when the given data object cannot be handled by this response handler,
	 * and the transaction must be canceled.
	 */
	start : Ext.emptyFn,

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
		var handler = this['do' + Ext.util.Format.capitalize(action)];
		if (Ext.isFunction(handler)) {
			return handler.call(this, data);
		}
	},

	/**
	 * The main handler to complete a Response processing transaction.
	 * @param {Boolean} success True if no errors were returned from the PHP-side.
	 */
	done : Ext.emptyFn
});
