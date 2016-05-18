Ext.namespace('Zarafa.mail.data');

/**
 * @class Zarafa.mail.data.DataModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different data modes of the mail context. 
 * 
 * @singleton
 */
Zarafa.mail.data.DataModes = Zarafa.core.Enum.create({
	/**
	 * View all mail items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	ALL : 0,
	/**
	 * View all found mail items in the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 1
});
