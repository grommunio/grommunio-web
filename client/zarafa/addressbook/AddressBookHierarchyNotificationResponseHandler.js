Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.AddressBookHierarchyNotificationResponseHandler
 * @extends Zarafa.core.data.AbstractNotificationResponseHandler
 *
 * The default {@link Zarafa.core.data.AbstractNotificationResponseHandler ResponseHandler}
 * for AddressBook Hierarchy Notifications. This can handle addressbook updates.
 */
Zarafa.addressbook.AddressBookHierarchyNotificationResponseHandler = Ext.extend(Zarafa.core.data.AbstractNotificationResponseHandler, {

	/**
	 * Handle the 'addressbook' action.
	 * This will update the {@link Zarafa.addressbook.AddressBookHierarchyStore store}
	 */
	doAddressbook : function ()
	{
		this.addNotification(Zarafa.core.data.Notifications.objectModified, null, null);
	}
});
