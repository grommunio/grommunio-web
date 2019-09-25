Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.DummyResponseHandler
 * @extends Zarafa.core.data.ProxyResponseHandler
 *
 * A special response handler to handle responses of requests that are already cancelled.
 * as a special requirement for cancelling requests we need to ignore the response coming for that 
 * request and process notifications properly for that request (like new mail notifications).
 */
Zarafa.core.data.DummyResponseHandler = Ext.extend(Zarafa.core.data.ProxyResponseHandler, {
	/**
	 * The main handler to begin a Response processing transaction. Checks the whether the {@link #proxy}
	 * is defined and if not returns false to cancel all processing by this handler.
	 * @param {String} moduleName The name of the PHP module from which this response originated.
	 * @param {String} moduleId The unique identifier for the PHP response.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the response was received
	 * @return {Boolean} False when the given data object cannot be handled by this response handler,
	 * and the transaction must be canceled.
	 * @override
	 */
	start : function(moduleName, moduleId, data, timestamp)
	{
		// Inform the proxy the response for a given request has been returned.
		if (this.proxy && Ext.isFunction(this.proxy.deleteRequestId)) {
			this.proxy.deleteRequestId(moduleId);
		}

		return false;
	}
});
