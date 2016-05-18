Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.RuleActions
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different rule actions.
 * 
 * @singleton
 */
Zarafa.core.mapi.RuleActions = Zarafa.core.Enum.create({
	/**
	 * Rule action which indicates the message should
	 * be moved to a designated folder.
	 * @property
	 * @type Number
	 */
	OP_MOVE : 1,
	
	/**
	 * Rule action which indicates the message should
	 * be copied to a designated folder.
	 * @property
	 * @type Number
	 */
	OP_COPY : 2,

	/**
	 * @property
	 * @type Number
	 */
	OP_REPLY : 3,

	/**
	 * @property
	 * @type Number
	 */
	OP_OOF_REPLY : 4,

	/**
	 * @property
	 * @type Number
	 */
	OP_DEFER_ACTION : 5,

	/**
	 * @property
	 * @type Number
	 */
	OP_BOUNCE : 6,

	/**
	 * Rule action which indicates that the message should
	 * be forwarded to the designated recipients
	 * @property
	 * @type Number
	 */
	OP_FORWARD : 7,

	/**
	 * @property
	 * @type Number
	 */
	OP_DELEGATE : 8,

	/**
	 * @property
	 * @type Number
	 */
	OP_TAG : 9,

	/**
	 * Rule action which indicates that the message should
	 * be (hard-)deleted from the store
	 * @property
	 * @type Number
	 */
	OP_DELETE : 10,

	/**
	 * Rule action which indicates that the message should
	 * be marked as read
	 * @property
	 * @type Number
	 */
	OP_MARK_AS_READ : 11
});
