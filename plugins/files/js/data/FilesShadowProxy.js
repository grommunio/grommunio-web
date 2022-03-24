Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.FilesShadowProxy
 * @extends Zarafa.core.data.ShadowProxy
 *
 * The ShadowProxy is an extension of the {@link Zarafa.core.data.MAPIProxy MAPIProxy}, The
 * {@link Zarafa.core.data.ShadowProxy ShadowProxy} works by dynamically detecting the
 * names for the listmodule and itemmodule by which we are communication with the
 * PHP side. The names are determined based on the {@link Zarafa.core.data.IPMRecords records}
 * which are being send to the server. This implies that the proxy only works while
 * directly working with {@link Zarafa.core.data.IPMRecord records}, as such listing items
 * is not possible. For that purpose the {@link Zarafa.core.data.IPMProxy} must be
 * used with the corresponding list module names.
 */
Zarafa.plugins.files.data.FilesShadowProxy = Ext.extend(Zarafa.core.data.ShadowProxy, {

	/**
	 * This will create a {@link Zarafa.core.data.ProxyResponseHandler ProxyResponseHandler} object
	 * which will be used by the {@link Zarafa.core.data.ResponseRouter ResponseRouter} when the
	 * response for the given request has returned.
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
		return new Zarafa.plugins.files.data.FilesFolderResponseHandler({
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
	 * Implementation of {@link Zarafa.core.data.MAPIProxy#getListModuleName} which returns
	 * the listModuleName for the given {@link Zarafa.core.data.IPMRecord record}. If no moduleName
	 * could be detected, it defaults to the configured {@link #listModuleName}.
	 * @param {Zarafa.core.data.IPMRecord} record the record for which the listModuleName is requested
	 * @return {String} the listModuleName
	 * @private
	 */
	getListModuleName : function(record)
	{
		return "hierarchylistmodule";
	},

	/**
	 * Implementation of {@link Zarafa.core.data.MAPIProxy#getItemModuleName} which returns
	 * the itemModuleName for the given {@link Zarafa.core.data.IPMRecord record}. If no moduleName
	 * could be detected, it defaults to the configured {@link #itemModuleName}.
	 * @param {Zarafa.core.data.IPMRecord} record the record for which the itemModuleName is requested
	 * @return {String} the itemModuleName
	 * @private
	 */
	getItemModuleName : function(record)
	{
		return "hierarchylistmodule";
	}

});