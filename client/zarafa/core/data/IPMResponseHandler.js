Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMResponseHandler
 * @extends Zarafa.core.data.ProxyResponseHandler
 */
Zarafa.core.data.IPMResponseHandler = Ext.extend(Zarafa.core.data.ProxyResponseHandler, {
	/**
	 * Handles the 'list' response. Gathers the records from the response data,
	 * converts each entry into a record (using {@link #readRecordsFromResponse})
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doList : function(response)
	{
		if (response.folder) {
			this.metaData.folder = Ext.apply({}, response.folder);
		}
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
	},

	/**
	 * Handles the 'updatelist' response. Gathers the records from the response data,
	 * converts each entry into a record (using {@link #readRecordsFromResponse})
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} response The response object belonging to the given command.
	 */
	doUpdatelist : function(response)
	{
		if (response.folder) {
			this.metaData.folder = Ext.apply({}, response.folder);
		}
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
	},

	/**
	 * Handles the 'item' response. This will check if the item in the response is
	 * inside the {@link #sendRecords} and will convert the Response data into the
	 * updated {@link Ext.data.Record record} using {@link #correlateRecordFromResponse},
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doItem : function(response)
	{
		this.receivedRecords = this.receivedRecords.concat(this.correlateRecordFromResponse(response));
	},

	/**
	 * Handles the 'update' response. This will check if the item in the response is
	 * inside the {@link #sendRecords} and will convert the Response data into the
	 * updated {@link Ext.data.Record record} using {@link #correlateRecordFromResponse},
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doUpdate : function(response)
	{
		this.receivedRecords = this.receivedRecords.concat(this.correlateRecordFromResponse(response));
	},

	/**
	 * Handles the 'search' response. Gathers the records from the response data, 
	 * converts each entry into a record (using {@link #readRecordsFromResponse})
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doSearch : function(response)
	{
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');

		// get the metadata
		Ext.iterate(response, function(responseItem, metaObj) {
			if(responseItem != 'item') {
				this.metaData[responseItem] = metaObj;
			}
		}, this);
	},

	/**
	 * Handles the 'updatesearch' response. Gathers the records from the response data, 
	 * converts each entry into a record (using {@link #readRecordsFromResponse})
	 * and pushes them into the {@link #receivedRecords records list}. This is the same
	 * as {@link #doSearch} with the exception that the items read from the response will be added to
	 * the previous list in the {@link Ext.data.Store store} which is collecting the results.
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doUpdatesearch : function(response)
	{
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');

		// get the metadata
		Ext.iterate(response, function(responseItem, metaObj) {
			if(responseItem != 'item') {
				this.metaData[responseItem] = metaObj;
			}
		}, this);

		// Make sure the new results are appended to the previous search results.
		Ext.apply(this.options, {add : true});
	},

	/**
	 * Handles the 'stopsearch' response. This initializes {@link #receivedRecords}
	 * as if records have been returned by the server (using {@link #readRecordsFromResponse}).
	 * This ensures that the store will correctly handle the response in the callback function
	 * and correctly handles the 'success' property from the response.
	 *
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doStopsearch : function(response)
	{
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
	},

	/**
	 * Handles the 'search_error' response. This means that the Search Request has failed
	 * due to a problem on the PHP-side. This will fire the {@link Ext.data.DataProxy#exception exception}
	 * event on the {@link #proxy} object.
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doSearch_error : function(response)
	{
		this.doError(response);
		return false;
	},

	/**
	 * Used by {@link #correlateRecordFromResponse} to determine if the given item data
	 * matches the record which was send to the server. This is used to determine if the
	 * given data can be applied to the record.
	 * @param {Object} data The response data
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was send to the server
	 * @protected
	 */
	compareResponseDataToRecord : function(data, record)
	{
		// special handling if attach_num is present and we are processing response of embedded message
		if(!record.phantom && !Ext.isEmpty(record.get('attach_num'))) {
			// FIXME: probably first we should check type of entryid and then use appropriate compare functions
			if(Zarafa.core.EntryId.compareEntryIds(data.entryid, record.get('entryid'))) {
				// for embedded messages we need to compare attach_num additionally also
				if(record.get('attach_num').equals(data.props.attach_num)) {
					return true;
				}
			}
		}

		return Zarafa.core.data.IPMResponseHandler.superclass.compareResponseDataToRecord.apply(this, arguments);
	}
});
