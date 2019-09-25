Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMRecipientResolveProxy
 * @extends Zarafa.core.data.MAPIProxy
 * 
 * The IPMProxy communicates directly with a ListModule on server. It supports listing items, 
 * pagination, etc, and is supposed to work in conjunction with a list store and JSON reader.
 * <p>
 * Each instance of IPMProxy corresponds to a single MAPI folder and needs to be created with
 * a MAPI store id and a MAPI folder id.
 */
Zarafa.core.data.IPMRecipientResolveProxy = Ext.extend(Zarafa.core.data.MAPIProxy, {
	/**
	 * @cfg {String} listModuleName Name of the listModule on the server.
	 */
	listModuleName : 'resolvenamesmodule',

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

		return new Zarafa.core.data.IPMRecipientResolveResponseHandler({
			proxy: this,
			action: Ext.data.Api.actions['read'],
			reader: reader,
			sendRecords: records,
			options: args,
			callback: callback,
			scope: scope
		});
	},

	/**
	 * Performs a request for a store. This will direct the checknames action to the readAction method.
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
			case Zarafa.core.Actions['checknames']:
				this.readAction(action, records, parameters, reader, callback, scope, args);
				break;
		}
	}
});
