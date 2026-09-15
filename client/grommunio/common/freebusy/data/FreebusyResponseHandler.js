/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.freebusy.data');

/**
 * @class Grommunio.common.freebusy.data.FreebusyResponseHandler
 * @extends Grommunio.core.data.ProxyResponseHandler
 *
 * Small extension to the main {@link Grommunio.core.data.ProxyResponseHandler ProxyResponseHandler},
 * to add support for the special {@link #doList 'list'} action for Freebusy blocks.
 */
Grommunio.common.freebusy.data.FreebusyResponseHandler = Ext.extend(Grommunio.core.data.ProxyResponseHandler, {
	/**
	 * Handles the 'list' response. Gathers the records from the response data,
	 * converts each entry into a records and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function.
	 */
	doList: function(response)
	{
		var items = [];
		Ext.each(response.users, function(userData) {
			Ext.each(userData.items, function(userItem) {
				items.push(Ext.applyIf(userItem, {
					userid: userData.userid
				}));
			});
		});

		this.receivedRecords = this.reader.readRecords({
			count: items.length,
			item: items
		});
	}
});
