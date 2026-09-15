/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.UserIdObjectFactory
 * @extends Object
 *
 * An factory object that can be used to create
 * {@link Grommunio.core.data.UserIdObject UserIdObjects}
 *
 * @singleton
 */
Grommunio.core.data.UserIdObjectFactory = {
	/**
	 * Creates a {@link Grommunio.core.data.UserIdObject} from the data in the record.
	 * @param {Grommunio.core.data.IPMRecord} record The record from which the data for the
	 * userIdObject is taken.
	 * @return {Grommunio.core.data.UserIdObject|null}
	 */
	createFromRecord: function(record)
	{
		// Return null for distlists
		if ( !Ext.isFunction(record.get) || !Ext.isEmpty(record.get('object_type')) && record.get('object_type') === Grommunio.core.mapi.ObjectType.MAPI_DISTLIST ) {
			return null;
		}

		// Add the general fields to the object
		var user = {};

		// Try to be smart to find a display_name
		user.display_name = record.get('display_name');

		user.type = record.get('address_type');

		if ( user.type === 'EX' ){

			// Add GROMMUNIO specific fields to the object
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

			// Add the field for non-GROMMUNIO users to the object
			// Try to be smart to find the email address
			user.email_address = record.get('email_address') || record.get('smtp_address');
			user.entryid = record.get('entryid');
		} else {
			return null;
		}

		var userIdObject = new Grommunio.core.data.UserIdObject(user);

		// If possible sync the userInfo with the cached one
		return Grommunio.core.data.PresenceCache.syncUsers([userIdObject])[0];
	},

	/**
	 * Returns an array with {@link Grommunio.core.data.UserIdObject UserIdObjects} for all
	 * users in the passed store.
	 * @param {Grommunio.core.data.MAPIStore|Grommunio.core.data.MAPISubStore} store The store
	 * from which {@link Grommunio.core.data.UserIdObject UserIdObjects} will be created.
	 * @return {Grommunio.core.data.UserIdObject[]} An array with userInfo
	 * objects.
	 */
	createFromStore: function(store)
	{
		if ( !store.data ) {
			return [];
		}

		var userIdObjects = [];
		var records = store.getRange();

		Ext.each(records, function(record){
			var userIdObject = Grommunio.core.data.UserIdObjectFactory.createFromRecord(record);
			if ( userIdObject ) {
				userIdObjects.push(userIdObject);
			}
		}, this);

		return userIdObjects;
	}
};
