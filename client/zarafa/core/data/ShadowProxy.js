Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.ShadowProxy
 * @extends Zarafa.core.data.MAPIProxy
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
Zarafa.core.data.ShadowProxy = Ext.extend(Zarafa.core.data.MAPIProxy, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			listModuleName : Zarafa.core.ModuleNames.getListName('IPM.Note', true),
			itemModuleName : Zarafa.core.ModuleNames.getItemName('IPM.Note', true)
		});

		Zarafa.core.data.ShadowProxy.superclass.constructor.call(this, config);
	},

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
		var objectType;
		var ResponseHandler;

		if (Array.isArray(records)) {
			objectType = records[0].get('object_type');
		} else {
			objectType = records.get('object_type');
		}

		switch (objectType) {
			case Zarafa.core.mapi.ObjectType.MAPI_ABCONT:
			case Zarafa.core.mapi.ObjectType.MAPI_MAILUSER:
			case Zarafa.core.mapi.ObjectType.MAPI_DISTLIST:
				ResponseHandler = Zarafa.addressbook.AddressBookResponseHandler;
				break;
			case Zarafa.core.mapi.ObjectType.MAPI_STORE:
			case Zarafa.core.mapi.ObjectType.MAPI_FOLDER:
				ResponseHandler = Zarafa.hierarchy.data.HierarchyResponseHandler;
				break;
			default:
				ResponseHandler = Zarafa.core.data.IPMResponseHandler;
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
	 * Implementation of {@link Zarafa.core.data.MAPIProxy#getListModuleName} which returns
	 * the listModuleName for the given {@link Zarafa.core.data.IPMRecord record}. If no moduleName
	 * could be detected, it defaults to the configured {@link #listModuleName}.
	 * @param {Zarafa.core.data.IPMRecord} record the record for which the listModuleName is requested
	 * @return {String} the listModuleName
	 * @private
	 */
	getListModuleName : function(record)
	{
		var objectType = record.get('object_type');
		var moduleName;

		switch (objectType) {
			case Zarafa.core.mapi.ObjectType.MAPI_ABCONT:
			case Zarafa.core.mapi.ObjectType.MAPI_MAILUSER:
			case Zarafa.core.mapi.ObjectType.MAPI_DISTLIST:
				moduleName = Zarafa.core.ModuleNames.getListName('addressbook');
				break;
			case Zarafa.core.mapi.ObjectType.MAPI_STORE:
			case Zarafa.core.mapi.ObjectType.MAPI_FOLDER:
				moduleName = Zarafa.core.ModuleNames.getListName('hierarchy');
				break;
			default:
				var messageClass = record.get('message_class');
				if (!Ext.isEmpty(messageClass)) {
					moduleName = Zarafa.core.ModuleNames.getListName(messageClass, true);
				}
				break;
		}

		return moduleName || this.listModuleName;
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
		var objectType = record.get('object_type');
		var moduleName;

		switch (objectType) {
			case Zarafa.core.mapi.ObjectType.MAPI_ABCONT:
			case Zarafa.core.mapi.ObjectType.MAPI_MAILUSER:
			case Zarafa.core.mapi.ObjectType.MAPI_DISTLIST:
				moduleName = Zarafa.core.ModuleNames.getItemName('addressbook');
				break;
			case Zarafa.core.mapi.ObjectType.MAPI_STORE:
			case Zarafa.core.mapi.ObjectType.MAPI_FOLDER:
				moduleName = Zarafa.core.ModuleNames.getListName('hierarchy');
				break;
			default:
				var messageClass = record.get('message_class');
				if (!Ext.isEmpty(messageClass)) {
					moduleName = Zarafa.core.ModuleNames.getItemName(messageClass, true);
				}
				break;
		}

		return moduleName || this.itemModuleName;
	}
});
