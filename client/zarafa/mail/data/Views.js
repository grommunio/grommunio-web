Ext.namespace('Zarafa.mail.data');

/**
 * @class Zarafa.mail.data.Views
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different views of the mail context. 
 * 
 * @singleton
 */
Zarafa.mail.data.Views = Zarafa.core.Enum.create({
	/**
	 * View all mail items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST : 0,

	/**
	 * View all found mail items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 1,

	/**
	 * View all updated batch of mail items from the selected folder(s) in the 'list' view.
	 * 
	 * @property
	 * @type Number
	 */
	LIVESCROLL : 2
});
