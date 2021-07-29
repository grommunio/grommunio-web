Ext.namespace('Zarafa.plugins.mdm.data');

/**
 * @class Zarafa.plugins.mdm.data.MDMResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * MDM specific response handler.
 */
Zarafa.plugins.mdm.data.MDMResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {

	/**
	 * @cfg {Function} successCallback The function which
	 * will be called after success request.
	 */
	successCallback : Ext.emptyFn,

	/**
	 * @cfg {Function} failureCallback The function which
	 * will be called after a failed request.
	 * This callback is optional and currently unused.
	 */
	failureCallback : Ext.emptyFn,

	/**
	 * Device information from grommunio-sync's soap call,
	 * @param {Object} response Object contained the response data.
	 */
	doInfo : function(response) {
		this.successCallback(response);
		/*
		if(response.status != true && this.failureCallback != null) {
			this.failureCallback(response);
		} else {
			this.successCallback(response);
		}*/
	},

	/**
	 * Response handler callback function for authenticate action.
	 * Call successCallback callback function to perform actions on the basis of response,
	 * @param {Object} response Object contained the response data. Contains data regarding
	 * authentication with grommunio-sync server.
	 */
	doAuthenticate : function(response)
	{
		this.processAuthResponse(response, this.successCallback, 'authenticate');
	},

	/**
	 * Call the successCallback callback function if device was successfully removed from
	 * grommunio-sync server else check and handle an authentication failure for grommunio-sync server.
	 * @param {Object} response Object contained the response data.
	 */
	doRemove : function(response)
	{
		if(response.remove){
			this.successCallback();
		} else {
			this.processAuthResponse (response, this.failureCallback, 'remove');
		}
	},

	/**
	 * If wipe request response was successful, show informative message
	 * else check and handle an authentication failure for grommunio-sync server.
	 * @param {Object} response Object contained the response data.
	 */
	doWipe : function(response)
	{
		if (response.wipe === true) {
			container.getNotifier().notify('info.mdm', _('Mobile Device Manager'), _('Wiping device', 'plugin_mdm'));
		} else if (!response.wipe) {
			container.getNotifier().notify('info.mdm', _('Mobile Device Manager'), _('Password incorrect', 'plugin_mdm'));
		} else {
			this.processAuthResponse (response, this.failureCallback, 'wipe');
		}
	},

	/**
	 * If resync request response was successful, show informative message
	 * else check and handle an authentication failure for grommunio-sync server.
	 * @param {Object} response Object contained the response data.
	 */
	doResync : function(response)
	{
		if (response.resync === true) {
			container.getNotifier().notify('info.mdm', _('Mobile Device Manager'), _('Full resync in progress', 'plugin_mdm'));
		} else {
			this.processAuthResponse (response, this.failureCallback, 'resync');
		}
	},

	/**
	 * This function will call callback function given in param
	 * if response is regarding authentication only.
	 * @param {Object} response Object contained the response data.
	 * @param {Function} callbackFn function which will be called if response is regarding authentication.
	 * @param {String} actionType indicates from which action handler this function has been called.
	 */
	processAuthResponse : function(response, callbackFn, actionType)
	{
		var authenticationObj = response.authenticationInfo;
		if (authenticationObj) {
			callbackFn.call(this.mdmWidgetScope, authenticationObj.authentication);
			if (actionType === 'authenticate' && authenticationObj.authentication === false) {
				container.getNotifier().notify('info.mdm', _('Mobile Device Manager'), _('Username or password incorrect', 'plugin_mdm'));
			}
		}
	}
});

Ext.reg('mdm.responsehandler', Zarafa.plugins.mdm.data.MDMResponseHandler);
