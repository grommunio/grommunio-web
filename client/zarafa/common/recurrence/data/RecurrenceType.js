Ext.namespace('Zarafa.common.recurrence.data');

/**
 * @class Zarafa.common.recurrence.data.RecurrenceType
 * @extends Zarafa.core.Enum
 *
 * Enumerates all possible recurrence types
 *
 * @singleton
 */
Zarafa.common.recurrence.data.RecurrenceType = Zarafa.core.Enum.create({
	/**
	 * No recurrence
	 *
	 * @property
	 * @type Number
	 */
	NONE : 0,
    /**
	 * Daily recurrence
	 *
	 * @property
	 * @type Number
	 */
	DAILY : 10,
    /**
	 * Weekly recurrence
	 *
	 * @property
	 * @type Number
	 */
	WEEKLY : 11,
    /**
	 * Monthly recurrence
	 *
	 * @property
	 * @type Number
	 */
	MONTHLY : 12,
    /**
	 * Yearly recurrence
	 *
	 * @property
	 * @type Number
	 */
	YEARLY : 13
});

