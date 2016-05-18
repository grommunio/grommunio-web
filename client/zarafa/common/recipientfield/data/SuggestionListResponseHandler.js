Ext.namespace('Zarafa.common.recipientfield.data');

/**
 * @class Zarafa.common.recipientfield.data.SuggestionListResponseHandler
 * @extends Zarafa.core.data.ProxyResponseHandler
 *
 * Small extension to the main {@link Zarafa.core.data.ProxyResponseHandler ProxyResponseHandler},
 * to add support for the special {@link #doList 'list'} action (which requires different handling
 * compared to the 'list' action frion {@link Zarafa.core.data.IPMResponseHandler IPMResponseHandler}.
 */
Zarafa.common.recipientfield.data.SuggestionListResponseHandler = Ext.extend(Zarafa.core.data.ProxyResponseHandler, {
	/**
	 * Handles the 'list' response. Gathers the records from the response data,
	 * converts each entry into a records and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 */
	doList : function(response)
	{
		var results = response.results || [];

		// Force results to be an array.
		if (!Ext.isArray(results)) {
			results = [ results ];
		}

		this.receivedRecords = this.reader.readRecords({
			count: results.length,
			result: results
		});
	}
});
