/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.reminder.data');
/**
 * @class Grommunio.common.reminder.data.ReminderProxy
 * @extends Grommunio.core.data.MAPIProxy
 */
Grommunio.common.reminder.data.ReminderProxy = Ext.extend(Grommunio.core.data.MAPIProxy, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var module = Grommunio.core.ModuleNames.getModule('reminder');

		Ext.applyIf(config, {
			listModuleName: module.list,
			itemModuleName: module.item
		});

		Grommunio.common.reminder.data.ReminderProxy.superclass.constructor.call(this, config);
	},

	/**
	 * This will create a {@linkGrommunio.core.data.IPMResponseHandler IPMResponseHandler} object
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
	 * @return {Object} An instance of the {@link Grommunio.core.data.IPMResponseHandler IPMResponseHandler}
	 * which should be used for this request.
	 * @private
	 */
	getResponseHandlerForRequest: function(modulename, serverAction, action, records, parameters, reader, callback, scope, args)
	{
		return new Grommunio.core.data.IPMResponseHandler({
			proxy: this,
			action: action,
			reader: reader,
			options: args,
			callback: callback,
			scope: scope
		});
	}
});
