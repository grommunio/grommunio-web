/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.rules.data');

/**
 * @class Grommunio.common.rules.data.RulesResponseHandler
 * @extends Grommunio.core.data.IPMResponseHandler
 */
Grommunio.common.rules.data.RulesResponseHandler = Ext.extend(Grommunio.core.data.IPMResponseHandler, {
	/**
	 * Reads all {@link Grommunio.core.data.MAPIRecord records} from the response data from the server,
	 * and correlates them to the {@link #sendRecords} list.
	 * @param {Object} response The response data from the server containing the
	 * {@link Grommunio.core.data.MAPIRecord records}
	 * @private
	 */
	correlateRecordFromResponse: function(response)
	{
		var responseObj = this.reader.readResponse(Ext.data.Api.actions.read, response);
		var records = [];

		// We expect as many rules back, as we send to the server,
		// so no need to correlate anything. We will allow everything
		// to be overridden.
		if (!Ext.isEmpty(responseObj.data) && !Ext.isEmpty(this.sendRecords)) {
			records = responseObj.data.clone();
		}
		return records;
	}
});
