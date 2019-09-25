Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.common.rulesdata.RulesProxy
 * @extends Zarafa.core.data.IPMProxy
 * 
 * A special proxy which handles rules, the rules are send slightly different to the
 * server then normal records, instead of creating 1 request per record being saved,
 * we will send all records in a single request so the server can really save
 * them as a batch.
 */
Zarafa.common.rules.data.RulesProxy = Ext.extend(Zarafa.core.data.IPMProxy, {
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
		return new Zarafa.common.rules.data.RulesResponseHandler({
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
		// Force the listmodule action, as we will edit all rules
		// in complete batches.
		Ext.applyIf(args, {
			listRequest : true
		});

		var store = parameters.jsonData.store;
		// Unwrap the serialized data and pass it as paramters directly
		parameters = parameters.jsonData[reader.meta.root];

		// When no records are sent, add the store id.
		if (Ext.isEmpty(records)) {
			parameters = {store: store};
		}

		Zarafa.common.rules.data.RulesProxy.superclass.createUpdateAction.apply(this, arguments);
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
		// Force the listmodule action, as we will edit all rules
		// in complete batches.
		Ext.applyIf(args, {
			listRequest : true
		});
		// Unwrap the serialized data and pass it as paramters directly
		parameters = parameters.jsonData[reader.meta.root];

		Zarafa.common.rules.data.RulesProxy.superclass.destroyAction.apply(this, arguments);
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
		// Force the listmodule action, as we will edit all rules
		// in complete batches.
		Ext.applyIf(args, {
			listRequest : true
		});
		// Unwrap the serialized data and pass it as paramters directly
		parameters = parameters.jsonData[reader.meta.root];

		Zarafa.common.rules.data.RulesProxy.superclass.openAction.apply(this, arguments);
	}
});
