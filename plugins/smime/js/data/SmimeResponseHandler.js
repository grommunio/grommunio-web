Ext.namespace('Grommunio.plugins.smime.data');

/**
 * @class Grommunio.plugins.smime.data.SmimeResponseHandler
 * @extends Grommunio.core.data.AbstractResponseHandler
 *
 * Smime specific response handler.
 */
Grommunio.plugins.smime.data.SmimeResponseHandler = Ext.extend(Grommunio.core.data.AbstractResponseHandler, {

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

Ext.reg('smime.responsehandler', Grommunio.plugins.smime.data.SmimeResponseHandler);
