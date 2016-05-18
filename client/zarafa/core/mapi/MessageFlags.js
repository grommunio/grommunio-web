Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.Sensitivity
 * @extends Zarafa.core.Enum
 * 
 * @singleton
 */
Zarafa.core.mapi.MessageFlags = Zarafa.core.Enum.create({
	/**
	 * Denotes that the message is marked as having been read.
	 * @property
	 * @type Number
	 */
	MSGFLAG_READ : 0x00000001,
	
	/**
	 * Denotes that the outgoing message has not been modified since the first time that it was saved,
	 * the incoming message has not been modified since it was delivered.
	 * @property
	 * @type Number
	 */
	MSGFLAG_UNMODIFIED : 0x00000002,
	
	/**
	 * Denotes that the message is marked for sending as a result of a call to IMessage::SubmitMessage.
	 * @property
	 * @type Number
	 */
	MSGFLAG_SUBMIT : 0x00000004,

	/**
	 * Denotes that the message is saved but has not been sent.
	 * @property
	 * @type Number
	 */
	MSGFLAG_UNSENT : 0x00000008,

	/**
	 * Denotes that the message has at least one attachment.
	 * @property
	 * @type Number
	 */
	MSGFLAG_HASATTACH : 0x00000010,

	/**
	 * Denotes that the message sender and receiver both are same.
	 * @property
	 * @type Number
	 */
	MSGFLAG_FROMME : 0x00000020,

	/**
	 * Denotes that the message is an associated message of a folder.
	 * @property
	 * @type Number
	 */
	MSGFLAG_ASSOCIATED : 0x00000040,

	/**
	 * Denotes that the message includes a request for a resend operation with a nondelivery report.
	 * @property
	 * @type Number
	 */
	MSGFLAG_RESEND : 0x00000080,

	/**
	 * Denotes that a read report needs to be sent for the message.
	 * @property
	 * @type Number
	 */
	MSGFLAG_RN_PENDING : 0x00000100,

	/**
	 * Denotes that a nonread report needs to be sent for the message.
	 * @property
	 * @type Number
	 */
	MSGFLAG_NRN_PENDING : 0x00000200
});