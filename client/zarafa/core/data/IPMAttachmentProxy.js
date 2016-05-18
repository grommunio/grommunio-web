Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMAttachmentProxy
 * @extends Zarafa.core.data.MAPIProxy
 *
 * Special Proxy for the {@link Zarafa.core.data.IPMAttachmentStore Attachment Store}.
 */
Zarafa.core.data.IPMAttachmentProxy = Ext.extend(Zarafa.core.data.MAPIProxy, {
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
	getResponseHandlerForRequest : function(modulename, serverAction, action, records, parameters, reader, callback, scope, args)
	{
		return new Zarafa.core.data.IPMAttachmentResponseHandler({
			proxy: this,
			action: action,
			reader: reader,
			sendRecords: records,
			options: args,
			callback: callback,
			scope: scope
		});
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
		this.doRequests(args.actionType || Zarafa.core.Actions['upload'], action, records, parameters, reader, callback, scope, args);
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
		var request = container.getRequest();

		var record = records;
		if (Ext.isArray(records)) {
			record = records[0];
		}

		// Just initialize based on a single record
		var module = this.getItemModuleName(record);
		var handler = this.getResponseHandlerForRequest(module, serverAction, action, records, parameters, reader, callback, scope, args);

		if (Zarafa.supportsFilesAPI()) {
			var data = new FormData();

			// Convert the parameters into FormData
			for (var key in parameters) {
				var value = parameters[key];
				if (Ext.isArray(value) || value instanceof FileList) {
					for (var i = 0, len = value.length; i < len; i++) {
						data.append(key + '[]', value[i]);
					}
				} else {
					data.append(key, value);
				}
			}

			request.reset();
			var requestId = request.addDataRequest(module, serverAction, data, handler);

			// Add the module and moduleid to the url
			var requestUrl = args.requestUrl;
			requestUrl = Ext.urlAppend(requestUrl, 'module=' + module);
			requestUrl = Ext.urlAppend(requestUrl, 'moduleid=' + requestId);

			request.send(requestUrl, {});
		} else {
			var requestId = container.getRequest().getRequestId(module);
			container.getResponseRouter().addRequestResponseHandler(requestId, handler);

			// We don't send an actual request to the server, but we create
			// a fake object, so we can use that for the Response Router later.
			var formRequest = { 'zarafa' : {} };
			formRequest['zarafa'][module] = {};
			formRequest['zarafa'][module][requestId] = parameters;

			// If no requestForm was provided, we instantiate one ourselves,
			// which will be automatically destroyed after we received the
			// response from the server.
			if (!args.requestForm) {
				args.autoDestroyRequestForm = true;
				args.requestForm = new Ext.form.FormPanel({
					renderTo : Ext.getBody(),
					fileUpload : true,
					cls : 'x-hidden'
				}).getForm();
			}

			// Add the module and moduleid to the url
			var requestUrl = args.requestUrl;
			requestUrl = Ext.urlAppend(requestUrl, 'module=' + module);
			requestUrl = Ext.urlAppend(requestUrl, 'moduleid=' + requestId);

			args.requestForm.submit({
				url : requestUrl,
				request : formRequest,
				destroyForm : args.autoDestroyRequestForm === true,
				params : parameters,
				failure : this.onLegacyFailure,
				success : this.onLegacySuccess,
				scope : this
			});
		}
	},

	/**
	 * Success Completion handler for the {@link #uploadLegacyFiles uploading of files} for older browsers.
	 * This will check if a valid response was returned by the server, and send it to the
	 * {@link Zarafa.core.ResponseRouter Response Router}.
	 * @param {Ext.form.BasicForm} form The form which fired the event
	 * @param {Object} action The action object containing the information about the request
	 * @private
	 */
	onLegacySuccess : function(form, action)
	{
		if (!Ext.isEmpty(action.result) && !Ext.isEmpty(action.result.zarafa)) {
			container.getResponseRouter().receive(action.result);
			this.onLegacyPostProcessAction(form, action);
		} else {
			this.onLegacyFailure(form, action);
		}
	},

	/**
	 * Failure Completion handler for the {@link #uploadLegacyFiles uploading of files} for older browsers.
	 * This will check if a valid response was returned by the server, and send it to the
	 * {@link Zarafa.core.ResponseRouter Response Router}.
	 * @param {Ext.form.BasicForm} form The form which fired the event
	 * @param {Object} action The action object containing the information about the request
	 * @private
	 */
	onLegacyFailure : function(form, action)
	{
		// Pretend the HTTP response was 200, as we don't know what the exact reason for
		// the failure is. And this will trigger a generic error message for the user.
		action.response.status = 200;

		// We can't provide correct information to the Response Router,
		// but we can fill in as much as possible to at least ensure the
		// Response Handler will be unregistered.
		container.getResponseRouter().receiveFailure(action.options.request, action.response);
		this.onLegacyPostProcessAction(form, action);
	},

	/**
	 * Post processing of the action object after {@link #onLegacySuccess} and {@link #onLegacyFailure}.
	 * This will check if the form which was used to submit data to the server must automatically be
	 * destroyed or not.
	 * @param {Ext.form.BasicForm} form The form which fired the event
	 * @param {Object} action The action object containing the information about the request
	 * @private
	 */
	onLegacyPostProcessAction : function(form, action)
	{
		// Check if the form must be destroyed
		if (action.options.destroyForm) {
			var panel = form.el.parent('.x-panel');
			if (panel) {
				panel = Ext.ComponentMgr.get(panel.id);
				if (panel) {
					panel.destroy();
				}
			}
		}
	}
});
