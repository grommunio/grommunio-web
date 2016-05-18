Ext.namespace('Zarafa.calendar.data.busytime');

/**
 * @class Zarafa.calendar.data.busytime.BusyTimeResponseHandler
 * @extends Zarafa.core.data.ProxyResponseHandler
 *
 * Small extension to the main {@link Zarafa.core.data.ProxyResponseHandler ProxyResponseHandler},
 * to add support for the special {@link #doList 'list'} action.
 */
Zarafa.calendar.data.busytime.BusyTimeResponseHandler = Ext.extend(Zarafa.core.data.ProxyResponseHandler, {
	/**
	 * Handles the 'list' response. Gathers the records from the response data,
	 * converts each entry into a records and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function.
	 */
	doList : function(response)
	{
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
	}
});
