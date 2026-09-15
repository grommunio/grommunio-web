Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.AddressBookResponseHandler
 * @extends Grommunio.core.data.IPMResponseHandler
 *
 * Small extension to the main {@link Grommunio.core.data.IPMResponseHandler IPMResponseHandler},
 * to add support for the {@link #doHierarchy 'hierarchy'} action.
 */
Grommunio.addressbook.AddressBookResponseHandler = Ext.extend(Grommunio.core.data.IPMResponseHandler, {
	/**
	 * Handles the 'list' response. Gathers the records from the response data,
	 * converts each entry into a record (using {@link #readRecordsFromResponse}
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 */
	doList: function(response)
	{
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
	}
});
