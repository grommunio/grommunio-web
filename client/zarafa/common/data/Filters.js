Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data.Filters
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different filters for the stores.
 *
 * @singleton
 */
Zarafa.common.data.Filters = Zarafa.core.Enum.create({
	/**
	 * UNREAD which used to filter all unread items from store.
	 *
	 * @property
	 * @type Number
	 */
	UNREAD : 0
});
