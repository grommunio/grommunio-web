Ext.namespace('Zarafa.common.rules.data');

/**
 * @class Zarafa.common.rules.data.RulesResponseHandler
 * @extends Zarafa.core.data.IPMResponseHandler
 */
Zarafa.common.rules.data.RulesResponseHandler = Ext.extend(Zarafa.core.data.IPMResponseHandler, {
	/**
	 * Reads all {@link Zarafa.core.data.MAPIRecord records} from the response data from the server,
	 * and correlates them to the {@link #sendRecords} list.
	 * @param {Object} response The reponse data from the server containing the
	 * {@link Zarafa.core.data.MAPIRecord records}
	 * @private
	 */
	correlateRecordFromResponse : function(response)
	{
		var responseObj = this.reader.readResponse(Ext.data.Api.actions.read, response);
		var records = [];

		// We expect as many rules back, as we send to the server,
		// so no need to correlate anything. We will allow everything
		// to be overridden.
		if (!Ext.isEmpty(responseObj.data) && !Ext.isEmpty(this.sendRecords)) {
			records = responseObj.data.clone();
		}
		return records;
	}
});
