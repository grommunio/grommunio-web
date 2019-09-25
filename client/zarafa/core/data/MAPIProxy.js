Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.MAPIProxy
 * @extends Ext.data.DataProxy
 */
Zarafa.core.data.MAPIProxy = Ext.extend(Ext.data.DataProxy, {
	/**
	 * @cfg {String} listModuleName Name of the listModule on the server.
	 */
	listModuleName : undefined,
	/**
	 * @cfg {String} itemModuleName Name of the itemModule on the server.
	 */
	itemModuleName : undefined,

	/**
	 * Currently active requests for {@link Zarafa.core.data.MAPIProxy MAPIProxy} mapped by the
	 * action type used in requests, {@link Zarafa.core.data.MAPIProxy MAPIProxy} can use this
	 * active request data to abort any previous request and start a new request.
	 * @property
	 * @type Object
	 * @private
	 */
	activeRequestMapping : undefined,

	/**
	 * The {@link Date#getTime timestamps} for the last time a response was received for
	 * a given {@link Zarafa.core.Actions action}.
	 * @property
	 * @type Object
	 * @private
	 */
	lastResponseTime : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
		Zarafa.core.data.MAPIProxy.superclass.constructor.call(this, config);

		this.activeRequestMapping = {};
		this.lastResponseTime = {};
	},

	/**
	 * Check if the given action has registered requestIds in the {@link #activeRequestMapping}.
	 * When this is the case, the action is considered to be active. When no action is passed,
	 * this function will check if there are any requestsIds pending for any action.
	 *
	 * @param {Zarafa.core.Action} action The action which is to be checked.
	 * @return {Boolean} True if the given action has registered requestIds.
	 */
	isExecuting : function(action)
	{
		if (Ext.isEmpty(action)) {
			return !Ext.isEmpty(Object.keys(this.activeRequestMapping));
		} else {
			return !Ext.isEmpty(this.activeRequestMapping[action]);
		}
	},

	/**
	 * Register a requestId to a particular action. This will update {@link activeRequestMapping}
	 * to contain the requestId for the given action. By this registration it is possible to
	 * track all current outstanding requests, and it is possible to cancel them using {@link #cancelRequests}.
	 * @param {Zarafa.core.Actions} action The action for which this request id was generated
	 * @param {String} requestId The unique id which was given to the request
	 */
	addRequestId : function(action, requestId)
	{
		if (!Ext.isDefined(this.activeRequestMapping[action])) {
			this.activeRequestMapping[action] = [ requestId ];
		} else {
			this.activeRequestMapping[action].push(requestId);
		}
	},

	/**
	 * Remove a requestId from a particular action. This will update {@link activeRequestMapping}
	 * to remove the requestId from the given action.
	 * @param {Zarafa.core.Actions} requestId The unique id which was given to the request.
	 */
	deleteRequestId : function(requestId)
	{
		for (var key in this.activeRequestMapping) {
			if (Array.isArray(this.activeRequestMapping[key])) {
				this.activeRequestMapping[key].remove(requestId);
				if (Ext.isEmpty(this.activeRequestMapping[key])) {
					delete this.activeRequestMapping[key];
				}
			}
		}
	},

	/**
	 * Cancel all requests made by this proxy for a particular action.
	 * This will call {@link Zarafa.core.Request#cancelActiveRequest} to cancel
	 * the response handling of all requests which were send out by this proxy for
	 * the given action.
	 * @param {Zarafa.core.Actions} action The action
	 * @protected
	 */
	cancelRequests : function(action)
	{
		if (this.activeRequestMapping[action]) {
			var requests = this.activeRequestMapping[action];

			for (var i = 0, len = requests.length; i < len; i++) {
				container.getRequest().cancelActiveRequest(requests[i]);
			}

			delete this.activeRequestMapping[action];
		}
	},

	/**
	 * Update the {@link #lastResponseTime} with the {@link Date#getTime timestamp}
	 * of when the response for the given action was received.
	 * @param {Zarafa.core.Actions} action The action
	 * @param {Number} timestamp The timestamp
	 */
	updateExecutionTimestamp : function(action, timestamp)
	{
		this.lastResponseTime[action] = timestamp;
	},

	/**
	 * Obtain the {@link Date#getTime timestamp} of the last time
	 * the given {@link #updateExecutionTimestamp action was executed}.
	 * It will mark the time of when the action was completed (because the
	 * response was returned from the server).
	 * @param {Zarafa.core.Actions} action The action
	 * @return {Number} The timestamp of the last action
	 */
	lastExecutionTime : function(action)
	{
		return this.lastResponseTime[action] || 0;
	},

	/**
	 * Obtain the name of the listModule for communication with PHP.
	 * @param {Zarafa.core.data.MAPIRecord} record the record for which the listModuleName is requested
	 * @return {String} The name of the listModule.
	 * @private
	 */
	getListModuleName : function(record)
	{
		return this.listModuleName;
	},

	/**
	 * Obtain the name of the itemModule for communication with PHP.
	 * @param {Zarafa.core.data.MAPIRecord} record the record for which the itemModuleName is requested
	 * @return {String} The name of the itemModule.
	 * @private
	 */
	getItemModuleName : function(record)
	{
		return this.itemModuleName;
	},

	/**
	 * This will create a {@link Zarafa.core.data.ProxyResponseHandler ProxyResponseHandler} object
	 * which will be used by the {@link Zarafa.core.data.ResponseRouter ResponseRouter} when the
	 * response for the given request has returned.
	 *
	 * @param {String} modulename The modulename which is being accessed with this request
	 * @param {Zarafa.core.Actions} serverAction The action to perform on the server.
	 * @param {Ext.data.Api.action} action name of the action to perform.
	 * @param {Ext.data.Record[]} records list of records to operate on.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @param {Ext.data.DataReader} reader data reader. Converts raw JavaScript objects (in our case) to instances of {@link Ext.data.Record}
	 * @param {Function} callback call back function to call when the request has finished successfully.
	 * @param {Object} scope scope for the call back function.
	 * @param {Object} args arguments object. This will be passed to the call back function on successful read.
	 * @return {Object} An instance of the {@link Zarafa.core.data.ProxyResponseHandler ProxyResponseHandler}
	 * which should be used for this request.
	 * @private
	 */
	getResponseHandlerForRequest : Ext.emptyFn,

	/**
	 * Performs a request for a store. This single entry point carries out all CRUD requests. 
	 * @param {Ext.data.Api.action} action name of the action to perform. One of 'create', 'destroy', 'update', and 'read'.
	 * @param {Ext.data.Record[]} records list of records to operate on. In case of 'read' this will be ignored.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @param {Ext.data.DataReader} reader data reader. Converts raw JavaScript objects (in our case) to instances of {@link Ext.data.Record}
	 * @param {Function} callback call back function to call when the request has finished successfully.
	 * @param {Object} scope scope for the call back function.
	 * @param {Object} args arguments object. This will be passed to the call back function on successful read.
	 */
	request : function(action, records, parameters, reader, callback, scope, args)
	{
		switch (action)
		{
			case 'update':
			case 'create':
				this.createUpdateAction(action, records, parameters, reader, callback, scope, args);
				break;
			case 'destroy':
				this.destroyAction(action, records, parameters, reader, callback, scope, args);
				break;
			case 'read':
				this.readAction(action, records, parameters, reader, callback, scope, args);
				break;
			case 'open':
				this.openAction(action, records, parameters, reader, callback, scope, args);
				break;
			case 'import':
				this.importAction(action, records, parameters, reader, callback, scope, args);
				break;
		}
	},
	
	/**
	 * @param {Ext.data.Api.action} action name of the action to perform. Either 'create' or 'update'.
	 * @param {Ext.data.Record[]} records list of records to operate on.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @param {Ext.data.DataReader} reader data reader. Converts raw JavaScript objects (in our case) to instances of {@link Ext.data.Record}
	 * @param {Function} callback call back function to call when the request has finished successfully.
	 * @param {Object} scope scope for the call back function.
	 * @param {Object} args arguments object. This will be passed to the call back function on successful read.
	 * @private
	 */
	createUpdateAction : function(action, records, parameters, reader, callback, scope, args)
	{
		this.doRequests(args.actionType || Zarafa.core.Actions['save'], action, records, parameters, reader, callback, scope, args);
	},

	/**
	 * Performs a destroy action on one or more records.
	 * @param {Ext.data.Api.action} action name of the action to perform. Always 'destroy'.
	 * @param {Ext.data.Record[]} records list of records to operate on.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @param {Ext.data.DataReader} reader data reader. Converts raw JavaScript objects (in our case) to instances of {@link Ext.data.Record}
	 * @param {Function} callback call back function to call when the request has finished successfully.
	 * @param {Object} scope scope for the call back function.
	 * @param {Object} args arguments object. This will be passed to the call back function on successful read.
	 * @private
	 */
	destroyAction : function(action, records, parameters, reader, callback, scope, args)
	{
		this.doRequests(args.actionType || Zarafa.core.Actions['delete'], action, records, parameters, reader, callback, scope, args);
	},
	
	/**
	 * Performs a read action on one or more records.
	 * @param {Ext.data.Api.action} action name of the action to perform. Always 'open'.
	 * @param {Ext.data.Record[]} records list of records to operate on.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @param {Ext.data.DataReader} reader data reader. Converts raw JavaScript objects (in our case) to instances of {@link Ext.data.Record}
	 * @param {Function} callback call back function to call when the request has finished successfully.
	 * @param {Object} scope scope for the call back function.
	 * @param {Object} args arguments object. This will be passed to the call back function on successful read.
	 * @private
	 */
	openAction : function(action, records, parameters, reader, callback, scope, args)
	{
		this.doRequests(args.actionType || Zarafa.core.Actions['open'], action, records, parameters, reader, callback, scope, args);
	},

	/**
	 * Performs an import action on one or more records.
	 * @param {Ext.data.Api.action} action name of the action to perform. Always 'import'.
	 * @param {Ext.data.Record[]} records list of records to operate on.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @param {Ext.data.DataReader} reader data reader. Converts raw JavaScript objects (in our case) to instances of {@link Ext.data.Record}
	 * @param {Function} callback call back function to call when the request has finished successfully.
	 * @param {Object} scope scope for the call back function.
	 * @param {Object} args arguments object. This will be passed to the call back function on successful read.
	 * @private
	 */
	importAction : function(action, records, parameters, reader, callback, scope, args)
	{
		this.doRequests(args.actionType || Zarafa.core.Actions['import'], action, records, parameters, reader, callback, scope, args);
	},

	/**
	 * Performs a read action on a Folder/Store to load all records.
	 * @param {Ext.data.Api.action} action name of the action to perform. Always 'read'.
	 * @param {Ext.data.Record[]} records list of records to operate on. In case of 'read' this will be ignored.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @param {Ext.data.DataReader} reader data reader. Converts raw JavaScript objects (in our case) to instances of{@link Ext.data.Record}
	 * @param {Function} callback call back function to call when the request has finished successfully.
	 * @param {Object} scope scope for the call back function.
	 * @param {Object} args arguments object. This will be passed to the call back function on successful read.
	 * @private
	 */
	readAction : function(action, records, parameters, reader, callback, scope, args)
	{
		this.doRequests(args.actionType || Zarafa.core.Actions['list'], action, records, parameters, reader, callback, scope, args);
	},

	/**
	 * Initialize the the {@link Zarafa.core.Request request} structure. The initial
	 * {@link Zarafa.core.Request request} will be reset and new requests will be added
	 * for each individual {@link Zarafa.core.date.MAPIRecord record} which was provided.
	 * @param {Zarafa.core.Actions} serverAction The action to perform on the server.
	 * @param {Ext.data.Api.action} action name of the action to perform.
	 * @param {Ext.data.Record[]} records list of records to operate on.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @param {Ext.data.DataReader} reader data reader. Converts raw JavaScript objects (in our case) to instances of {@link Ext.data.Record}
	 * @param {Function} callback call back function to call when the request has finished successfully.
	 * @param {Object} scope scope for the call back function.
	 * @param {Object} args arguments object. This will be passed to the call back function on successful read.
	 * @private
	 */
	doRequests : function(serverAction, action, records, parameters, reader, callback, scope, args)
	{
		// Check if the previous request needs to be cancelled.
		if (args.cancelPreviousRequest === true) {
			this.cancelRequests(serverAction);
		}

		// reset the request object, starts a new composite request 
		container.getRequest().reset();

		// If records are provided, we must perform a 'itemmodule' action on each of the given records
		if (records && args.listRequest !== true) {
			var items = parameters.jsonData[reader.meta.root];

			// Force the records object to be an array
			if (!Array.isArray(records)) {
				records = [ records ];
			}

			// Force the serialized data to be an array
			if (!Array.isArray(items)) {
				items = [ items ];
			}

			for (var i = 0; i < records.length; i++) {
				var record = records[i];
				var data = items[i];
				var module = this.getItemModuleName(record);
				var handler = this.getResponseHandlerForRequest(module, serverAction, action, record, parameters, reader, callback, scope, args);

				// Add the request
				var requestId = container.getRequest().addRequest(module, serverAction, data, handler);

				// store reference of transaction id to active request mapping
				this.addRequestId(serverAction, requestId); 
			}
		} else {
			// No records were provided, we must perform a 'listmodule' action
			var module = this.getListModuleName(records);
			var handler = this.getResponseHandlerForRequest(module, serverAction, action, records, parameters, reader, callback, scope, args);

			// Add the request
			var requestId = container.getRequest().addRequest(module, serverAction, parameters, handler);

			// store reference of transaction id to active request mapping
			this.addRequestId(serverAction, requestId); 
		}

		// send out the request
		container.getRequest().send();
	}
});
