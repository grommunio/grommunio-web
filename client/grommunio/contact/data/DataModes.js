Ext.namespace('Grommunio.contact.data');

/**
 * @class Grommunio.contact.data.DataModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different data modes of the contact context.
 *
 * @singleton
 */
Grommunio.contact.data.DataModes = Grommunio.core.Enum.create({
	/**
	 * Lists all contact items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	ALL: 0,

	/**
	 * Lists all contact items from the selected folder(s) based on a first-character restriction.
	 *
	 * @property
	 * @type Number
	 */
	CHARACTER_RESTRICT: 1,

	/**
	 * Search for contacts in the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 2
});
