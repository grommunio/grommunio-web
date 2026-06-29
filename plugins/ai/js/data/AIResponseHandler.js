Ext.namespace('Zarafa.plugins.ai.data');

/**
 * @class Zarafa.plugins.ai.data.AIResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * Response handler for non-streaming AI module requests. Routes the server
 * 'success'/'error' feedback to the supplied callbacks.
 */
Zarafa.plugins.ai.data.AIResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {

	/**
	 * @cfg {Function} successCallback Called with (response) on success.
	 */
	successCallback: undefined,

	/**
	 * @cfg {Function} errorCallback Called with (message, response) on error.
	 */
	errorCallback: undefined,

	/**
	 * @cfg {Object} scope Scope for the callbacks.
	 */
	scope: undefined,

	/**
	 * Handle a successful response.
	 * @param {Object} response The response data.
	 */
	doSuccess: function(response)
	{
		if (Ext.isFunction(this.successCallback)) {
			this.successCallback.call(this.scope || this, response || {});
		}
	},

	/**
	 * Handle an error response.
	 * @param {Object} response The response data.
	 */
	doError: function(response)
	{
		var message = _('An unknown error occurred.');
		if (response && response.info && response.info.display_message) {
			message = response.info.display_message;
		}
		if (Ext.isFunction(this.errorCallback)) {
			this.errorCallback.call(this.scope || this, message, response);
		}
	}
});
