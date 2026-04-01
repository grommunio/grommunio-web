Ext.namespace('Zarafa.plugins.templatesnippets');

/**
 * @class Zarafa.plugins.templatesnippets.TemplateSnippetsResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * Response handler for system template CRUD operations (admin only).
 */
Zarafa.plugins.templatesnippets.TemplateSnippetsResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {

	/**
	 * @cfg {Function} successCallback Called on success with (response).
	 */
	successCallback: undefined,

	/**
	 * @cfg {Object} scope Scope for callbacks.
	 */
	scope: undefined,

	/**
	 * Handle error response from the server.
	 * @param {Object} response The response data
	 */
	doError: function(response) {
		var msg = _('An unknown error occurred.');
		if (response && response.info && response.info.display_message) {
			msg = response.info.display_message;
		}
		Ext.MessageBox.alert(_('Error'), msg);
	},

	/**
	 * Handle success response (after save or delete).
	 * @param {Object} response The response data
	 */
	doSuccess: function(response) {
		if (Ext.isFunction(this.successCallback)) {
			this.successCallback.call(this.scope || this, response);
		}
	}
});
