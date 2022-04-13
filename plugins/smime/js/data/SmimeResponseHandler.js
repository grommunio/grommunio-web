Ext.namespace('Zarafa.plugins.smime.data');

/**
 * @class Zarafa.plugins.smime.data.SmimeResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * Smime specific response handler.
 */
Zarafa.plugins.smime.data.SmimeResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {

	/**
	 * @cfg {Function} successCallback The function which
	 * will be called after success request.
	 */
	successCallback : null,
	
	/**
	 * @param {Object} response Object contained the response data.
	 */
	doCertificate : function(response) {
		this.successCallback(response);
	},

	/**
	 * @param {Object} response Object contained the response data.
	 */
	doPassphrase : function(response) {
		this.successCallback(response);
	},

	/**
	 * @param {Object} response Object contained the response data.
	 */
	doChangepassphrase : function(response) {
		this.successCallback(response);
	}
});

Ext.reg('smime.responsehandler', Zarafa.plugins.smime.data.SmimeResponseHandler);
