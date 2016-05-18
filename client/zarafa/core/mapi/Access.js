Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.Access
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different access flags
 * 
 * @singleton
 */
Zarafa.core.mapi.Access = Zarafa.core.Enum.create({
	/**
	 * Denotes that write access is given
	 * @property
	 * @type Number
	 */
	ACCESS_MODIFY					: 0x00000001,

	/**
	 * Denotes that read access is given
	 * @property
	 * @type Number
	 */
	ACCESS_READ 					: 0x00000002,

	/**
	 * Denotes that delete access is given
	 * @property
	 * @type Number
	 */
	ACCESS_DELETE					: 0x00000004,

	/**
	 * Denotes that access is given to create subfolders in the folder hierarchy
	 * @property
	 * @type Number
	 */
	ACCESS_CREATE_HIERARCHY			: 0x00000008,

	/**
	 * Denotes that access is given to create content messages
	 * @property
	 * @type Number
	 */
	ACCESS_CREATE_CONTENTS			: 0x00000010,

	/**
	 * Denotes that access is given to create associated content messages
	 * @property
	 * @type Number
	 */
	ACCESS_CREATE_ASSOCIATED		: 0x00000020
});