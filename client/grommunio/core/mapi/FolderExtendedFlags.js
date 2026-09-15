Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.FolderExtendedFlags
 * @extends Grommunio.core.Enum
 *
 * @singleton
 */
Grommunio.core.mapi.FolderExtendedFlags = Grommunio.core.Enum.create({
	/**
	 * Denotes default implementation
	 * @property
	 * @type Number
	 */
	DEFAULT: 0,

	/**
	 * Denotes that the unread count should be used
	 * @property
	 * @type Number
	 */
	USE_UNREAD_COUNT: 1,

	/**
	 * Denotes that the total count should be used
	 * @property
	 * @type Number
	 */
	USE_TOTAL_COUNT: 3
});
