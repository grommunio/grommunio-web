Ext.namespace('Zarafa.common.freebusy.data');

/**
 * @class Zarafa.common.freebusy.data.FreebusyResponseHandler
 * @extends Zarafa.core.data.ProxyResponseHandler
 *
 * Small extension to the main {@link Zarafa.core.data.ProxyResponseHandler ProxyResponseHandler},
 * to add support for the special {@link #doList 'list'} action for Freebusy blocks.
 */
Zarafa.common.freebusy.data.FreebusyResponseHandler = Ext.extend(Zarafa.core.data.ProxyResponseHandler, {
	/**
	 * Handles the 'list' response. Gathers the records from the response data,
	 * converts each entry into a records and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function.
	 */
	doList : function(response)
	{
		var items = [];
		Ext.each(response.users, function(userData) {
			Ext.each(userData.items, function(userItem) {
				items.push(Ext.applyIf(userItem, {
					userid : userData.userid
				}));
			});
		});

		this.receivedRecords = this.reader.readRecords({
			count: items.length,
			item: items
		});
	}
});
