/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.IPMExpandDistlistResponseHandler
 * @extends Grommunio.core.data.ProxyResponseHandler
 */
Grommunio.core.data.IPMExpandDistlistResponseHandler = Ext.extend(Grommunio.core.data.ProxyResponseHandler, {
	/**
	 * Handles the 'expand' response. Gathers the expanded recipient(s) information from the
	 * response data, this will simply check the 'results' field in the response
	 * and pushes them into the {@link #receivedRecords records list}.
	 * @param {Object} data The response object belonging to the given command.
	 */
	doExpand: function(response) {
		var results = response.results || [];

		// Force results to be an array.
		if (!Array.isArray(results)) {
			results = [ results ];
		}

		var recipientData = this.reader.readRecords({
			result: results
		});

		this.receivedRecords = recipientData.records;
	}
});
