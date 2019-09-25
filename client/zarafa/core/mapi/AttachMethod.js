Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.AttachMethod
 * @extends Zarafa.core.Enum
 * 
 * @singleton
 */
Zarafa.core.mapi.AttachMethod = Zarafa.core.Enum.create({
	/**
	 * Denotes that the attachment has just been created.
	 * @property
	 * @type Number
	 */
	NO_ATTACHMENT : 0,

	/**
	 * Denotes that the PR_ATTACH_DATA_BIN (PidTagAttachDataBinary) property contains the attachment data.
	 * @property
	 * @type Number
	 */
	ATTACH_BY_VALUE : 1,

	/**
	 * Denotes that the PR_ATTACH_PATHNAME (PidTagAttachPathname) or PR_ATTACH_LONG_PATHNAME (PidTagAttachLongPathname)
	 * property contains a fully-qualified path identifying the attachment to recipients with access to
	 * a common file server.
	 * @property
	 * @type Number
	 */
	ATTACH_BY_REFERENCE : 2,

	/**
	 * Denotes that the PR_ATTACH_PATHNAME or PR_ATTACH_LONG_PATHNAME property contains
	 * a fully-qualified path identifying the attachment.
	 * @property
	 * @type Number
	 */
	ATTACH_BY_REF_RESOLVE : 3,

	/**
	 * Denotes that the PR_ATTACH_PATHNAME or PR_ATTACH_LONG_PATHNAME property contains
	 * a fully-qualified path identifying the attachment.
	 * @property
	 * @type Number
	 */
	ATTACH_BY_REF_ONLY : 4,

	/**
	 * Denotes that the PR_ATTACH_DATA_OBJ (PidTagAttachDataObject) property contains an
	 * embedded object that supports the IMessage interface.
	 * @property
	 * @type Number
	 */
	ATTACH_EMBEDDED_MSG : 5,

	/**
	 * Denotes that the attachment is an embedded OLE object.
	 * @property
	 * @type Number
	 */
	ATTACH_OLE : 6
});