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
	 * Holds the cached statuses for users. It is an array of objects that
	 * contain a {@link Zarafa.core.data.UserIdObject user}, the statusByPlugin for
	 * the user, and a squashed {@link Zarafa.core.data.PresenceStatus status}.
	 * @property
	 * @private
	 */
	cache : [],

	/**
	 * Returns the index in the {#cache presence cache} for the passed user, or
	 * -1 the user is not found.
	 * @param {Zarafa.core.data.UserIdObject} user The user for which the index in the
	 * {#cache presence cache} will be returned.
	 * @param {Boolean} noSync If set to true then the given user will not be used to
	 * update the cache. Note: this is a very ugly way to prevent infinite recursion
	 * when this function is called from {#syncUsers}
	 * @return {Integer}
	 * @private
	 */
	indexOfUser : function(user, noSync) {
		var cachedEntryIndex = -1;
		Ext.each(this.cache, function(entry, index){
			// Check if the cached entry is from the requested user
			if ( user.equals(entry.user) ){
				cachedEntryIndex = index;

				// Check if we can update the cached user data
				// (IPMRecipientStores might change recipients from SMTP to
				// ZARAFA after the names have been resolved)
				if ( noSync !== true ){
					this.syncUsers([user]);
				}

				return false;
			}
		}, this);

		return cachedEntryIndex;
	},

	/**
	 * Synchronizes the given {@link Zarafa.core.data.UserIdObject users} with the cache.
	 * @param {Zarafa.core.data.UserIdObject[]} users The users that need to be synced
	 * with the cached users.
	 * @return {Zarafa.core.data.UserIdObject[]}
	 */
	syncUsers : function(users) {
		Ext.each( users, function(user, index){
			var cacheIndex = this.indexOfUser(user, true);
			var syncedUser;
			if ( cacheIndex >= 0 ){
				// Check if we can update the cache
				this.cache[cacheIndex].user.syncWithUser(user);
				syncedUser = this.cache[cacheIndex].user;
			} else{
				// Add the new user to the cache, so it will be updated during polling
				this.cache.push({
					user: user,
					statusByPlugin : {},
					status: Zarafa.core.data.PresenceStatus.UNKNOWN
				});
				syncedUser = this.cache[this.cache.length-1].user;
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

		var index = this.indexOfUser(userInfo);
		if ( index>=0 ){
			return this.cache[index].status;
		}

		// No status found for this user, return undefined
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
		var index = this.indexOfUser(user);

		// Add the status of the user for this plugin
		if ( index >= 0 ){
			this.cache[index].statusByPlugin[pluginName] = status;
		} else {
			var statusByPlugin = {};
			statusByPlugin[pluginName] = status;
			this.cache.push({
				user: user,
				statusByPlugin : statusByPlugin
			});
			index = this.cache.length - 1;
		}

		// Add a squashed status
		this.cache[index].status = Zarafa.core.data.PresenceStatus.UNKNOWN;
		Ext.iterate(this.cache[index].statusByPlugin, function(pluginName){
			if ( this.cache[index].statusByPlugin[pluginName] > this.cache[index].status ){
				this.cache[index].status = this.cache[index].statusByPlugin[pluginName];
			}
		}, this);
	}
});

// Make a singleton of this class
Zarafa.core.data.PresenceCache = new Zarafa.core.data.PresenceCache();
