Ext.namespace('Grommunio.core');

/**
 * @class Grommunio.core.PresencePlugin
 * @extends Grommunio.core.Plugin
 *
 * A {@link Grommunio.core.PresencePlugin PresencePlugin} is a special kind of plugin
 * that should implement a method to communicate presence information about
 * users to grommunio Web core. The core will then use this information to display
 * a presence indication in the UI.
 *
 * This class was intended to be overridden.
 */
Grommunio.core.PresencePlugin = Ext.extend(Grommunio.core.Plugin, {
	/**
	 * Presence plugins should overwrite this function and return an array with an
	 * entry for each of the users defines in userInfos. An entry should be one of
	 * the statuses defined in {@link Grommunio.core.data.PresenceStatus}
	 * @param {Grommunio.core.data.UserIdObject[]} users An array of users
	 * for whom a {@link Grommunio.core.data.PresenceStatus presence status} is
	 * requested,
	 * @return {Array} Array of {@link Grommunio.core.data.PresenceStatus}
	 */
	getPresenceStatuses: function(users) {
		// This function should be overwritten, but just in case we will return a
		// status unknown for all users
		return users.map(function() {
			return Grommunio.core.data.PresenceStatus.UNKNOWN;
		});
	}
});
