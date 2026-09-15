Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.common.data.DataModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different data modes.
 *
 * @singleton
 */
Grommunio.common.data.DataModes = Grommunio.core.Enum.create({
	/**
	 * View all context items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	ALL: 0,
	/**
	 * View all found context items in the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 1
});
