Ext.namespace('Grommunio.mail.data');

/**
 * @class Grommunio.mail.data.DataModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different data modes of the mail context.
 *
 * @singleton
 */
Grommunio.mail.data.DataModes = Grommunio.core.Enum.create({
	/**
	 * View all mail items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	ALL: 0,
	/**
	 * View all found mail items in the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 1,
	/**
	 * View all unread filtered mail items in the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	UNREAD: 2
});
