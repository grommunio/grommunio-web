Ext.namespace('Grommunio.plugins.mdm.data');

/**
 * @class Grommunio.plugins.mdm.data.MDMDeviceProxy
 * @extends Grommunio.core.data.MAPIProxy
 */
Grommunio.plugins.mdm.data.MDMDeviceProxy = Ext.extend(Grommunio.core.data.MAPIProxy, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};
		Ext.applyIf(config, {
			listModuleName: 'pluginmdmmodule',
			itemModuleName: 'pluginmdmmodule'
		});

		Grommunio.plugins.mdm.data.MDMDeviceProxy.superclass.constructor.call(this, config);
	},

	/**
	 * This will create a {@link Grommunio.core.data.ProxyResponseHandler ProxyResponseHandler} object
	 * which will be used by the {@link Grommunio.core.data.ResponseRouter ResponseRouter} when the
	 * response for the given request has returned.
	 *
	 * @param {String} modulename The modulename which is being accessed with this request
	 * @param {Grommunio.core.Actions} serverAction The action to perform on the server.
	 * @param {Ext.data.Api.action} action name of the action to perform.
	 * @param {Ext.data.Record[]} records list of records to operate on.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @param {Ext.data.DataReader} reader data reader. Converts raw JavaScript objects (in our case) to instances of {@link Ext.data.Record}
	 * @param {Function} callback call back function to call when the request has finished successfully.
	 * @param {Object} scope scope for the call back function.
	 * @param {Object} args arguments object. This will be passed to the call back function on successful read.
	 * @return {Object} An instance of the {@link Grommunio.plugins.mdm.data.MDMDeviceResponseHandler ProxyResponseHandler}
	 * which should be used for this request.
	 * @private
	 */
	getResponseHandlerForRequest: function (modulename, serverAction, action, records, parameters, reader, callback, scope, args)
	{
		return new Grommunio.plugins.mdm.data.MDMDeviceResponseHandler({
			proxy: this,
			action: action,
			reader: reader,
			sendRecords: records,
			options: args,
			callback: callback,
			scope: scope
		});
	}
});
