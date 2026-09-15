/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.passwd.data');

/**
 * @class Grommunio.plugins.passwd.data.ResponseHandler
 * @extends Grommunio.core.data.AbstractResponseHandler
 *
 * Passwd plugin specific response handler.
 */
Grommunio.plugins.passwd.data.PasswdResponseHandler = Ext.extend(Grommunio.core.data.AbstractResponseHandler, {

	/**
	 * @cfg {Function} callbackFn The function which will be called after success/failure response.
	 */
	callbackFn : undefined,

	/**
	 * @cfg {Object} scope The function scope that will be used when calling {@link #callbackFn}.
	 */
	scope : undefined,

	/**
	 * In case exception happened on server, server will return exception response with the display message.
	 * @param {Object} response Object contained the response data.
	 */
	doError : function(response)
	{
		var displayMessage = _('An unknown error occurred while changing password.');

		if(response.info) {
			displayMessage = response.info.display_message;
		}

		container.getNotifier().notify('error.passwd', _('Error'), Ext.util.Format.htmlEncode(displayMessage));

		this.callbackFn.apply(this.scope || this, [ false, response ]);
	},

	/**
	 * When password change is successful server will send a success response including display message.
	 * @param {Object} response Object contained the response data.
	 */
	doSuccess : function(response)
	{
		var displayMessage = _('Password is changed successfully.');

		if(response.info) {
			displayMessage = response.info.display_message;
		}

		container.getNotifier().notify('info.passwd', _('Success'), Ext.util.Format.htmlEncode(displayMessage));

		this.callbackFn.apply(this.scope || this, [ true, response ]);
	}
});
