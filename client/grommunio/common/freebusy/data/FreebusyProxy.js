/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.freebusy.data');

/**
 * @class Grommunio.common.freebusy.data.FreebusyProxy
 * @extends Grommunio.core.data.MAPIProxy
 */
Grommunio.common.freebusy.data.FreebusyProxy = Ext.extend(Grommunio.core.data.MAPIProxy,
{
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			listModuleName: Grommunio.core.ModuleNames.getListName('freebusy')
		});

		Grommunio.common.freebusy.data.FreebusyProxy.superclass.constructor.call(this, config);
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
	 * @return {Object} An instance of the {@link Grommunio.core.data.ProxyResponseHandler ProxyResponseHandler}
	 * which should be used for this request.
	 * @private
	 */
	getResponseHandlerForRequest: function(modulename, serverAction, action, records, parameters, reader, callback, scope, args)
	{
		return new Grommunio.common.freebusy.data.FreebusyResponseHandler({
			proxy: this,
			action: action,
			reader: reader,
			options: args,
			callback: callback,
			scope: scope
		});
	}
});
