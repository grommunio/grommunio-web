Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.ProxyResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * A Simple implementation for a {@link Zarafa.core.data.AbstractResponseHandler ResponseHandler}.
 * This one can only be used by {@link Ext.data.DataProxy proxies} which wish to handle a Response
 * to their Request.
 *
 * This implementation limits itself to firing an {@link Ext.data.DataProxy#exception exception}
 * on error, and calling a callback function when all processing has been completed.
 */
Zarafa.core.data.ProxyResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {
	/**
	 * @cfg {Ext.data.DataProxy} proxy The proxy which send out the Request
	 * for which the Response is being handled by this handler.
	 */
	proxy: undefined,

	/**
	 * @cfg {Ext.data.Reader} reader
	 * Reader that will be used to parse the records
	 */
	reader: undefined,

	/**
	 * @cfg {Ext.data.Api.actions} action The {@link Ext.data.Api#actions action}
	 * type of the Request for which the Response is being handled by this handler.
	 */
	action: undefined,

	/**
	 * @cfg {Function} callback
	 * Callback function that will be called when the handling of the request is done.
	 */
	callback: undefined,

	/**
	 * @cfg {Object} scope
	 * Scope that will be used when calling the callback function.
	 */
	scope: undefined,

	/**
	 * @cfg {Object} options The options as passed to the {@link Ext.data.DataProxy#request request}
	 * function.
	 */
	options: undefined,

	/**
	 * @cfg {Ext.data.Record/Array} sendRecords The {@link Ext.data.Record records} which have
	 * been send to the PHP-side if {@link #action} was a 'write' action
	 * (Ext.data.Api.actions.create|update|destroy)
	 */
	sendRecords: undefined,

	/**
	 * The deserialized results from the Response. Depending on the action (it depends for example
	 * if the {@link Zarafa.core.data.JsonReader JsonReader} is used, and which function is called.
	 * See {@link Zarafa.core.data.JsonReader#readResponse readResponse} and
	 * {@link Zarafa.core.data.JsonReader#readRecords readRecords} for possible return values)
	 * this could be an Array or an {@link Ext.data.Response object}. 
	 * @property
	 * @type Mixed 
	 */
	receivedRecords: undefined,

	/**
	 * The {@link Date#getTime timestamp} of the date on which the response was received, this
	 * value is provided during {@link #start}.
	 * @property
	 * @type Number
	 */
	receivedTime : undefined,

	/**
	 * The meta data that is received with response that will be sent to the {#callback} function.
	 * this can contain pagination information or search information.
	 * @property
	 * @type Mixed
	 */
	metaData : undefined,

	/**
	 * The handler which is invoked when no valid response was returned
	 * for the Request. This could be the PHP-side returned an invalid object which could not be 
	 * parsed by a {@link Ext.data.DataReader DataReader}.
	 * @param {Object} responseObject The raw browser response object (e.g.: XMLHttpRequest)
	 * @param {Object} args (optional) A Javascript error object if the response could not
	 * have been parsed by a {@link Ext.data.DataReader DataReader}.
	 */
	responseFailure : function(responseObject, args)
	{
		if (Ext.isDefined(this.proxy)) {
			// Create the args object containing the sendRecords and the JS Error to be used when 
			// handling the exception event
			args = {
				error: args,
				sendRecords: this.sendRecords
			};
			this.proxy.fireEvent('exception', this.proxy, 'response', this.action, this.options, responseObject, args);
		}
	},

	/**
	 * The main handler to begin a Response processing transaction. Checks the whether the {@link #proxy}
	 * is defined and if not returns false to cancel all processing by this handler.
	 * @param {String} moduleName The name of the PHP module from which this response originated.
	 * @param {String} moduleId The unique identifier for the PHP response.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the response was received
	 * @return {Boolean} False when the given data object cannot be handled by this response handler,
	 * and the transaction must be canceled.
	 * @override
	 */
	start: function(moduleName, moduleId, data, timestamp)
	{
		if(!Ext.isDefined(this.proxy)){
			return false;
		}

		// Inform the proxy the response for a given request has been returned.
		if (Ext.isFunction(this.proxy.deleteRequestId)) {
			this.proxy.deleteRequestId(moduleId);
		}

		// Prepare the collectedItems list so the doList is able to handle multiple list actions.
		this.receivedRecords = [];

		// Update the received time
		this.receivedTime = timestamp;

		// Force sendRecords to be an array
		if (!Ext.isEmpty(this.sendRecords) && !Array.isArray(this.sendRecords)) {
			this.sendRecords = [ this.sendRecords ];
		}

		// prepare object to store meta data information
		this.metaData = {};
	},

	/**
	 * The handler for handling the given command from a Response.
	 * @param {Zarafa.core.Actions} action The action which must be executed.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	handle : function(action, data)
	{
		var ret;
		try {
			ret = Zarafa.core.data.ProxyResponseHandler.superclass.handle.call(this, action, data);
		} catch(e) {
			// Create the args object containing the sendRecords and the thrown exception to be used
			// when handling the exception event
			var args = {
				error: e,
				sendRecords: this.sendRecords
			};
			this.proxy.fireEvent('exception', this.proxy, 'response', this.action, this.options, data, args);
			ret = false;
		}

		if (ret !== false) {
			if (this.proxy && Ext.isFunction(this.proxy.updateExecutionTimestamp)) {
				this.proxy.updateExecutionTimestamp(action, this.receivedTime);
			}
		}

		return ret;
	},

	/**
	 * Handles the 'error' response. This means that the Request has failed
	 * due to a problem on the PHP-side. This will fire the {@link Ext.data.DataProxy#exception exception}
	 * event on the {@link #proxy} object.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 */
	doError : function(response)
	{
		// Create the args object containing the sendRecords to be used when handling the exception
		var args = { sendRecords: this.sendRecords };
		response = { error : response };

		this.proxy.fireEvent('exception', this.proxy, 'remote', this.action, this.options, response, args);
		return false;
	},

	/**
	 * The main handler to complete a Response processing transaction. This will
	 * call the {@link #callback} function with the required arguments.
	 * @param {Boolean} success True if no errors were returned from the PHP-side.
	 * @override
	 */
	done : function(success)
	{
		if (Ext.isFunction(this.callback)) {
			// @FIXME do we have better way to pass meta data to callback function ?
			this.callback.call(this.scope, this.receivedRecords, this.options, success, this.metaData);
		}
	},

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
		var sendRecords = this.sendRecords.clone();
		var records = [];

		if (!Ext.isEmpty(responseObj.data) && !Ext.isEmpty(sendRecords)) {
			for (var i = 0, len = responseObj.data.length; i < len; i++) {
				for (var j = 0, len2 = sendRecords.length; j < len2; j++) {
					if (this.compareResponseDataToRecord(responseObj.data[i], sendRecords[j])) {
						records.push(responseObj.data[i]);
						sendRecords.splice(j, 1);
						break;
					}
				}
			}
		}

		return records;
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
		// FIXME: Record comparison by entryid alone is not sufficient.
		// FIXME: probably first we should check type of entryid and then use appropriate compare functions
		return record.phantom || Zarafa.core.EntryId.compareEntryIds(data.entryid, record.get('entryid'));
	},

	/**
	 * Reads all {@link Zarafa.core.data.MAPIRecord records} from the response data from the server.
	 * @param {Object} response The reponse data from the server containing the
	 * {@link Zarafa.core.data.MAPIRecord records}
	 * @param {String} field The fieldname of the array of items in the Response object which
	 * must be converted into {@link Zarafa.core.data.MAPIRecord records}.
	 * @return {Zarafa.core.data.MAPIRecord[]} The {@link Zarafa.core.data.MAPIRecord records}
	 * read from the server response.
	 * @private
	 */
	readRecordsFromResponse : function(response, field)
	{
		var items = response[field] || [];
		if (!Array.isArray(items)) {
			items = [ items ];
		}

		// Item count is the number of items in the server-side store, not the number of items in
		// the returned record list. This is used for pagination. 
		var itemCount = response.page ? response.page.totalrowcount : items.length;

		var o = { count : itemCount };
		// Add 'field' property to response data, this will fix this.getRoot(o) in JSONReader
		o[field] = items;

		// Use the reader to turn the raw JavaScript objects into a set of Ext.data.Record instances.
		return this.reader.readRecords(o);
	}
});
