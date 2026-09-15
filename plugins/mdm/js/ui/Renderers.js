/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.mdm.ui');

/**
 * @class Grommunio.plugins.mdm.ui.Renderers
 * Methods of this object can be used as renderers for grid panels, to render
 * cells in custom format according to data type
 * @singleton
 */
Grommunio.plugins.mdm.ui.Renderers = {

	/**
	 * Render the Provisioning Status.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	provisioningStatus : function(value, p, record)
	{
		return Grommunio.plugins.mdm.data.ProvisioningStatus.getDisplayName(parseInt(value));
	}
};
