Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.common.data.Filters
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different filters for the stores.
 *
 * @singleton
 */
Grommunio.common.data.Filters = Grommunio.core.Enum.create({
	/**
	 * UNREAD which used to filter all unread items from store.
	 *
	 * @property
	 * @type Number
	 */
	UNREAD: 0
});
