Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.MAPIFolderType
 * @extends Zarafa.core.Enum
 *
 * Enumerates that indicates the folder type.
 * @singleton
 */
Zarafa.core.mapi.MAPIFolderType = Zarafa.core.Enum.create({
	/**
	 * The root folder of the folder hierarchy table,
	 * that is, a folder that has no parent folder.
	 * @property
	 * @type Number
	 */
	FOLDER_ROOT : 0x00000000,

	/**
	 * A generic folder that contains messages and other folders.
	 * @property
	 * @type Number
	 */
	FOLDER_GENERIC : 0x00000001,

	/**
	 * A folder that contains the results of a search,
	 * in the form of links to messages that meet search criteria.
	 * @property
	 * @type Number
	 */
	FOLDER_SEARCH : 0x00000002
});
