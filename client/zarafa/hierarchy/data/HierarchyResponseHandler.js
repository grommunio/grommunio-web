Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.HierarchyResponseHandler
 * @extends Zarafa.core.data.ProxyResponseHandler
 */
Zarafa.hierarchy.data.HierarchyResponseHandler = Ext.extend(Zarafa.core.data.ProxyResponseHandler, {
	/**
	 * Handles the list response. Gathers the stores from the response data, converts each entry 
	 * into a {@link Zarafa.core.MAPIStore MAPIStore} and pushes them into the collectedItems.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doList: function(response)
	{
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
	},

	/**
	 * Handles the 'folders' response. Gathers the folders which have been modified
	 * by the request, converts them into {@link Zarafa.hierarchy.data.MAPIFolderRecord Folders},
	 * and pushes them into the collectedItems.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doFolders: function(response)
	{
		this.receivedRecords = this.receivedRecords.concat(this.correlateRecordFromResponse({ item: response }));
	},

	/**
	 * Handles the 'item' response. Gathers the folders which have been modified
	 * by the request, converts them into {@link Zarafa.hierarchy.data.MAPIFolderRecord Folders},
	 * and pushes them into the collectedItems.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doItem: function(response)
	{
		this.receivedRecords = this.receivedRecords.concat(this.correlateRecordFromResponse({ item: response }));
	},

	/**
	 * Handles the 'update' response. This will check if the item in the response is
	 * inside the {@link #sendRecords} and will convert the Response data into the
	 * updated {@link Ext.data.Record record} using {@link #correlateRecordFromResponse},
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doUpdate : function(response)
	{
		this.receivedRecords = this.receivedRecords.concat(this.correlateRecordFromResponse({ item: response }));
	}
});
