Ext.namespace('Zarafa.mail.data');

/**
 * @class Zarafa.mail.data.ActionTypes
 * 
 * An enum that contains all possible Action types which
 * can be used on a {@link Zarafa.mail.MailRecord MailRecord} which
 * is being send to the server.
 * 
 * @singleton
 */
Zarafa.mail.data.ActionTypes =
{
	/**
	 * The message is a reply to an different {@link Zarafa.mail.MaiLRecord MailRecord}
	 * @property
	 * @type String
	 */
	REPLY		: 'reply',

	/**
	 * The message is a reply-all to an different {@link Zarafa.mail.MaiLRecord MailRecord}
	 * @property
	 * @type String
	 */
	REPLYALL	: 'replyall',

	/**
	 * The message is a forward from an different {@link Zarafa.mail.MaiLRecord MailRecord}
	 * @property
	 * @type String
	 */
	FORWARD		: 'forward',

	/**
	 * The message is a forward-as-attachment from an different {@link Zarafa.mail.MaiLRecord MailRecord}
	 * @property
	 * @type String
	 */
	FORWARD_ATTACH	: 'forward_attach',

	/**
	 * The message is an "edit as new" message created from a different {@link Zarafa.mail.MaiLRecord MailRecord}
	 * @property
	 * @type String
	 */
	EDIT_AS_NEW	: 'edit_as_new',

	/**
	 * Method used to determine if the given parameter is one of the known {@link Zarafa.mail.data.ActionTypes actiontype}.
	 * @param {String} actionType what action type to check.
	 * @return {Boolean} true if the given action type is one of the types defined in this class.
	 */
	isSendOrForward : function(actionType)
	{
		return actionType === this.REPLY || actionType === this.REPLYALL || actionType === this.FORWARD || actionType === this.FORWARD_ATTACH;
	}
};
