Ext.namespace('Zarafa.common.recurrence.data');

/**
 * @class Zarafa.common.recurrence.data.RecurrenceSubtype
 * @extends Zarafa.core.Enum
 *
 * Enumerates all possible recurrence subtypes
 *
 * @singleton
 */
Zarafa.common.recurrence.data.RecurrenceSubtype = Zarafa.core.Enum.create({
    /**
	 * For daily recurrence, recur every N days.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.DAILY DAILY}.
	 *
	 * @property
	 * @type Object
	 */
	DAILY_EVERY_N_DAYS : { type: 0, regen : 0 },
    /**
	 * For daily recurrence, recur every weekday.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.DAILY DAILY}.
	 *
	 * @property
	 * @type Object
	 */
	DAILY_WEEKDAYS : { type : 1, regen : 0 },
    /**
	 * For daily recurrence, recur every N days after completion.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.DAILY DAILY}.
	 *
	 * @property
	 * @type Object
	 */
	DAILY_REGENERATE : { type : 0, regen : 1 },
    /**
	 * For weekly recurrence, recur every N weeks after completion.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.WEEKLY WEEKLY}.
	 *
	 * @property
	 * @type Object
	 */
	WEEKLY_REGENERATE : { type : 0, regen : 1 },
    /**
	 * For weekly recurrence, recur every N weeks.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.WEEKLY WEEKLY}.
	 *
	 * @property
	 * @type Object
	 */
	WEEKLY : { type : 1, regen : 0 },
    /**
	 * For monthly recurrence, recur Nth day of the month.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.MONTHLY MONTHLY}.
	 *
	 * @property
	 * @type Object
	 */
	MONTHLY_N_DAY_OF_MONTH : { type : 2, regen : 0 },
    /**
	 * For monthly recurrence, recur Nth weekday of the month.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.MONTHLY MONTHLY}.
	 *
	 * @property
	 * @type Object
	 */
	MONTHLY_N_WEEKDAY_OF_MONTH: { type : 3, regen : 0 },
    /**
	 * For monthly recurrence, recur N months after completion.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.MONTHLY MONTHLY}.
	 *
	 * @property
	 * @type Object
	 */
	MONTHLY_REGENERATE : { type : 2, regen : 1 },
    /**
	 * For yearly recurrence, recur Every Nth day of month M.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.YEARLY YEARLY}.
	 *
	 * @property
	 * @type Object
	 */
	YEARLY_MONTH : { type : 2, regen : 0 },
    /**
	 * For yearly recurrence, recur Nth weekday of month M.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.YEARLY YEARLY}.
	 *
	 * @property
	 * @type Object
	 */
	YEARLY_N_WEEKDAY : { type : 3, regen : 0 },
    /**
	 * For yearly recurrence, recur N years after completion.
	 * Use in combination with {@link Zarafa.common.recurrence.data.RecurrenceType.YEARLY YEARLY}.
	 *
	 * @property
	 * @type Object
	 */
	YEARLY_REGENERATE : { type : 2, regen : 1 }
});
