Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.Actions
 * List of valid action types. Action types are used for identifying request and response types for modules.
 * For instance, to request a mail from the server the client performs an 'open' action on the 'previewreadmailitemmodule'.
 * The server then responds with an 'item' action, containing the email data.
 * @singleton
 */
Zarafa.core.Actions = 
{
	/**
	 * The list action retrieves a list of items such as mails, tasks, etc. The server then responds with a list action containing
	 * a list of items. 
	 * @property
	 * @type String
	 */
	list : "list",

	/**
	 * Retrieves a list of entries in the global address book  
	 * @property
	 * @type String
	 */
	globaladdressbook : "globaladdressbook",

	/**
	 * Retrieves the hierarchy, a set of stores and folders within those stores. Used for updating the
	 * hierarchy tree.  
	 * @property
	 * @type String
	 */
	hierarchy : "hierarchy",

	/**
	 * Open an item, usually a mail item. The server responds with an item action.
	 * @property
	 * @type String
	 */
	open : 'open',

	/**
	 * Can mean different things in different contexts. Can be used to request a single item from the server, and is returned by the
	 * server to return the contents on a single item.  
	 * @property
	 * @type String
	 */
	item : 'item',

	/**
	 * Update item(s)
	 * @property
	 * @type String
	 */
	update : 'update',

	/**
	 * Save an item. 
	 * @property
	 * @type String
	 */
	save : 'save',

	/**
	 * Copy an item. 
	 * @property
	 * @type String
	 */
	copy : 'copy',

	/**
	 * Delete an item. 
	 * @property
	 * @type String
	 */
	'delete' : 'delete',

	/**
	 * Gets folder details. 
	 * @property
	 * @type String
	 */
	folder : 'folder',

	/**
	 * Used for setting properties. 
	 * @property
	 * @type String
	 */
	set : 'set',

	/**
	 * Used for getting properties. 
	 * @property
	 * @type String
	 */
	get : 'get',

	/**
	 * Used for reset properties. 
	 * @property
	 * @type String
	 */
	reset : 'reset',

	/**
	 * Used for deleting properties/items. 
	 * @property
	 * @type String
	 */
	_delete : 'delete',

	/**
	 * Used for searching on a folder.
	 * @property
	 * @type String
	 */
	search : 'search',

	/**
	 * Used for incremental search on folder.
	 * @property
	 * @type String
	 */
	updatesearch : 'updatesearch',
	
	/**
	 * Used for live scroll.
	 * @property
	 * @type String
	 */
	updatelist : 'updatelist',

	/**
	 * Used for stopping search on folder.
	 * @property
	 * @type String
	 */
	stopsearch : 'stopsearch',

	/**
	 * Used for requesting contacts from addressbook
	 * @property
	 * @type String
	 */		
	contacts : 'contacts',

	/**
	 * Used to send a keepalive to the server
	 * @property
	 * @type String
	 */
	keepalive: 'keepalive',

	/**
	 * Used to send a request to destroy the session to the server
	 * @property
	 * @type String
	 */
	destroysession: 'destroysession',

	/**
	 * Used when receiving update from server indicating there is new mail
	 * @property
	 * @type String
	 */
	newmail: 'newmail',

	/**
	 * Used for creating new folder
	 * @property
	 * @type String
	 */
	addFolder: 'add',

	/**
	 * Used for renaming folder in tree
	 * @property
	 * @type String
	 */
	modifyFolder: 'modify',

	/**
	 * Used for deleteing folder from tree
	 * @property
	 * @type String
	 */
	deleteFolder: 'delete',

	/**
	 * Used on Deleted Items to empty the folder
	 * @property
	 * @type String
	 */
	emptyFolder: 'emptyfolder',

	/**
	 * Used on folders to mark all messages as 'read'
	 * @property
	 * @type String
	 */
	readAllMsgs: 'readflags',
	/**
	 * Used in {@link Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel FolderPropertiesContentPanel} show/update folder props
	 * @property
	 * @type String
	 */
	folderProps: 'folderprops',
	/**
	 * Used in {@link Zarafa.core.data.IPMRecipientStoreCheckNamesProxy IPMRecipientStoreCheckNamesProxy} for resolve requests
	 * @property
	 * @type String
	 */
	checknames: 'checknames',

	/**
	 * Used in {@link Zarafa.core.data.IPMExpandDistlistProxy IPMExpandDistlistProxy} for expand requests
	 * @property
	 * @type String
	 */
	expand: 'expand',

	/**
	 * Used in {@link Zarafa.core.data.IPMAttachmentProxy IPMAttachmentProxy} for uploading attachments.
	 * @property
	 * @type String
	 */
	upload : 'upload',

	/**
	 * Used for importing attached item into folder
	 * @property
	 * @type String
	 */
	import : 'import'
};
