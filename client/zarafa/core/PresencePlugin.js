Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.PresencePlugin
 * @extends Zarafa.core.Plugin
 *
 * A {@link Zarafa.core.PresencePlugin PresencePlugin} is a special kind of plugin
 * that should implement a method to communicate presence information about
 * users to the WebApp core. The core will then use this information to display
 * a presence indication in the UI.
 *
 * This class was intended to be overridden.
 */
Zarafa.core.PresencePlugin = Ext.extend(Zarafa.core.Plugin, {
	/**
	 * Presence plugins should overwrite this function and return an array with an
	 * entry for each of the users defines in userInfos. An entry should be one of
	 * the statuses defined in {@link Zarafa.core.data.PresenceStatus}
	 * @param {Zarafa.core.data.UserIdObject[]} users An array of users
	 * for whom a {@link Zarafa.core.data.PresenceStatus presence status} is
	 * requested,
	 * @return {Zarafa.core.data.PresenceStatus[]}
	 */
	getPresenceStatuses : function(users) {
		// This function should be overwritten, but just in case we will return a
		// status unknown for all users
		var statuses = [];

		for ( var i=0; i<users.length; i++ ){
			statuses.push(Zarafa.core.data.PresenceStatus.UNKNOWN);
		}

		return statuses;
	}
});