/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.data');

/**
 * @class Grommunio.hierarchy.data.HierarchyResponseHandler
 * @extends Grommunio.core.data.ProxyResponseHandler
 */
Grommunio.hierarchy.data.HierarchyResponseHandler = Ext.extend(Grommunio.core.data.ProxyResponseHandler, {
	/**
	 * Handles the list response. Gathers the stores from the response data, converts each entry
	 * into a {@link Grommunio.core.MAPIStore MAPIStore} and pushes them into the collectedItems.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doList: function(response)
	{
		this.receivedRecords = this.readRecordsFromResponse(response, 'item');
	},

	/**
	 * Handles the 'folders' response. Gathers the folders which have been modified
	 * by the request, converts them into {@link Grommunio.hierarchy.data.MAPIFolderRecord Folders},
	 * and pushes them into the collectedItems.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doFolders: function(response)
	{
		this.receivedRecords = this.receivedRecords.concat(this.correlateRecordFromResponse({ item: response }));
	},

	/**
	 * Handles the 'item' response. Gathers the folders which have been modified
	 * by the request, converts them into {@link Grommunio.hierarchy.data.MAPIFolderRecord Folders},
	 * and pushes them into the collectedItems.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doItem: function(response)
	{
		this.receivedRecords = this.receivedRecords.concat(this.correlateRecordFromResponse({ item: response }));
	},

	/**
	 * Handles the 'update' response. This will check if the item in the response is
	 * inside the {@link #sendRecords} and will convert the Response data into the
	 * updated {@link Ext.data.Record record} using {@link #correlateRecordFromResponse},
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} data The response object belonging to the given command.
	 * @return {Boolean} False when action could not be handled successfully. This will
	 * not cancel the transaction itself, but rather causes the 'success' argument for the
	 * {@link #done} function to be false.
	 */
	doUpdate: function(response)
	{
		this.receivedRecords = this.receivedRecords.concat(this.correlateRecordFromResponse({ item: response }));
	},

	/**
	 * Handles the 'ensure' response.
	 * @param {Object} response The response object belonging to the given command.
	 */
	doEnsure: function (response)
	{
		this.receivedRecords = response;
	}
});
