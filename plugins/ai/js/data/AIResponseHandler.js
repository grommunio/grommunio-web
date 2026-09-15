/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.ai.data');

/**
 * @class Grommunio.plugins.ai.data.AIResponseHandler
 * @extends Grommunio.core.data.AbstractResponseHandler
 *
 * Response handler for non-streaming AI module requests. Routes the server
 * 'success'/'error' feedback to the supplied callbacks.
 */
Grommunio.plugins.ai.data.AIResponseHandler = Ext.extend(Grommunio.core.data.AbstractResponseHandler, {

	/**
	 * @cfg {Function} successCallback Called with (response) on success.
	 */
	successCallback: undefined,

	/**
	 * @cfg {Function} errorCallback Called with (message, response) on error.
	 */
	errorCallback: undefined,

	/**
	 * @cfg {Object} scope Scope for the callbacks.
	 */
	scope: undefined,

	/**
	 * Handle a successful response.
	 * @param {Object} response The response data.
	 */
	doSuccess: function(response)
	{
		if (Ext.isFunction(this.successCallback)) {
			this.successCallback.call(this.scope || this, response || {});
		}
	},

	/**
	 * Handle an error response.
	 * @param {Object} response The response data.
	 */
	doError: function(response)
	{
		var message = _('An unknown error occurred.');
		if (response && response.info && response.info.display_message) {
			message = response.info.display_message;
		}
		if (Ext.isFunction(this.errorCallback)) {
			this.errorCallback.call(this.scope || this, message, response);
		}
	}
});
