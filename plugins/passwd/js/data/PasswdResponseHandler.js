Ext.namespace('Zarafa.plugins.passwd.data');

/**
 * @class Zarafa.plugins.passwd.data.ResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * Passwd plugin specific response handler.
 */
Zarafa.plugins.passwd.data.PasswdResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {

	/**
	 * @cfg {Function} callbackFn The function which will be called after success/failure response.
	 */
	callbackFn : undefined,

	/**
	 * @cfg {Object} scope The function scope that will be used when calling {@link #callbackFn}.
	 */
	scope : undefined,

	/**
	 * In case exception happened on server, server will return exception response with the display message.
	 * @param {Object} response Object contained the response data.
	 */
	doError : function(response)
	{
		var displayMessage = _('An unknown error occurred while changing password.');

		if(response.info) {
			displayMessage = response.info.display_message;
		}

		Ext.MessageBox.alert(_('Error'), displayMessage);

		this.callbackFn.apply(this.scope || this, [ false, response ]);
	},

	/**
	 * When password change is successful server will send a success response including display message.
	 * @param {Object} response Object contained the response data.
	 */
	doSuccess : function(response)
	{
		var displayMessage = _('Password is changed successfully.');

		if(response.info) {
			displayMessage = response.info.display_message;
		}

		Ext.MessageBox.alert(_('Success'), displayMessage);

		this.callbackFn.apply(this.scope || this, [ true, response ]);
	}
});
