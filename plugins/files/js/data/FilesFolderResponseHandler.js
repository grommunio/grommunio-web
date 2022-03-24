Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.FilesFolderResponseHandler
 * @extends Zarafa.core.data.ProxyResponseHandler
 *
 * A Simple implementation for a {@link Zarafa.plugins.files.data.FilesFolderResponseHandler ResponseHandler}.
 * This one can only be used by {@link Ext.data.DataProxy proxies} which wish to handle a Response
 * to their Request.
 *
 * This implementation limits itself to firing an {@link Ext.data.DataProxy#exception exception}
 * on error, and calling a callback function when all processing has been completed.
 */
Zarafa.plugins.files.data.FilesFolderResponseHandler = Ext.extend(Zarafa.core.data.ProxyResponseHandler, {

	/**
	 * Handles the list response. Gathers the stores from the response data, converts each entry
	 * into a {@link Zarafa.core.MAPIStore MAPIStore} and pushes them into the collectedItems.
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doList: function(response)
	{
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
	},

	/**
	 * Handles the updatelist response. Gathers the stores from the response data, converts each entry
	 * into a {@link Zarafa.core.MAPIStore MAPIStore} and pushes them into the collectedItems.
	 *
	 * @param {Object} response The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doUpdatelist: function(response)
	{
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
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
	doUpdate: function(response)
	{
		this.receivedRecords = this.receivedRecords.concat(this.correlateRecordFromResponse({ item: response }));
	}
});
