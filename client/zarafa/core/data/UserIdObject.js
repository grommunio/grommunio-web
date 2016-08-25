Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.UserIdObject
 * @extends Object
 *
 * An object that identifies a user and has some functions to create and
 * compare.
 */
Zarafa.core.data.UserIdObject = Ext.extend(Object, {
	/**
	 * The type of this user. Can be ZARAFA or SMTP
	 * @property
	 */
	type : '',

	/**
	 * The display name of this user. Only added as a property to make
	 * easier for humans to recognize the user. Should not be used to
	 * identify the user!
	 * @property
	 */
	display_name : '',

	/**
	 * The email address of this user. Not always available.
	 * @property
	 */
	email_address : '',

	/**
	 * The username of this user. Only available for ZARAFA type users.
	 * @property
	 */
	username : '',

	/**
	 * The entryid of this user. Only available for ZARAFA type users.
	 * @property
	 */
	entryid : '',

	/**
	 * Constructor.
	 * @param {Object} idObject An object with properties
	 * that identify a user.
	 */
	constructor : function(idObject)
	{
		if ( idObject.type ) {
			this.type = idObject.type;
		}
		if ( idObject.display_name ) {
			this.display_name = idObject.display_name;
		}
		if ( idObject.email_address ) {
			this.email_address = idObject.email_address;
		}
		if ( idObject.username ) {
			this.username = idObject.username;
		}
		if ( idObject.entryid ) {
			this.entryid = idObject.entryid;
		}
	},

	/**
	 * Compares the {@link Zarafa.core.data.UserIdObject UserIdObject} to the passed
	 * {@link Zarafa.core.data.UserIdObject}. Returns true if both objects
	 * identify the same user.
	 * @param {Zarafa.core.data.UserIdObject} userIdObject A user of whom the id data
	 * will be compared to this users id data.
	 * @return {Boolean}
	 */
	equals : function(userIdObject)
	{
		// First we will compare the entryids if they are set
		if ( !Ext.isEmpty(this.entryid) && !Ext.isEmpty(userIdObject.entryid) ) {
			return Zarafa.core.EntryId.compareEntryIds(this.entryid, userIdObject.entryid);
		}

		// Second we will compare usernames. If a username is set, then an entryId should also be set,
		// so this comparison  should not be necessary. However, this makes it possible to request
		// presence status with only a username, so let's include it.
		if ( !Ext.isEmpty(this.username) && this.username === userIdObject.username ) {
			return true;
		}

		// Third we will compare email addresses
		if ( !Ext.isEmpty(this.email_address) && this.email_address === userIdObject.email_address ) {
			return true;
		}

		//Last we will take care of when a username field is filled with the email address
		if (
			( !Ext.isEmpty(this.username) && this.username === userIdObject.email_address ) ||
			( !Ext.isEmpty(this.email_address) && this.email_address === userIdObject.username )
		){
			return true;
		}

		return false;
	},

	/**
	 * Synchronizes the data of this user with the given user.
	 * @param {Zarafa.core.data.UserIdObject} user A user whose id data will be used
	 * to update the id data of this user if possible.
	 */
	syncWithUser : function(user)
	{
		if ( user.type === 'ZARAFA' ){
			if ( this.type !== 'ZARAFA' ){
				this.type = user.type;
				this.display_name = user.display_name;
				this.username = user.username;
				this.entryid = user.entryid;
			}
			// Only store the email_address if we don't already have one. (Sometime we don't get an
			// email address for ZARAFA users, so we shouldn't overwrite if we have one)
			if ( Ext.isEmpty(this.email_address) ){
				this.email_address = user.username.indexOf('@')>=0 ? user.username : user.smtp_address;
			}
		}
	}
});