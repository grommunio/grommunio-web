Ext.namespace('Zarafa.plugins.mdm.data');

/**
 * @class Zarafa.plugins.mdm.data.MDMDeviceResponseHandler
 * @extends Zarafa.core.data.ProxyResponseHandler
 *
 * A Simple implementation for a {@link Zarafa.plugins.mdm.data.MDMDeviceResponseHandler ResponseHandler}.
 * This one can only be used by {@link Ext.data.DataProxy proxies} which wish to handle a Response
 * to their Request.
 *
 * This implementation limits itself to firing an {@link Ext.data.DataProxy#exception exception}
 * on error, and calling a callback function when all processing has been completed.
 */
Zarafa.plugins.mdm.data.MDMDeviceResponseHandler = Ext.extend(Zarafa.core.data.ProxyResponseHandler, {

	/**
	 * Handles the 'open' response. Gathers the records from the response data,
	 * converts each entry into a record (using {@link #readRecordsFromResponse}
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 */
	doOpen: function(response)
	{
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
	},

	/**
	 * Handles the 'list' response. Gathers the records from the response data,
	 * converts each entry into a record (using {@link #readRecordsFromResponse}
	 * and pushes them into the {@link #receivedRecords records list}.
	 * Also if response has authenticationInfo then this function will add that into {@property metaData}.
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 */
	doList: function(response)
	{
		if (response.authenticationInfo) {
			this.metaData.authenticationInfo = Ext.apply({}, response.authenticationInfo);
		}
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
	}
});
