Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.IPMRecipientResolveResponseHandler
 * @extends Grommunio.core.data.ProxyResponseHandler
 */
Grommunio.core.data.IPMRecipientResolveResponseHandler = Ext.extend(Grommunio.core.data.ProxyResponseHandler, {
	/**
	 * Handles the 'checknames' response. Gathers the resolved recipient information from the
	 * response data, this will simply check the 'resolveresponse' field in the response
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 */
	doChecknames: function(response) {
		this.receivedRecords = [];
		if (Ext.isDefined(response.resolveresponse)) {
			for(var i=0; i<response.resolveresponse.length; i++){
				this.receivedRecords.push({
					id: response.resolveresponse[i].id,
					result: this.readRecordsFromResponse(response.resolveresponse[i], 'result')
				});
			}
		}
	},

	/**
	 * Reads all {@link Grommunio.core.data.MAPIRecord records} from the response data from the server.
	 * @param {Object} response The response data from the server containing the
	 * {@link Grommunio.core.data.MAPIRecord records}
	 * @param {String} field The fieldname of the array of items in the Response object which
	 * must be converted into {@link Grommunio.core.data.MAPIRecord records}.
	 * @return {Grommunio.core.data.MAPIRecord[]} The {@link Grommunio.core.data.MAPIRecord records}
	 * read from the server response.
	 * @private
	 */
	readRecordsFromResponse: function(response, field)
	{
		var items = response[field] || [];
		if (!Array.isArray(items)) {
			items = [ items ];
		}

		var o = {};
		// Add 'field' property to response data, this will fix this.getRoot(o) in JSONReader
		o[field] = items;

		// Use the reader to turn the raw JavaScript objects into a set of Ext.data.Record instances.
		return this.reader.readRecords(o);
	}
});
