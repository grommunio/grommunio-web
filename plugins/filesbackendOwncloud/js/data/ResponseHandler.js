Ext.namespace('Zarafa.plugins.files.backend.Owncloud.data');

/**
 * @class Zarafa.plugins.files.backend.Owncloud.data.ResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 * @xtype filesplugin.owncloud.responsehandler
 *
 * Files plugin specific response handler.
 */
Zarafa.plugins.files.backend.Owncloud.data.ResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {
	/**
	 * @cfg {Function} successCallback The function which
	 * will be called after success request.
	 */
	successCallback: null,

	/**
	 * @cfg {Function} failureCallback The function which
	 * will be called after a failed request.
	 */
	failureCallback: null,

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doLoadsharingdetails: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doCreatenewshare: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doDeleteexistingshare: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doUpdateexistingshare: function (response) {
		this.successCallback(response);
	},

	/**
	 * In case exception happened on server, server will return
	 * exception response with the code of exception.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doError: function (response) {
		Zarafa.common.dialogs.MessageBox.show({
			title  : response.header,
			msg    : response.message,
			icon   : Zarafa.common.dialogs.MessageBox.ERROR,
			buttons: Zarafa.common.dialogs.MessageBox.OK
		});
		this.failureCallback(response);
	}
});

Ext.reg('filesplugin.owncloud.responsehandler', Zarafa.plugins.files.backend.Owncloud.data.ResponseHandler);
