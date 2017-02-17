Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.AbstractNotificationResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * This class specializes in handling notifications recieved by the PHP-side,
 * and is to be used by the {@link Zarafa.core.ResponseRouter ResponseRouter} to
 * process these notifications.
 */
Zarafa.core.data.AbstractNotificationResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {
	/**
	 * @cfg {Ext.data.Store} store The Store in which the {@link Ext.data.Record records} are located
	 * which can be updated by this Notification Response. Note that this is only used to obtain the
	 * affected {@link Ext.data.Record records}, and the actual updating will be done by the {@link #notifyObject}.
	 */
	store : undefined,

	/**
	 * @cfg {Ext.data.Reader} reader
	 * Reader that will be used to parse the records
	 */
	reader: undefined,

	/**
	 * @cfg {Object} notifyObject The object which must be called when notifications have been recieved.
	 * This object must contain the function 'onNotify' which accepts the following arguments:
	 * <div class="mdetail-params"><ul>
	 * <li><b>action</b> : Zarafa.core.data.Notifications<p class="sub-desc">The notification action</p></li>
	 * <li><b>records</b> : Ext.data.Record/Array<p class="sub-desc">The record or records which have been
	 * affected by the notification</p></li>
	 * <li><b>data</b> : Object <p class="sub-desc">The data which has been recieved from the PHP-side which must be applied
	 * to the given records.</p></li>
	 * <li><b>success</b> : Boolean<p class="sub-desc">The success status, True if the notification was successfully recieved</p></li>
	 * </ul></div>
	 */
	notifyObject : undefined,

	/**
	 * Collection of Notifications which were found inside the Response object.
	 * This object contains <action, notification> pairs, where the action is used
	 * as key on the 'notifications' object, and the notification is either an object
	 * or an array of objects which have been collected for the given action. Each
	 * object contains the records with all the {@link Ext.data.Record records} which
	 * is being affected by this notification, and the data which has been recieved
	 * from the PHP-side.
	 *
	 * Adding new notifications can be done using the {@link #addNotification} function.
	 * They will automatically be reported to the {@link #notifyObject} during the {@link #done} function.
	 * @property
	 * @type Object
	 */
	notifications : undefined,

	/**
	 * The {@link Date#getTime timestamp} of the date on which the notifications were received, this
	 * value is provided during {@link #start}.
	 * @property
	 * @type Number
	 */
	receivedTime : undefined,

	/**
	 * The main handler to begin a Response processing transaction.
	 * @param {String} moduleName The name of the PHP module from which this response originated.
	 * @param {String} moduleId The unique identifier for the PHP response.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the response was received
	 * @return {Boolean} False when the given data object cannot be handled by this response handler,
	 * and the transaction must be canceled.
	 */
	start : function(moduleName, moduleId, data, timestamp)
	{
		// If the data is not a valid response, then we cannot handle it.
		// The same counts for the notifyObject, which must be a valid object,
		// which contains our callback function for reporting the notifications.
		if (!Ext.isObject(data) || Ext.isEmpty(this.notifyObject) || !Ext.isFunction(this.notifyObject.onNotify)) {
			return false;
		}

		// Prepare the notifications list
		this.notifications = {};

		// Update the received time
		this.receivedTime = timestamp;
	},

	/**
	 * The main handler to complete a Response processing transaction.
	 * @param {Boolean} success True if no errors were returned from the PHP-side.
	 */
	done : function(success)
	{
		Ext.iterate(this.notifications, function(action, actionData) {
			Ext.each(actionData, function(notification) {
				this.notifyObject.onNotify(action, notification.records, notification.data, this.receivedTime, success);
			}, this);
		}, this);
	},

	/**
	 * Add a new notification to the {@link #notifications} object. This will
	 * check if the given action already has a notification attached to it.
	 * If this is the case, the notification is converted into an array, in order
	 * to be able to deliver multiple notifications for the same action type.
	 * @param {Zarafa.core.data.Notifications} action The notification action.
	 * @param {Array} records The records for which the notification is intended
	 * @param {Array} data The notification data for each record
	 * @private
	 */
	addNotification : function(action, records, data)
	{
		var notification = { records: records, data : data };

		if (Ext.isDefined(this.notifications[action])) {
			if (Array.isArray(this.notifications[action])) {
				this.notifications[action].push(notification);
			} else {
				this.notifications[action] = [ this.notifications[action], notification ];
			}
		} else {
			this.notifications[action] = [ notification ];
		}
	}
});
