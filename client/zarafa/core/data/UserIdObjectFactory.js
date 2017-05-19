Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.UserIdObjectFactory
 * @extends Object
 *
 * An factory object that can be used to create
 * {@link Zarafa.core.data.UserIdObject UserIdObjects}
 *
 * @singleton
 */
Zarafa.core.data.UserIdObjectFactory = {
	/**
	 * Creates a {@link Zarafa.core.data.UserIdObject} from the data in the record.
	 * @param {Zarafa.core.data.IPMRecord} record The record from which the data for the
	 * userIdObject is taken.
	 * @return {Zarafa.core.data.UserIdObject|null}
	 */
	createFromRecord : function(record)
	{
		// Return null for distlists
		if ( !Ext.isFunction(record.get) || !Ext.isEmpty(record.get('object_type')) && record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_DISTLIST ) {
			return null;
		}

		// Add the general fields to the object
		var user = {};

		// Try to be smart to find a display_name
		user.display_name = record.get('display_name');

		user.type = record.get('address_type');

		if ( user.type === 'ZARAFA' ){

			// Add ZARAFA specific fields to the object
			var recordEntryId = record.get('entryid');
			var recordUsername = record.get('username');
			var recordEmailAddress = record.get('email_address');
			var recordSmtpAddress = record.get('smtp_address');

			user.entryid = recordEntryId;

			// Try to be smart to find the username and email address.
			// Sometimes the username is available in the email_address field,
			// sometimes the email address is available in the username field,
			// and sometimes it is available in the smtp_address field.
			if ( Ext.isString(recordUsername) && recordUsername.indexOf('@')==-1 ){
				user.username = recordUsername;
			} else if ( Ext.isString(recordEmailAddress) && recordEmailAddress.indexOf('@')==-1 ){
				user.username = recordEmailAddress;
			}
			if ( Ext.isString(recordEmailAddress) && recordEmailAddress.indexOf('@')>0 ){
				user.email_address = recordEmailAddress;
			} else if ( Ext.isString(recordSmtpAddress) && recordSmtpAddress.indexOf('@')>0 ){
				user.email_address = recordSmtpAddress;
			} else if ( Ext.isString(recordUsername) && recordUsername.indexOf('@')>0 ){
				user.email_address = recordUsername;
			}
		} else if ( !Ext.isEmpty(user.type) ) {

			// Add the field for non-ZARAFA users to the object
			// Try to be smart to find the email address
			user.email_address = record.get('email_address') || record.get('smtp_address');
			user.entryid = record.get('entryid');
		} else {
			return null;
		}

		var userIdObject = new Zarafa.core.data.UserIdObject(user);

		// If possible sync the userInfo with the cached one
		return Zarafa.core.data.PresenceCache.syncUsers([userIdObject])[0];
	},

	/**
	 * Returns an array with {@link Zarafa.core.data.UserIdObject UserIdObjects} for all
	 * users in the passed store.
	 * @param {Zarafa.core.data.MAPIStore|Zarafa.core.data.MAPISubStore} store The store
	 * from which {@link Zarafa.core.data.UserIdObject UserIdObjects} will be created.
	 * @return {Zarafa.core.data.UserIdObject[]} An array with userInfo
	 * objects.
	 */
	createFromStore : function(store)
	{
		if ( !store.data ) {
			return [];
		}

		var userIdObjects = [];
		var records = store.getRange();

		Ext.each(records, function(record){
			var userIdObject = Zarafa.core.data.UserIdObjectFactory.createFromRecord(record);
			if ( userIdObject ) {
				userIdObjects.push(userIdObject);
			}
		}, this);

		return userIdObjects;
	}
};
