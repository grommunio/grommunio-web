Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.Notifications
 * List of valid notification types.
 * @singleton
 */
Zarafa.core.data.Notifications = 
{
	/**
	 * The 'New Mail' notification to indicate a new Mail has
	 * been delivered to the user.
	 * @property
	 * @type String
	 */
	newMail : 'newMail',

	/**
	 * The 'Object Created' notification to indicate that a new
	 * object has been added to the {@link Zarafa.core.MAPIStore Store}
	 * or {@link Zarafa.hierarchy.data.MAPIFolderRecord Folder}.
	 * @property
	 * @type String
	 */
	objectCreated : 'objectCreated',

	/**
	 * The 'Object Deleted' notification to indicate that an
	 * object has been deleted from the {@link Zarafa.core.MAPIStore Store}
	 * or {@link Zarafa.hierarchy.data.MAPIFolderRecord Folder}.
	 * @property
	 * @type String
	 */
	objectDeleted : 'objectDeleted',

	/**
	 * The 'Object Modified' notification to indicate that an
	 * object has been modified in the {@link Zarafa.core.MAPIStore Store}
	 * or {@link Zarafa.hierarchy.data.MAPIFolderRecord Folder}.
	 * @property
	 * @type String
	 */
	objectModified : 'objectModified'
};
