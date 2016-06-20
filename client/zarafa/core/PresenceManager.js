Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.PresenceManager
 * @extends Ext.util.Observable
 *
 * Has functions to handle presence of users
 *
 * @singleton
 */
Zarafa.core.PresenceManager = Ext.extend(Ext.util.Observable, {
	/**
	 * An array that contains all registered
	 * {@link Zarafa.core.PresencePlugin Zarafa.core.PresencePlugins}
	 * @property
	 * @private
	 */
	presencePlugins : undefined,

	/**
	 * The stores that have been registered with the {@link Zarafa.core.PresenceManager PresenceManager}
	 * @property
	 * @private
	 */
	registeredStores : [],

	/**
	 * An array with userIdObjects for which a presence status
	 * will be requested from all {#presencePlugins}
	 * @property
	 * @private
	 */
	requestQueue : [],

	/**
	 * The polling interval in milliseconds. This is the interval with which
	 * the presence status of the users in the registered stores will be
	 * updated
	 * @property
	 * @private
	 */
	pollingInterval : 20000,

	/**
	 * The constructor
	 */
	constructor : function()
	{
		var me = this;

		Zarafa.onReady(function(){
			setInterval(function(){
				me.pollForUpdates();
			}, me.pollingInterval);
		});
	},

	/**
	 * Returns an array with all registered
	 * {@link Zarafa.core.PresencePlugin PresencePlugins}
	 * @return {Zarafa.core.PresencePlugin[]}
	 */
	getPresencePlugins : function()
	{
		if ( !Ext.isDefined(this.presencePlugins) ){
			this.presencePlugins = [];
			var plugins = container.getPlugins();
			Ext.each(plugins, function(plugin){
				if ( plugin instanceof Zarafa.core.PresencePlugin ){
					this.presencePlugins.push(plugin);
				}
			}, this);
		}

		return this.presencePlugins;
	},

	/**
	 * Returns the presence status for the users for whom the status has been requested
	 * @param {Zarafa.core.data.UserIdObject[]} users An array of userIdObjects
	 * for whom a presence status is requested.
	 * @return {Object[]} An array of objects that contain a
	 * {@link Zarafa.core.data.PresenceStatus presence status} for
	 * each presence plugin
	 */
	getPresenceStatusForUsers : function(users)
	{
		if ( !Ext.isArray(users) ){
			users = [users];
		}
		if ( users.length === 0 ){
			return [];
		}
		var presenceStatuses = [];
		Ext.each(users, function(){
			presenceStatuses.push({});
		});

		var presencePlugins = this.getPresencePlugins();
		if ( presencePlugins.length === 0 ){
			// No presence plugins available, so let's return an array with empty objects
			return presenceStatuses;
		}

		// Let's create an array without duplicate entries, so the
		// plugins don't have to return a status more than once.
		var uniqueUsers = [];
		Ext.each(users, function(user){
			var duplicate = Ext.each(uniqueUsers, function(uniqueUser){
				if ( Ext.isEmpty(user) || user.equals(uniqueUser) ){
					return false;
				}
			});
			if ( !Ext.isDefined(duplicate) ){
				uniqueUsers.push(user);
			}
		});

		// Request the statuses from the presence plugins.
		Ext.each(presencePlugins, function(presencePlugin){
			var pluginName = presencePlugin.getName();
			var pluginPresenceStatuses = presencePlugin.getPresenceStatuses(uniqueUsers);

			// Fill the statuses in the array
			Ext.each(users, function(user, userIndex){
				Ext.each(uniqueUsers, function(uniqueUser, uniqueUserIndex){
					if ( user.username === uniqueUser.username && user.email_address === uniqueUser.email_address ){
						presenceStatuses[userIndex][pluginName] = pluginPresenceStatuses[uniqueUserIndex];
					}
				});
			});
		});

		return presenceStatuses;
	},

	/**
	 * Returns the presence status for a user. If the user is not available in the
	 * cache, a status for the user will be requested from the presence plugins.
	 * @param {Zarafa.core.data.UserIdObject} user The user for whom a presence
	 * status is requested.
	 * @return {Zarafa.core.data.PresenceStatus} The squashed presence status
	 */
	getPresenceStatusForUser : function(user)
	{
		if ( Ext.isEmpty(user) ){
			return Zarafa.core.data.PresenceStatus.UNKNOWN;
		}

		var statusByPlugin = this.getPresenceStatusForUsers([user])[0];
		// Squash the status
		var status = Zarafa.core.data.PresenceStatus.UNKNOWN;
		Ext.iterate(statusByPlugin, function(pluginName){
			if ( statusByPlugin[pluginName]>status ){
				status = statusByPlugin[pluginName];
			}
		});
		return status;
	},

	/**
	 * Add a {@link Zarafa.core.data.UserIdObject user} to the user queue for which
	 * a presence status will be requested. The queue will be resolved in a
	 * delayedTask of 500ms.
	 * @param {Zarafa.core.data.UserIdObject} user An object that identifies the user for which
	 * a presence status will be requested.
	 */
	queuePresenceRequest : function(user)
	{
		// If the user is already in the request queue, we can simply return.
		var userAlreadyinRequestQueue = false;
		Ext.each(this.requestQueue, function(queuedUser){
			if ( user.equals(queuedUser) ){
				userAlreadyinRequestQueue = true;
				return false;
			}
		}, this);
		if ( userAlreadyinRequestQueue ){
			return;
		}

		this.requestQueue.push(user);

		// If the task has not yet been created, do it now
		this.task = this.task || new Ext.util.DelayedTask(this.doQueuedRequests, this);

		// Delay the task with 500ms to buffer the requests
		this.task.delay(500);
	},

	/**
	 * {@link Ext.util.DelayedTask} handler that requests a
	 * {@link Zarafa.core.data.PresenceStatus presence status} for all
	 * users in the {#requestQueue queue}.
	 */
	doQueuedRequests : function()
	{
		var statuses = this.getPresenceStatusForUsers(this.requestQueue);

		// Store the updates to the cache and update the ui
		var statusesByPlugin = this.rearangeStatuses(this.requestQueue, statuses);
		Ext.iterate(statusesByPlugin, function(pluginName){
			this.updateStatuses(pluginName, statusesByPlugin[pluginName]);
		}, this);

		// Empty the request queue
		this.requestQueue = [];
	},

	/**
	 * Rearanges an array with presence statuses that is originally orderded by user
	 * (e.g. the return value of {#link getPresenceStatusForUsers}) to an array
	 * that is ordered by pluginName)
	 * @param {Zarafa.core.data.UserIdObject[]} users An array with users
	 * @param {Object[]} statuses An array with objects that contain a presence
	 * status per presence plugin. The entries in the statuses array correspond
	 * to the entries in the given users array.
	 * @return {Object} An object that contains an array for each presence plugin.
	 * The arrays contain objects that contain a
	 * {@link Zarafa.core.data.UserIdObject user} and a status.
	 */
	rearangeStatuses : function(users, statuses)
	{
		var statusesByPlugin = {};
		Ext.each(statuses, function(statusByPlugin, index){
			Ext.iterate(statusByPlugin, function(pluginName){
				if ( !Ext.isDefined(statusesByPlugin[pluginName]) ){
					statusesByPlugin[pluginName] = [];
				}
				statusesByPlugin[pluginName].push({
					user : users[index],
					status : statusByPlugin[pluginName]
				});
			}, this);
		}, this);

		return statusesByPlugin;
	},

	/**
	 * Registers a store with the {@link Zarafa.core.PresenceManager}. The
	 * {@link Zarafa.core.PresenceManager} will then make sure that presence statuses
	 * are fetched when the store loads or when the {@link Zarafa.core.PresenceManager}
	 * polls for updates.
	 * @param {Zarafa.core.data.MAPIStore|Zarafa.core.data.MAPISubStore} store The store
	 * that will be registered.
	 * @param {Array|String} fieldRoots The user fields for which a presence status
	 * will be added to the records. (e.g.: 'sender')
	 */
	registerStore : function(store, fieldRoots)
	{
		var storeRegistered = Ext.each(this.registeredStores, function(registeredStore){
			if ( registeredStore.store === store ){
				return false;
			}
		}, this);

		if ( Ext.isDefined(storeRegistered) ){
			// Store was already registered
			return;
		}

		// Stores don't have to pass a field name if they want to use the default props
		// (name, address_type, etc). The passed field parameter will then be undefined,
		// so we make sure it is a string.
		if ( !Ext.isDefined(fieldRoots) ){
			fieldRoots = '';
		}
		if ( !Ext.isArray(fieldRoots) ){
			fieldRoots = [fieldRoots];
		}
		this.registeredStores.push({
			store: store,
			fieldRoots: fieldRoots
		});

		// Add the current users to the cache by calling the onLoad listener
		this.onStoreLoad(store, store.getRange(), null, fieldRoots);

		// Register an event handler for the load event of this store
		store.on('load', this.onStoreLoad.createDelegate(this, [fieldRoots], true), this);
	},

	/**
	 * Unregisters a store that was previously registered with the {#registerStore}.
	 * @param {Zarafa.core.data.MAPIStore|Zarafa.core.data.MAPISubStore} store The store
	 * that will be unregistered.
	 */
	unregisterStore : function(store)
	{
		for ( var i=0; i<this.registeredStores.length; i++) {
			if ( this.registeredStores[i].store === store ){
				this.registeredStores.splice(i, 1);
				return;
			}
		}
	},

	/**
	 * Event handler for the load event of a registered store. If records are loaded that contain
	 * users for which the {@link Zarafa.core.data.PresenceCache} does not have an
	 * entry yet, then a status for these users is requested from the presence plugins.
	 * @param {Zarafa.core.data.MAPIStore|Zarafa.core.data.MAPISubStore} store The store
	 * that contains records for which presence statuses are needed.
	 * @param {Zarafa.core.data.MAPIRecord[]} records The records that are being loaded into
	 * this store.
	 * @param {Object} options The loading options that were specified
	 * @param {String|String[]} userFieldRoots The root of the user fields for which presence
	 * status must be added
	 */
	onStoreLoad : function(store, records, options, fieldRoots)
	{
		// Create an array with user info objects to send to the PresenceManager
		var users = Zarafa.core.data.UserIdObjectFactory.createFromStore(store, fieldRoots);

		// Check if we already have an entry for these users in the cache
		// because otherwise we must add it and make a request to the plugins
		Ext.each(users, function(user, index){
			if ( Zarafa.core.data.PresenceCache.indexOfUser(user) === -1 ){
				// Ask the presence plugins about this user
				this.queuePresenceRequest(user);
			}
		}, this);
	},

	/**
	 * Processes status updates from presence plugins. The updates will be stored
	 * in the {@link Zarafa.core.data.PresenceCache} and the UI will be updated.
	 * @param {Object} pluginName The name of the plugin from which the updates come
	 * @param {Array} updates An array with objects that contain a
	 * {Zarafa.core.data.UserIdObject UserIdObject} and a
	 * {@link Zarafa.core.data.PresenceStatus} for that user
	 */
	updateStatuses : function(pluginName, updates) {
		// Make sure we have an array
		if ( !Ext.isArray(updates) ){
			updates = [updates];
		}

		// Remove duplicates
		updates = this.removeDuplicateUpdates(updates);

		// First add the statuses to the cache, and check if the UI needs to be updated
		var realUpdates = [];
		Ext.each(updates, function(update){
			var statusBeforeUpdate = Zarafa.core.data.PresenceCache.getStatusForUser(update.user);
			Zarafa.core.data.PresenceCache.addStatusForUser(pluginName, update.user, update.status);
			var statusAfterUpdate = Zarafa.core.data.PresenceCache.getStatusForUser(update.user);
			if ( statusAfterUpdate !== statusBeforeUpdate ){
				realUpdates.push(update);
			}
		});

		// Now update the stores that have records for these users
		Ext.each(this.registeredStores, function(registeredStore){
			var fields = registeredStore.fieldRoots;
			var records = registeredStore.store.getRange();
			var modified = [];
			Ext.each(records, function(record) {
				if ( modified.indexOf(record)>=0 ){
					return;
				}
				Ext.each(fields, function(field) {
					var recordAdded = Ext.each(realUpdates, function(update) {
						var user = Zarafa.core.data.UserIdObjectFactory.createFromRecord(record, field);
						if ( user && user.equals(update.user) ){
							modified.push(record);
							return false;
						}
					}, this);
					if ( Ext.isDefined(recordAdded) ){
						return false;
					}
				}, this);
			}, this);

			// Fire update events for all modified records, so components that display these records
			// update their UI.
			if ( modified.length ){
				Ext.each( modified, function(record) {
					registeredStore.store.fireEvent('update', registeredStore.store, record, Ext.data.Record.COMMIT);
				});

				// Recipient links don't get updated when we fire an update event, so we fire a datachanged event
				if ( registeredStore.store instanceof Zarafa.core.data.IPMRecipientStore ){
					registeredStore.store.fireEvent('datachanged', registeredStore.store);
				}
			}
		}, this);
	},

	/**
	 * Removes duplicates from the array with updates.
	 * @param {Array} updates An array with objects that contain a
	 * {@link Zarafa.core.data.UserIdObject user} and a
	 * {@link Zarafa.core.data.PresenceStatus} for that user
	 * @returns {Object[]}
	 * @private
	 */
	removeDuplicateUpdates : function(updates)
	{
		var uniqueUpdates = [];
		Ext.each(updates, function(update){
			var isDuplicate = Ext.each(uniqueUpdates, function(uniqueUpdate){
				if ( uniqueUpdate.user.equals(update.user) ){
					return false;
				}
			}, this);

			if ( Ext.isDefined(isDuplicate) ){
				return;
			}
			uniqueUpdates.push(update);
		}, this);

		return uniqueUpdates;
	},

	/**
	 * Requests a status from all presence plugins for all users in the
	 * registered stores.
	 */
	pollForUpdates : function()
	{
		// Get all users from the registered stores
		var users = [];
		Ext.each(this.registeredStores, function(registeredStore){
			users = users.concat(Zarafa.core.data.UserIdObjectFactory.createFromStore(registeredStore.store, registeredStore.fieldRoots));
		}, this);

		var statuses = this.getPresenceStatusForUsers(users);
		var statusesByPlugin = this.rearangeStatuses(users, statuses);
		Ext.iterate(statusesByPlugin, function(pluginName){
			this.updateStatuses(pluginName, statusesByPlugin[pluginName]);
		}, this);
	}
});

// Make a singleton of this class
Zarafa.core.PresenceManager = new Zarafa.core.PresenceManager();
