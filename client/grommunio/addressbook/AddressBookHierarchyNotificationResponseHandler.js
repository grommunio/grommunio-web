/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.AddressBookHierarchyNotificationResponseHandler
 * @extends Grommunio.core.data.AbstractNotificationResponseHandler
 *
 * The default {@link Grommunio.core.data.AbstractNotificationResponseHandler ResponseHandler}
 * for AddressBook Hierarchy Notifications. This can handle addressbook updates.
 */
Grommunio.addressbook.AddressBookHierarchyNotificationResponseHandler = Ext.extend(Grommunio.core.data.AbstractNotificationResponseHandler, {

	/**
	 * Handle the 'addressbook' action.
	 * This will update the {@link Grommunio.addressbook.AddressBookHierarchyStore store}
	 */
	doAddressbook: function ()
	{
		this.addNotification(Grommunio.core.data.Notifications.objectModified, null, null);
	}
});
