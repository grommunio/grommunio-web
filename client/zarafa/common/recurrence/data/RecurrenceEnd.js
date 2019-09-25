Ext.namespace('Zarafa.common.recurrence.data');

/**
 * @class Zarafa.common.recurrence.data.RecurrenceEnd
 * @extends Zarafa.core.Enum
 *
 * Enumerates all possible recurrence endings
 *
 * @singleton
 */
Zarafa.common.recurrence.data.RecurrenceEnd = Zarafa.core.Enum.create({
    /**
	 * Recurrence never ends
	 *
	 * @property
	 * @type Object
	 */
	NEVER : 0x23,
    /**
	 * Recurrence ends after N occurences
	 *
	 * @property
	 * @type Object
	 */
	N_OCCURENCES : 0x22,
    /**
	 * Recurrence ends on date
	 *
	 * @property
	 * @type Object
	 */
	ON_DATE : 0x21
});
