Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.PresenceStatus
 * @extends Grommunio.core.Enum
 * @singleton
 *
 * The various presence statuses that a user can have.
 * {@link Grommunio.core.PresencePlugin PresencePlugins} should return
 * these statuses when requested through the
 * {@link Grommunio.core.PresencePlugin#getPresence getPresence} function.
 */
Grommunio.core.data.PresenceStatus = Grommunio.core.Enum.create({
	/**
	 * Denotes that the presence status of the user is currently unknown.
	 * @property
	 * @type Number
	 */
	UNKNOWN: 0,

	/**
	 * Denotes that the user is currently active.
	 * @property
	 * @type Number
	 */
	OFFLINE: 1,

	/**
	 * Denotes that the user has not been active for some time
	 * @property
	 * @type Number
	 */
	ONLINE: 2,

	/**
	 * Returns a css class name for the given presence status
	 * @param {Grommunio.core.data.PresenceStatus} presenceStatus The presence status for
	 * which a css class name is requested.
	 */
	getCssClass: function(presenceStatus)
	{
		var name = this.getName(presenceStatus);
		name = name ? name.toLowerCase() : 'unknown';
		return 'grommunio-presence-status-' + name;
	}
});
