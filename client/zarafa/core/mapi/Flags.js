Ext.namespace("Zarafa.core.mapi");

/**
 * @class Zarafa.core.mapi.FlagStatus
 * @extends Zarafa.core.Enum
 * @singleton
 */
Zarafa.core.mapi.FlagStatus = Zarafa.core.Enum.create({
	
	/**
	 * @property
	 * @type Number
	 * Indicates that the flag status property is cleared (neither flagged or completed).
	 */
	cleared : 0,

	/**
	 * @property
	 * @type Number
	 * Indicates that an item is completed.
	 */
	completed : 1,
	
	/**
	 * @property
	 * @type Number
	 * Indicates that an item is flagged.
	 */
	flagged : 2

});

/**
 * @class Zarafa.core.mapi.FlagIcon
 * @extends Zarafa.core.Enum
 * @singleton
 */
Zarafa.core.mapi.FlagIcon = Zarafa.core.Enum.create({
	/**
	 * @property
	 * @type Number
	 * The item should not be displayed with any flag.
	 */
	clear : 0,

	/**
	 * @property
	 * @type Number
	 * The item should be displayed with a purple flag.
	 */
	purple : 1,

	/**
	 * @property
	 * @type Number
	 * The item should be displayed with a orange flag.
	 */
	orange : 2,
	
	/**
	 * @property
	 * @type Number
	 * The item should be displayed with a green flag.
	 */
	green : 3,
	
	/**
	 * @property
	 * @type Number
	 * The item should be displayed with a yellow flag.
	 */
	yellow : 4,
	
	/**
	 * @property
	 * @type Number
	 * The item should be displayed with a blue flag.
	 */
	blue : 5,
	
	/**
	 * @property
	 * @type Number
	 * The item should be displayed with a red flag.
	 */
	red : 6

});
