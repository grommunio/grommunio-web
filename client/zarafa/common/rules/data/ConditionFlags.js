Ext.namespace('Zarafa.common.rules.data');

/**
 * @class Zarafa.common.rules.data.ConditionFlags
 * @extends Zarafa.core.Enum
 * @singleton
 */
Zarafa.common.rules.data.ConditionFlags = Zarafa.core.Enum.create({
	/**
	 * Indicates that the condition is unknown/unsupported
	 * @property
	 * @type Number
	 */
	UNKNOWN : -1,

	/**
	 * Indicates that the condition checks whom has sent it
	 * @property
	 * @type Number
	 */
	RECEIVED_FROM : 1,

	/**
	 * Indicates that the condition checks to whom it was sent
	 * @property
	 * @type Number
	 */
	SENT_TO : 2,

	/**
	 * Indicates that the condition checks which words are in the subject
	 * @property
	 * @type Number
	 */
	SUBJECT_WORDS : 3,

	/**
	 * Indicates that the condition checks which words are in the body
	 * @property
	 * @type Number
	 */
	BODY_WORDS : 4,

	/**
	 * Indicates that the condition checks which words are in the sender
	 * @property
	 * @type Number
	 */
	SENDER_WORDS : 5,

	/**
	 * Indicates that the condition checks if the user is in the To or CC field
	 * @property
	 * @type Number
	 */
	NAME_TO_CC : 6,

	/**
	 * Indicates that the condition checks if the message was sent with a certain importance
	 * @property
	 * @type Number
	 */
	IMPORTANCE : 7,

	/**
	 * Indicates that the condition checks if the message was sent only to the user
	 * @property
	 * @type Number
	 */
	SENT_TO_ME_ONLY : 8,

	/**
	 * Indicates that the condition checks if the message has an attachment
	 * @property
	 * @type Number
	 */
	ATTACHMENT : 9,

	/**
	 * Indicates that the condition checks if the message was sent with a certain sensitivity
	 * @property
	 * @type Number
	 */
	SENSITIVITY : 10,

	/**
	 * Indicates that the condition checks if the user is in the To field
	 * @property
	 * @type Number
	 */
	SENT_TO_ME : 11,

	/**
	 * Indicates that the condition checks if the message has my name in the Cc field
	 * @property
	 * @type Number
	 */
	SENT_CC_ME : 12,

	/**
	 * Indicates that the condition checks if the message was received before a certain date range
	 * @property
	 * @type Number
	 */
	RECEIVED_BEFORE: 13,

	/**
	 * Indicates that the condition checks if the message was received after a specific date range
	 * @property
	 * @type Number
	 */
	RECEIVED_AFTER: 14,

	/**
	 * Indicates that no condition will be applied. The rule always matches.
	 * @property
	 * @type Number
	 */
	NONE: 15,

	/**
	* Indicates that the condition checks which words are in the message-transport-header
	* @property
	* @type Number
	*/
	TRANSPORTHEADER_WORDS: 16
});
