Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.PresenceCache
 * @extends Object
 *
 * Has functions to handle presence of users
 *
 * @singleton
 */
Zarafa.core.data.PresenceCache = Ext.extend(Object, {
	/**
	 * Holds the cached statuses for users. It is an object that
	 * contain an entryid to Object mapping. The object contains the {@link
	 * Zarafa.core.data.UserIdObject user}, the statusByPlugin for the
	 * user, and a squashed {@link Zarafa.core.data.PresenceStatus status}.
	 * @property
	 * @private
	 */
	cache : {},

	/**
	 * Returns the entry of the user in the {#cache presence cache} for the passed user, or
	 * undefined if the user is not found.
	 * @param {Zarafa.core.data.UserIdObject} user The user for which the entry in the
	 * {#cache presence cache} will be returned.
	 * @param {Boolean} noSync If set to true then the given user will not be used to
	 * update the cache. Note: this is a very ugly way to prevent infinite recursion
	 * when this function is called from {#syncUsers}
	 * @return {Object|undefined}
	 * @private
	 */
	getUser : function(user, noSync) {
		if (!user.hasOwnProperty('entryid')) {
			return;
		}

		// Check if we can update the cached user data
		if (user.entryid in this.cache) {
			// (IPMRecipientStores might change recipients from SMTP to
			// ZARAFA after the names have been resolved)
			if ( noSync !== true ){
				this.syncUsers([user]);
			}
			return this.cache[user.entryid];
		}
	},

	/**
	 * Synchronizes the given {@link Zarafa.core.data.UserIdObject users} with the cache.
	 * @param {Zarafa.core.data.UserIdObject[]} users The users that need to be synced
	 * with the cached users.
	 * @return {Zarafa.core.data.UserIdObject[]}
	 */
	syncUsers : function(users) {
		Ext.each( users, function(user, index){
			var syncedUser = this.getUser(user, true);
			if (Ext.isDefined(syncedUser)) {
				// Check if we can update the cache
				this.cache[user.entryid].user.syncWithUser(user);
				syncedUser = this.cache[user.entryid].user;
			} else {
				// Add the new user to the cache, so it will be updated during polling
				this.cache[user.entryid] = {
					user: user,
					statusByPlugin : {},
					status: Zarafa.core.data.PresenceStatus.UNKNOWN
				};
				syncedUser = this.cache[user.entryid].user;
			}

			// Update the return value
			users[index] = syncedUser;
		}, this);

		return users;
	},

	/**
	 * Returns the cached presence status for the given user or
	 * undefined if the user was not found in the cache.
	 * @param {Zarafa.core.data.UserIdObject} userInfo The user for which
	 * a {@link Zarafa.core.data.PresenceStatus presence status} is
	 * requested.
	 * @return {Zarafa.core.data.PresenceStatus|undefined}
	 */
	getStatusForUser : function(userInfo) {
		// Distlists don't have userInfos but will send null
		if ( !userInfo ){
			return Zarafa.core.data.PresenceStatus.UNKNOWN;
		}

		var user = this.getUser(userInfo);
		return user && user.status;
	},

	/**
	 * Adds the status for the given user for the given plugin to the cache.
	 * @param {String} pluginName Name of the plugin for which a status is added/updated
	 * @param {Zarafa.core.data.UserIdObject} user The user for which the status is added
	 * @param {Zarafa.core.data.PresenceStatus} status The status for the given user according to the
	 * given plugin
	 */
	addStatusForUser : function(pluginName, user, status){
		// First see if we already have a cached status for this user
		var cacheUser = this.getUser(user);

		// Add the status of the user for this plugin
		if ( Ext.isDefined(cacheUser) ){
			cacheUser.statusByPlugin[pluginName] = status;
		} else {
			var statusByPlugin = {};
			statusByPlugin[pluginName] = status;
			this.cache[user.entryid] = {
				user: user,
				statusByPlugin : statusByPlugin
			};
		}

		// Add a squashed status
		var presenceUser = this.cache[user.entryid];
		presenceUser.status = Zarafa.core.data.PresenceStatus.UNKNOWN;
		Ext.iterate(presenceUser.statusByPlugin, function(pluginName){
			if ( presenceUser.statusByPlugin[pluginName] > presenceUser.status ){
				presenceUser.status = presenceUser.statusByPlugin[pluginName];
			}
		}, this);
	},

	/**
	 * Returns a list of {Zarafa.core.data.UserIdObject} objects in the cache.
	 * @return {Array} of {@link Zarafa.core.data.UserIdObject UserIdObjects}
	 */
	getUserInfoList : function() {
		return Object.keys(this).map(function(key) {
			return this.cache[key].user;
		}, this);
	}
});

// Make a singleton of this class
Zarafa.core.data.PresenceCache = new Zarafa.core.data.PresenceCache();
