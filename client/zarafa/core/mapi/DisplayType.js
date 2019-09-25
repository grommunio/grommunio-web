Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.DisplayType
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different Display types.
 * 
 * @singleton
 */
Zarafa.core.mapi.DisplayType = Zarafa.core.Enum.create({
	/***********  For address book contents tables ***********/

	/**
	 * Denotes a typical messaging user.
	 * @property
	 * @type Number
	 */
	DT_MAILUSER : 0x00000000,

	/**
	 * Denotes a distribution list.
	 * @property
	 * @type Number
	 */
	DT_DISTLIST : 0x00000001,

	/**
	 * Denotes a forum, such as a bulletin board service or a public or shared folder.
	 * @property
	 * @type Number
	 */
	DT_FORUM : 0x00000002,

	/**
	 * Denotes an automated agent, such as Quote-Of-The-Day or a weather chart display.
	 * @property
	 * @type Number
	 */
	DT_AGENT : 0x00000003,

	/**
	 * Denotes a special alias defined for a large group, such as helpdesk, accounting, or blood-drive coordinator.
	 * @property
	 * @type Number
	 */
	DT_ORGANIZATION : 0x00000004,

	/**
	 * Denotes a private, personally administered distribution list.
	 * @property
	 * @type Number
	 */
	DT_PRIVATE_DISTLIST : 0x00000005,

	/**
	 * Denotes a recipient known to be from a foreign or remote messaging system.
	 * @property
	 * @type Number
	 */
	DT_REMOTE_MAILUSER : 0x00000006,

	/*********** For folder hierarchy tables ***********/
  
	/**
	 * Display default folder icon adjacent to folder.
	 * @property
	 * @type Number
	 */
	DT_FOLDER : 0x01000000,

	/**
	 * Display default folder link icon adjacent to folder rather than the default folder icon.
	 * @property
	 * @type Number
	 */
	DT_FOLDER_LINK : 0x02000000,

	/**
	 * Display icon for a folder with an application-specific distinction, such as a special type of public folder.
	 * @property
	 * @type Number
	 */
	DT_FOLDER_SPECIAL : 0x04000000,

	/*********** For address book hierarchy tables ***********/

	/**
	 * The container should be denoted as modifiable in the user interface.
	 * @property
	 * @type Number
	 */
	DT_MODIFIABLE : 0x00010000,

	/**
	 * Denotes a global address book.
	 * @property
	 * @type Number
	 */
	DT_GLOBAL : 0x00020000,

	/**
	 * Denotes a local address book that you share with a small workgroup.
	 * @property
	 * @type Number
	 */
	DT_LOCAL : 0x00030000,

	/**
	 * Denotes a wide area network address book.
	 * @property
	 * @type Number
	 */
	DT_WAN : 0x00040000,

	/**
	 * Does not match any of the other settings.
	 * @property
	 * @type Number
	 */
	DT_NOT_SPECIFIC : 0x00050000
});
