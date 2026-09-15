/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.mdm.data');

/**
 * @class Grommunio.plugins.mdm.data.ProvisioningStatus
 * @extends Grommunio.core.Enum
 *
 * @singleton
 */
Grommunio.plugins.mdm.data.ProvisioningStatus = Grommunio.core.Enum.create({
	/**
	 * Denotes that the wipe is not applicable.
	 * @property
	 * @type Number
	 */
	'NOT_APPLICABLE' : 0,

	/**
	 * Denotes that the wipe is ok.
	 * @property
	 * @type Number
	 */
	'OK' : 1,

	/**
	 * Denotes that the wipe is pending.
	 * @property
	 * @type Number
	 */
	'WIPE_PENDING' : 2,

	/**
	 * Denotes that the wipe is requested.
	 * @property
	 * @type Number
	 */
	'WIPE_REQUESTED' : 4,

	/**
	 * Denotes that the wipe is executed.
	 * @property
	 * @type Number
	 */
	'WIPE_EXECUTED' : 8,

	/**
	 * Denotes that the account only wipe is pending.
	 * @property
	 * @type Number
	 */
	'WIPE_PENDING_ACCOUNT_ONLY' : 16,

	/**
	 * Denotes that the account only wipe is requested.
	 * @property
	 * @type Number
	 */
	'WIPE_REQUESTED_ACCOUNT_ONLY' : 32,

	/**
	 * Denotes that the account only wipe is executed.
	 * @property
	 * @type Number
	 */
	'WIPE_EXECUTED_ACCOUNT_ONLY' : 64,

	/**
	 * Return the display name for the given provisioning Status
	 * @param {Grommunio.plugins.mdm.js.data.ProvisioningStatus} provisioningStatus The given provisioning status
	 * @return {String} The display name for the provisioning status
	 */
	getDisplayName : function(provisioningStatus)
	{
		switch (provisioningStatus) {
			case Grommunio.plugins.mdm.data.ProvisioningStatus.NOT_APPLICABLE:
				return _('Not Applicable');
			case Grommunio.plugins.mdm.data.ProvisioningStatus.OK:
				return _('Ok');
			case Grommunio.plugins.mdm.data.ProvisioningStatus.WIPE_PENDING:
				return _('Wipe Pending');
			case Grommunio.plugins.mdm.data.ProvisioningStatus.WIPE_REQUESTED:
				return _('Wipe Requested');
			case Grommunio.plugins.mdm.data.ProvisioningStatus.WIPE_EXECUTED:
				return _('Wipe Executed');
			case Grommunio.plugins.mdm.data.ProvisioningStatus.WIPE_PENDING_ACCOUNT_ONLY:
				return _('Account Only Wipe Pending');
			case Grommunio.plugins.mdm.data.ProvisioningStatus.WIPE_REQUESTED_ACCOUNT_ONLY:
				return _('Account Only Wipe Requested');
			case Grommunio.plugins.mdm.data.ProvisioningStatus.WIPE_EXECUTED_ACCOUNT_ONLY:
				return _('Account Only Wipe Executed');
			default:
				return _('Not Available');
		}
	}
});

