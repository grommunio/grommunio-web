Ext.namespace('Zarafa.plugins.mdm.data');

/**
 * @class Zarafa.plugins.mdm.data.ProvisioningStatus
 * @extends Zarafa.core.Enum
 *
 * @singleton
 */
Zarafa.plugins.mdm.data.ProvisioningStatus = Zarafa.core.Enum.create({
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
	 * Denotes that the Wipe is requested.
	 * @property
	 * @type Number
	 */
	'WIPE_REQUESTED' : 4,

	/**
	 * Denotes that the Wipe is executed.
	 * @property
	 * @type Number
	 */
	'WIPE_EXECUTED' : 8,

	/**
	 * Return the display name for the given provisioning Status
	 * @param {Zarafa.plugins.mdm.js.data.ProvisioningStatus} provisioningStatus The given provisioning status
	 * @return {String} The display name for the provisioning status
	 */
	getDisplayName : function(provisioningStatus)
	{
		switch (provisioningStatus) {
			case Zarafa.plugins.mdm.data.ProvisioningStatus.NOT_APPLICABLE:
				return _('Not Applicable', 'plugin_mdm');
			case Zarafa.plugins.mdm.data.ProvisioningStatus.OK:
				return _('Ok', 'plugin_mdm');
			case Zarafa.plugins.mdm.data.ProvisioningStatus.WIPE_PENDING:
				return _('Wipe Pending', 'plugin_mdm');
			case Zarafa.plugins.mdm.data.ProvisioningStatus.WIPE_REQUESTED:
				return _('Wipe Requested', 'plugin_mdm');
			case Zarafa.plugins.mdm.data.ProvisioningStatus.WIPE_EXECUTED:
				return _('Wipe Executed', 'plugin_mdm');
			default:
				return _('Not Available', 'plugin_mdm');
		}
	}
});

