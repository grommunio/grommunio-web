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
	 * Creates a {@link Zarafa.core.data.UserIdObject} from the data in the given
	 * {@link Zarafa.core.data.IPMRecord record} for the given fieldRoot.
	 * @param {Zarafa.core.data.IPMRecord} record The record from which the data for the
	 * userIdObject is taken.
	 * @param {String} fieldRoot The root of the user field in this record for which the
	 * userInfo object will be returned.
	 * @return {Zarafa.core.data.UserIdObject|null}
	 */
	createFromRecord : function(record, fieldRoot)
	{
		// Return null for distlists
		if ( !Ext.isEmpty(record.get('object_type')) && record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_DISTLIST ) {
			return null;
		}

		// Make sure fieldRoot is a string
		fieldRoot = fieldRoot || '';

		// Make sure the fieldRoot ends with an underscore if it isn't empty
		if ( !Ext.isEmpty(fieldRoot) && fieldRoot.indexOf(fieldRoot.length-1)!=='_' ){
			fieldRoot += '_';
		}

		// Add the general fields to the object
		var user = {};

		// Try to be smart to find a display_name
		user.display_name = record.get(fieldRoot + (Ext.isEmpty(fieldRoot) ? 'display_name' : 'name'));

		user.type = record.get(fieldRoot + 'address_type');

		if ( user.type === 'ZARAFA' ){

			// Add ZARAFA specific fields to the object
			var recordEntryId = record.get(fieldRoot + 'entryid');
			var recordUsername = record.get(fieldRoot + 'username');
			var recordEmailAddress = record.get(fieldRoot + 'email_address');
			var recordSmtpAddress = record.get(fieldRoot + 'smtp_address');

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
			user.email_address = record.get(fieldRoot + 'email_address') || record.get(fieldRoot + 'smtp_address');
		} else {
			return null;
		}

		var userIdObject = new Zarafa.core.data.UserIdObject(user);

		// If possible sync the userInfo with the cached one
		userIdObject = Zarafa.core.data.PresenceCache.syncUsers([userIdObject])[0];

		return userIdObject;
	},

	/**
	 * Returns an array with {@link Zarafa.core.data.UserIdObject UserIdObjects} for all
	 * users in the passed store.
	 * @param {Zarafa.core.data.MAPIStore|Zarafa.core.data.MAPISubStore} store The store
	 * from which {@link Zarafa.core.data.UserIdObject UserIdObjects} will be created.
	 * @param {String[]} fieldRoots The fields that denote the users for which
	 * a userInfo block must be created.
	 * @return {Zarafa.core.data.UserIdObject[]} An array with userInfo
	 * objects.
	 */
	createFromStore : function(store, fieldRoots)
	{
		var userIdObjects = [];
		var records = store.getRange();

		if ( !Ext.isArray(fieldRoots) ){
			fieldRoots = [fieldRoots];
		}
		Ext.each(records, function(record){
			Ext.each(fieldRoots, function(fieldRoot, index){
				// Stores don't have to pass a field name if they want to use the default props
				// (name, address_type, etc). The passed field parameter will then be undefined,
				// so we make sure it is a string.
				if ( !Ext.isDefined(fieldRoot) ){
					fieldRoot = '';
					fieldRoots[index] = '';
				}
				var userIdObject = Zarafa.core.data.UserIdObjectFactory.createFromRecord(record, fieldRoot);
				if ( userIdObject ) {
					userIdObjects.push(userIdObject);
				}
			}, this);
		}, this);

		return userIdObjects;
	}
};
