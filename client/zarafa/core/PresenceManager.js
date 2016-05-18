Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.PresenceManager
 * @extends Object
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
	 * @param {Object[]} userInfos An array of objects with information about the user
	 * for whom a presence status is requested. A userInfo object should contain
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
	 * @return {Array} An array of {@link Zarafa.core.data.PresenceStatus PresenceStatuses}
	 */
	getPresenceStatusForUsers : function(userInfos)
	{
		if ( !Ext.isArray(userInfos) ){
			userInfos = [userInfos];
		}
		if ( userInfos.length === 0 ){
			return [];
		}
		var presenceStatuses = [];
		var presencePlugins = this.getPresencePlugins();
		if ( presencePlugins.length === 0 ){
			// No presence plugins available, so let's return UNKNOWN for all users
			for ( var i=0; i<userInfos.length; i++ ){
				presenceStatuses.push(Zarafa.core.data.PresenceStatus.UNKNOWN);
			}
			return presenceStatuses;
		}

		// Let's remove duplicate entries first
		var cleanUserInfos = [];
		Ext.each(userInfos, function(userInfo){
			var duplicate = false;
			Ext.each(cleanUserInfos, function(cleanUserInfo){
				if ( 
					cleanUserInfo.type === userInfo.type &&
					cleanUserInfo.username === userInfo.username &&
					cleanUserInfo.email_address === userInfo.email_address
				){
					duplicate = true;
					return true;
				}
				
			});
			if ( !duplicate ){
				cleanUserInfos.push(userInfo);
			}
		});
		
		for ( var i=0; i<userInfos.length; i++ ){
			presenceStatuses.push({});
		}

		// Request the needed statuses from the presence plugins.
		Ext.each(presencePlugins, function(presencePlugin){
			var pluginName = presencePlugin.getName();
			var pluginPresenceStatuses = presencePlugin.getPresenceStatuses(cleanUserInfos);

			// Fill the statuses in the array
			Ext.each(userInfos, function(userInfo, userInfoIndex){
				Ext.each(cleanUserInfos, function(cleanUserInfo, cleanUserInfoIndex){
					if ( userInfo.username === cleanUserInfo.username && userInfo.email_address === cleanUserInfo.email_address ){
						presenceStatuses[userInfoIndex][pluginName] = pluginPresenceStatuses[cleanUserInfoIndex];
					}
				});
			});
		});

		// Squash the presence statuses of the different plugins to one status for each user
		Ext.each(presenceStatuses, function(presenceStatus, index){
			var status = Zarafa.core.data.PresenceStatus.UNKNOWN;
			for ( var pluginName in presenceStatus ){
				if ( presenceStatus[pluginName] > status ){
					status = presenceStatus[pluginName];
				}
			}
			presenceStatuses[index] = status;
		});

		return presenceStatuses;
	},
	
	/**
	 * Registers a store with the {@link Zarafa.core.PresenceManager}. It will set an event
	 * handler for the load event of the store in which presence statuses will be added for
	 * the user fields that are passed.
	 * @param {Zarafa.core.data.MAPIStore|Zarafa.core.data.MAPISubStore} store The store
	 * that will be registered.
	 * @param {Array|String} userFieldKeys The user fields for which a presence status
	 * will be added to the records.
	 */
	registerStore : function(store, userFieldKeys)
	{
		// Register an event handler for the load event of this store
		store.on('load', this.onStoreLoad.createDelegate(this, [userFieldKeys], true), this);
	},

	/**
	 * Event handler for the load event of the store. Adds presence statuses to all records.
	 * @param {Zarafa.mail.MailStore} store This recipient store
	 * @param {Zarafa.core.data.MessageRecord[]} records Array of mail records that are
	 * being loaded into this store.
	 * @param {Object} options The loading options that were specified
	 * @param {String|String[]} userFieldRoots The root of the user fields for which presence
	 * status must be added
	 */
	onStoreLoad : function(store, records, options, userFieldRoots)
	{
		// Create an array with user info objects to send to the PresenceManager
		var userInfos = [];
		if ( !Ext.isArray(userFieldRoots) ){
			userFieldRoots = [userFieldRoots];
		}
		Ext.each(records, function(record){
			Ext.each(userFieldRoots, function(userFieldRoot, index){
				// Stores don't have to pass a field name if they want to use the default props
				// (name, address_type, etc). The passed field parameter will then be undefined,
				// so we make sure it is a string.
				if ( !Ext.isDefined(userFieldRoot) ){
					userFieldRoot = '';
					userFieldRoots[index] = '';
				}
				userInfos.push(this.getUserInfo(userFieldRoot, record));
			}, this);
		}, this);

		// Get the statuses from the PresenceManager
		// Note: Removal of duplicate entries will be handled by the PresenceManager
		var presenceStatuses = Zarafa.core.PresenceManager.getPresenceStatusForUsers(userInfos);
		
		// Add the retrieved statuses to the records
		Ext.each(records, function(record, recordIndex){
			var dirty = record.dirty;
			record.beginEdit();
			Ext.each(userFieldRoots, function(userFieldRoot, userFieldRootIndex){
				record.set(userFieldRoot +  (Ext.isEmpty(userFieldRoot) ? 'presence_status' : '_presence_status'), presenceStatuses[recordIndex*userFieldRoots.length+userFieldRootIndex]);
			});
			// Don't mark the record as dirty by adding the presence (it doesn't need to be sent back to the server)
			record.dirty = dirty;
			record.endEdit();
			record.commit();
		});
	},
	
	/**
	 * Returns an userInfo object that can be sent to the {@link Zarafa.core.PresenceManager}
	 * @param {String} fieldRoot The root of the user field in this record for which the
	 * userInfo object will be returned..
	 * @param {Zarafa.core.data.MessageRecord} record The record from which the data for the 
	 * userInfo object is taken.
	 * @return {Object}
	 */
	getUserInfo : function(fieldRoot, record)
	{
		// Add the general fields to the object
		var userInfo = {};
		
		if ( Ext.isObject(fieldRoot) ){
			// If we got an object, then all fields must be defined in that object
			userInfo.display_name = record.get(fieldRoot.display_name);
			userInfo.type = record.get(fieldRoot.type);
			if ( userInfo.type === 'ZARAFA' ){
				// Add ZARAFA specific fields to the object
				userInfo.entryid = record.get(fieldRoot.entryid);
				userInfo.username = record.get(fieldRoot.username);
			} else {
				// Add the field for non-ZARAFA users to the object
				userInfo.email_address = record.get(fieldRoot.email_address);
			}
		} else if ( Ext.isString(fieldRoot) ){
			// Try to be smart to find a display_name
			userInfo.display_name = record.get(fieldRoot + (Ext.isEmpty(fieldRoot) ? 'display_name' : '_name'));
			userInfo.type = record.get(fieldRoot + (Ext.isEmpty(fieldRoot) ? 'address_type' : '_address_type'));
			if ( userInfo.type === 'ZARAFA' ){
				// Add ZARAFA specific fields to the object
				userInfo.entryid = record.get(fieldRoot + (Ext.isEmpty(fieldRoot) ? 'entryid' : '_entryid'));
				// Try to be smart to find the username
				userInfo.username = record.get(fieldRoot + (Ext.isEmpty(fieldRoot) ? 'username' : '_username')) || record.get(fieldRoot + (Ext.isEmpty(fieldRoot) ? 'email_address' : '_email_address'));
			} else {
				// Add the field for non-ZARAFA users to the object
				// Try to be smart to find the email address
				userInfo.email_address = record.get(fieldRoot + (Ext.isEmpty(fieldRoot) ? 'email_address' : '_email_address')) || record.get(fieldRoot + (Ext.isEmpty(fieldRoot) ? 'smtp_address' : '_smtp_address'));
			}
		}
		
		return userInfo;
	}
	
});

// Make a singleton of this class
Zarafa.core.PresenceManager = new Zarafa.core.PresenceManager();
