/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.data');

/**
 * @class Grommunio.mail.data.ConversationItemsResponseHandler
 * @extends Grommunio.core.data.AbstractResponseHandler
 *
 * Handles the response of the 'conversationitems' action of the maillistmodule,
 * which supplies the Sent Items messages that belong to a conversation. The
 * received items are handed to the {@link Grommunio.mail.MailStore store} that
 * requested them.
 */
Grommunio.mail.data.ConversationItemsResponseHandler = Ext.extend(Grommunio.core.data.AbstractResponseHandler, {
	/**
	 * @cfg {Grommunio.mail.MailStore} store The store that requested the conversation items
	 * and into which the received items must be merged.
	 */
	store: undefined,

	/**
	 * @cfg {Function} callback Alternative to {@link #store}: called with the
	 * 'conversationitems' response.
	 */
	callback: undefined,

	/**
	 * Handles the 'conversationitems' response.
	 * @param {Object} response The response object belonging to the given command.
	 */
	doConversationitems: function(response)
	{
		if (Ext.isFunction(this.callback)) {
			this.callback(response);
		} else if (this.store) {
			this.store.onConversationItemsResponse(response);
		}
	},

	/**
	 * @cfg {String[]} queriedIds The conversation ids that were queried with
	 * the 'conversationcounts' request this handler belongs to.
	 */
	queriedIds: undefined,

	/**
	 * Handles the 'conversationcounts' response.
	 * @param {Object} response The response object belonging to the given command.
	 */
	doConversationcounts: function(response)
	{
		if (this.store) {
			this.store.onConversationCountsResponse(response, this.queriedIds);
		}
	}
});
