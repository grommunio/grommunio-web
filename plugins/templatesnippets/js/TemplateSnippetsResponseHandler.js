/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.templatesnippets');

/**
 * @class Grommunio.plugins.templatesnippets.TemplateSnippetsResponseHandler
 * @extends Grommunio.core.data.AbstractResponseHandler
 *
 * Response handler for system template CRUD operations (admin only).
 */
Grommunio.plugins.templatesnippets.TemplateSnippetsResponseHandler = Ext.extend(Grommunio.core.data.AbstractResponseHandler, {

	/**
	 * @cfg {Function} successCallback Called on success with (response).
	 */
	successCallback: undefined,

	/**
	 * @cfg {Object} scope Scope for callbacks.
	 */
	scope: undefined,

	/**
	 * Handle error response from the server.
	 * @param {Object} response The response data
	 */
	doError: function(response) {
		var msg = _('An unknown error occurred.');
		if (response && response.info && response.info.display_message) {
			msg = response.info.display_message;
		}
		container.getNotifier().notify('error.templatesnippets', _('Error'), Ext.util.Format.htmlEncode(msg));
	},

	/**
	 * Handle success response (after save or delete).
	 * @param {Object} response The response data
	 */
	doSuccess: function(response) {
		if (Ext.isFunction(this.successCallback)) {
			this.successCallback.call(this.scope || this, response);
		}
	}
});
