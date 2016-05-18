Ext.namespace('Zarafa.common.rules.data');

/**
 * @class Zarafa.common.rules.data.ActionFlags
 * @extends Zarafa.core.Enum
 * @singleton
 */
Zarafa.common.rules.data.ActionFlags = Zarafa.core.Enum.create({
	/**
	 * Indicates that the action is unknown/unsupported
	 * @property
	 * @type Number
	 */
	UNKNOWN : -1,

	/**
	 * Indicates that the "Move Message To" action is selected
	 * @property
	 * @type Number
	 */
	MOVE : 1,

	/**
	 * Indicates that the "Copy Message To" action is selected
	 * @property
	 * @type Number
	 */
	COPY : 2,

	/**
	 * Indicates that the "Move Message to Deleted Items" action is selected
	 * @property
	 * @type Number
	 */
	DELETE : 3,

	/**
	 * Indicates that the "Redirect Message To" action is selected
	 * @property
	 * @type Number
	 */
	REDIRECT : 4,

	/**
	 * Indicates that the "Forward Message To" action is selected
	 * @property
	 * @type Number
	 */
	FORWARD : 5,

	/**
	 * Indicates that the "Forward Message as Attachment To" action is selected
	 * @property
	 * @type Number
	 */
	FORWARD_ATTACH : 6
});
