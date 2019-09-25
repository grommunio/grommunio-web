Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data.DataModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different data modes. 
 * 
 * @singleton
 */
Zarafa.common.data.DataModes = Zarafa.core.Enum.create({
	/**
	 * View all context items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	ALL : 0,
	/**
	 * View all found context items in the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 1
});
