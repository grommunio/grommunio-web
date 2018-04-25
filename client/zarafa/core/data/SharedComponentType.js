Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.SharedComponentType
 * @extends Zarafa.core.Enum
 * 
 * Used in the bidSharedComponent method in the {@link Zarafa.core.Container Container} 
 * to indicate what type of component is requested by the initiator of the bidding round.
 * 
 * @singleton
 */
Zarafa.core.data.SharedComponentType = Zarafa.core.Enum.create({
	/**
	 * A dialog that creates a new record/message
	 * @property
	 * @type Number
	 */
	'common.create' : 1,

	/**
	 * A dialog that views a record
	 * @property
	 * @type Number
	 */
	'common.view' : 2,

	/**
	 * A whole previewpanel 
	 * @property
	 * @type Number
	 */
	'common.preview' : 3,

	/**
	 * A context menu
	 * @property
	 * @type Number
	 */
	'common.contextmenu' : 4,

	/**
	 * A dialog that views search result
	 */
	'common.search' : 5,

	/**
	 * A hover card
	 * @property
	 * @type Number
	 */
	'common.hovercard': 6
});

