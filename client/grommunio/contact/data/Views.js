Ext.namespace('Grommunio.contact.data');

/**
 * @class Grommunio.contact.data.Views
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different views of the contact context.
 *
 * @singleton
 */
Grommunio.contact.data.Views = Grommunio.core.Enum.create({
	/**
	 * View all contact items from the selected folder(s) in the 'card' view.
	 *
	 * @property
	 * @type Number
	 */
	ICON: 0,

	/**
	 * View all contact items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST: 1,

	/**
	 * View the found contact items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 2
});
