Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMAttachmentResponseHandler
 * @extends Zarafa.core.data.ProxyResponseHandler
 *
 * A special response handler for the {@link Zarafa.core.data.IPMAttachmentProxy Attachment Proxy}
 * which can handle responses from the 'upload_attachments' server instruction.
 */
Zarafa.core.data.IPMAttachmentResponseHandler = Ext.extend(Zarafa.core.data.ProxyResponseHandler, {
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
	 * Used by {@link #correlateRecordFromResponse} to determine if the given item data
	 * matches the record which was send to the server. This is used to determine if the
	 * given data can be applied to the record.
	 * @param {Object} data The response data
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was send to the server
	 * @private
	 */
	compareResponseDataToRecord : function(data, record)
	{
		return data.props.name.localeCompare(record.get('name')) === 0;
	}
});
