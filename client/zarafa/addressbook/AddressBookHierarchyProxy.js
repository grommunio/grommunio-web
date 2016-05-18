Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.AddressBookHierarchyProxy
 * @extends Zarafa.core.data.IPMProxy
 * 
 * proxy object which will communicate between store and server side code
 */
Zarafa.addressbook.AddressBookHierarchyProxy = Ext.extend(Zarafa.core.data.IPMProxy, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		var module = Zarafa.core.ModuleNames.getModule('addressbook');

		Ext.applyIf(config, {
			listModuleName : module.list,
			itemModuleName : module.item
		});

		Zarafa.addressbook.AddressBookHierarchyProxy.superclass.constructor.call(this, config);
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
	getResponseHandlerForRequest : function(modulename, serverAction, action, records, parameters, reader, callback, scope, args)
	{
		return new Zarafa.addressbook.AddressBookResponseHandler({
			proxy: this,
			action: action,
			reader: reader,
			options: args,
			callback: callback,
			scope: scope
		});
	}
});
