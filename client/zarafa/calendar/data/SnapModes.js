Ext.namespace('Zarafa.calendar.data');

/**
 * @class Zarafa.calendar.data.SnapModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different snap modes of the calendar context. 
 * 
 * @singleton
 */
Zarafa.calendar.data.SnapModes = Zarafa.core.Enum.create({
	/**
	 * Preserve current time.
	 *
	 * @property
	 * @type String
	 */
	NONE : 1,

	/**
	 * All selections should snap to the entire day.
	 *
	 * @property
	 * @type String
	 */
	DAY : 2,

	/**
	 * All selections should snap to the smallest time which is
	 * supported by the current zoomlevel.
	 *
	 * @property
	 * @type String
	 */
	ZOOMLEVEL : 3
});
