Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMExpandDistlistResponseHandler
 * @extends Zarafa.core.data.ProxyResponseHandler
 */
Zarafa.core.data.IPMExpandDistlistResponseHandler = Ext.extend(Zarafa.core.data.ProxyResponseHandler, {
	/**
	 * Handles the 'expand' response. Gathers the expanded recipient(s) information from the 
	 * response data, this will simply check the 'results' field in the response
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} data The response object belonging to the given command.
	 */
	doExpand : function(response) {
		var results = response.results || [];

		// Force results to be an array.
		if (!Ext.isArray(results)) {
			results = [ results ];
		}

		var recipientData = this.reader.readRecords({
			result: results
		});

		this.receivedRecords = recipientData.records;
	}
});
