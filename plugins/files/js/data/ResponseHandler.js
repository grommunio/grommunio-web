Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.ResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 * @xtype filesplugin.responsehandler
 *
 * Files plugin specific response handler.
 */
Zarafa.plugins.files.data.ResponseHandler = Ext.extend(Zarafa.core.data.IPMResponseHandler, {

	/**
	 * @cgf {String} The id of the opened node in fuile tree recieved from the Files
	 */
	nodeId: undefined,

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
	doGetquota: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doGetbackends: function (response) {

		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doGetversion: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doGetfilestree: function (response) {
		this.successCallback(response.items, response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doCheckifexists: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doDownloadtotmp: function (response) {
		this.successCallback(response.items, response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doCreatedir: function (response) {
		this.successCallback(response);
	},

	/**
	 * Call the successCallback callback function.
	 *
	 * @param {Object} response Object contained the response data.
	 */
	doUploadtobackend: function (response) {
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
			title  : dgettext('plugin_files', 'Error'),
			msg    : response.info.original_message,
			icon   : Zarafa.common.dialogs.MessageBox.ERROR,
			buttons: Zarafa.common.dialogs.MessageBox.OK
		});
	}
});

Ext.reg('filesplugin.responsehandler', Zarafa.plugins.files.data.ResponseHandler);
