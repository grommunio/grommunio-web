Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.ObjectType
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different object types
 * 
 * @singleton
 */
Zarafa.core.mapi.ObjectType = Zarafa.core.Enum.create({
	/**
	 * Denotes that the MAPI Store
	 * @property
	 * @type Number
	 */
	MAPI_STORE		: 1,
	/**
	 * Denotes that the MAPI Address Book
	 * @property
	 * @type Number
	 */
	MAPI_ADDRBOOK	: 2,
	/**
	 * Denotes that the MAPI Folder
	 * @property
	 * @type Number
	 */
	MAPI_FOLDER		: 3,
	/**
	 * Denotes that the MAPI Address Book Container
	 * @property
	 * @type Number
	 */
	MAPI_ABCONT		: 4,
	/**
	 * Denotes that the MAPI Message
	 * @property
	 * @type Number
	 */
	MAPI_MESSAGE	: 5,
	/**
	 * Denotes that the MAPI Address Book MailUser
	 * @property
	 * @type Number
	 */
	MAPI_MAILUSER	: 6,
	/**
	 * Denotes that the MAPI Attachment
	 * @property
	 * @type Number
	 */
	MAPI_ATTACH		: 7,
	/**
	 * Denotes that the MAPI Address Book Distribution List
	 * @property
	 * @type Number
	 */
	MAPI_DISTLIST	: 8,
	/**
	 * Denotes that the MAPI Profile Section
	 * @property
	 * @type Number
	 */
	MAPI_PROFSECT	: 9,
	/**
	 * Denotes that the MAPI Status
	 * @property
	 * @type Number
	 */
	MAPI_STATUS		: 10,
	/**
	 * Denotes that the MAPI Session
	 * @property
	 * @type Number
	 */
	MAPI_SESSION	: 11,
	/**
	 * Denotes that the MAPI Form Information
	 * @property
	 * @type Number
	 */
	MAPI_FORMINFO	: 12
});
