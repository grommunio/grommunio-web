Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.PresencePlugin
 * @extends Zarafa.core.Plugin
 * 
 * A {@link Zarafa.core.PresencePlugin PresencePlugin} is a special kind of plugin
 * that should implement some methods to communicate presence information about 
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
	 * @param {Object[]} userInfo An array of objects with information about users
	 * for whom presence info is requested, A userInfo object should contain
	 * the following properties:
	 * <pre>
	 * {
	 * 		'type': 			'ZARAFA'
	 * 		'display_name': 	'John Doe',
	 * 		'username':			'john',			// Note: this field only exists for ZARAFA type users
	 * 		'entryid':			'0123456789ab',	// Note: this field only exists for ZARAFA type users
	 * 		'email_address': 	'john@doe.com', // Note: this field only exists for non-ZARAFA type users
	 * }
	 * </pre>
	 * @return {Number[]}
	 */
	getPresenceStatuses : function(userInfos) {
		// This function should be overwritten, but just in case we will return a
		// status unknown for all users
		var presenceStatuses = [];
		
		for ( var i=0; i<userInfos.length; i++ ){
			presenceStatuses.push(Zarafa.core.data.PresenceStatus.UNKNOWN);
		}
		
		return presenceStatuses;
	}
});