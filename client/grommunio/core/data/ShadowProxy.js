Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.ShadowProxy
 * @extends Grommunio.core.data.MAPIProxy
 *
 * The ShadowProxy is an extension of the {@link Grommunio.core.data.MAPIProxy MAPIProxy}, The
 * {@link Grommunio.core.data.ShadowProxy ShadowProxy} works by dynamically detecting the
 * names for the listmodule and itemmodule by which we are communication with the
 * PHP side. The names are determined based on the {@link Grommunio.core.data.IPMRecords records}
 * which are being send to the server. This implies that the proxy only works while
 * directly working with {@link Grommunio.core.data.IPMRecord records}, as such listing items
 * is not possible. For that purpose the {@link Grommunio.core.data.IPMProxy} must be
 * used with the corresponding list module names.
 */
Grommunio.core.data.ShadowProxy = Ext.extend(Grommunio.core.data.MAPIProxy, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			listModuleName: Grommunio.core.ModuleNames.getListName('IPM.Note', true),
			itemModuleName: Grommunio.core.ModuleNames.getItemName('IPM.Note', true)
		});

		Grommunio.core.data.ShadowProxy.superclass.constructor.call(this, config);
	},

	/**
	 * This will create a {@link Grommunio.core.data.ProxyResponseHandler ProxyResponseHandler} object
	 * which will be used by the {@link Grommunio.core.data.ResponseRouter ResponseRouter} when the
	 * response for the given request has returned.
	 * @param {String} modulename The modulename which is being accessed with this request
	 * @param {Grommunio.core.Actions} serverAction The action to perform on the server.
	 * @param {Ext.data.Api.action} action name of the action to perform.
	 * @param {Ext.data.Record[]} records list of records to operate on.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @param {Ext.data.DataReader} reader data reader. Converts raw JavaScript objects (in our case) to instances of {@link Ext.data.Record}
	 * @param {Function} callback call back function to call when the request has finished successfully.
	 * @param {Object} scope scope for the call back function.
	 * @param {Object} args arguments object. This will be passed to the call back function on successful read.
	 * @return {Object} An instance of the {@link Grommunio.core.data.ProxyResponseHandler ProxyResponseHandler}
	 * which should be used for this request.
	 * @private
	 */
	getResponseHandlerForRequest: function(modulename, serverAction, action, records, parameters, reader, callback, scope, args)
	{
		var objectType;
		var ResponseHandler;

		if (Array.isArray(records)) {
			objectType = records[0].get('object_type');
		} else {
			objectType = records.get('object_type');
		}

		switch (objectType) {
			case Grommunio.core.mapi.ObjectType.MAPI_ABCONT:
			case Grommunio.core.mapi.ObjectType.MAPI_MAILUSER:
			case Grommunio.core.mapi.ObjectType.MAPI_DISTLIST:
				ResponseHandler = Grommunio.addressbook.AddressBookResponseHandler;
				break;
			case Grommunio.core.mapi.ObjectType.MAPI_STORE:
			case Grommunio.core.mapi.ObjectType.MAPI_FOLDER:
				ResponseHandler = Grommunio.hierarchy.data.HierarchyResponseHandler;
				break;
			default:
				ResponseHandler = Grommunio.core.data.IPMResponseHandler;
				break;
		}

		return new ResponseHandler({
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
	 * Implementation of {@link Grommunio.core.data.MAPIProxy#getListModuleName} which returns
	 * the listModuleName for the given {@link Grommunio.core.data.IPMRecord record}. If no moduleName
	 * could be detected, it defaults to the configured {@link #listModuleName}.
	 * @param {Grommunio.core.data.IPMRecord} record the record for which the listModuleName is requested
	 * @return {String} the listModuleName
	 * @private
	 */
	getListModuleName: function(record)
	{
		var objectType = record.get('object_type');
		var moduleName;

		switch (objectType) {
			case Grommunio.core.mapi.ObjectType.MAPI_ABCONT:
			case Grommunio.core.mapi.ObjectType.MAPI_MAILUSER:
			case Grommunio.core.mapi.ObjectType.MAPI_DISTLIST:
				moduleName = Grommunio.core.ModuleNames.getListName('addressbook');
				break;
			case Grommunio.core.mapi.ObjectType.MAPI_STORE:
			case Grommunio.core.mapi.ObjectType.MAPI_FOLDER:
				moduleName = Grommunio.core.ModuleNames.getListName('hierarchy');
				break;
			default:
				var messageClass = record.get('message_class');
				if (!Ext.isEmpty(messageClass)) {
					moduleName = Grommunio.core.ModuleNames.getListName(messageClass, true);
				}
				break;
		}

		return moduleName || this.listModuleName;
	},

	/**
	 * Implementation of {@link Grommunio.core.data.MAPIProxy#getItemModuleName} which returns
	 * the itemModuleName for the given {@link Grommunio.core.data.IPMRecord record}. If no moduleName
	 * could be detected, it defaults to the configured {@link #itemModuleName}.
	 * @param {Grommunio.core.data.IPMRecord} record the record for which the itemModuleName is requested
	 * @return {String} the itemModuleName
	 * @private
	 */
	getItemModuleName: function(record)
	{
		var objectType = record.get('object_type');
		var moduleName;

		switch (objectType) {
			case Grommunio.core.mapi.ObjectType.MAPI_ABCONT:
			case Grommunio.core.mapi.ObjectType.MAPI_MAILUSER:
			case Grommunio.core.mapi.ObjectType.MAPI_DISTLIST:
				moduleName = Grommunio.core.ModuleNames.getItemName('addressbook');
				break;
			case Grommunio.core.mapi.ObjectType.MAPI_STORE:
			case Grommunio.core.mapi.ObjectType.MAPI_FOLDER:
				moduleName = Grommunio.core.ModuleNames.getListName('hierarchy');
				break;
			default:
				var messageClass = record.get('message_class');
				if (!Ext.isEmpty(messageClass)) {
					moduleName = Grommunio.core.ModuleNames.getItemName(messageClass, true);
				}
				break;
		}

		return moduleName || this.itemModuleName;
	}
});
