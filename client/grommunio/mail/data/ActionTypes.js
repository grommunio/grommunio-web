/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.data');

/**
 * @class Grommunio.mail.data.ActionTypes
 *
 * An enum that contains all possible Action types which
 * can be used on a {@link Grommunio.mail.MailRecord MailRecord} which
 * is being send to the server.
 *
 * @singleton
 */
Grommunio.mail.data.ActionTypes =
{
	/**
	 * The message is a reply to an different {@link Grommunio.mail.MaiLRecord MailRecord}
	 * @property
	 * @type String
	 */
	REPLY		: 'reply',

	/**
	 * The message is a reply-all to an different {@link Grommunio.mail.MaiLRecord MailRecord}
	 * @property
	 * @type String
	 */
	REPLYALL	: 'replyall',

	/**
	 * The message is a forward from an different {@link Grommunio.mail.MaiLRecord MailRecord}
	 * @property
	 * @type String
	 */
	FORWARD		: 'forward',

	/**
	 * The message is a forward-as-attachment from an different {@link Grommunio.mail.MaiLRecord MailRecord}
	 * @property
	 * @type String
	 */
	FORWARD_ATTACH	: 'forward_attach',

	/**
	 * The message is an "edit as new" message created from a different {@link Grommunio.mail.MaiLRecord MailRecord}
	 * @property
	 * @type String
	 */
	EDIT_AS_NEW	: 'edit_as_new',

	/**
	 * Method used to determine if the given parameter is one of the known {@link Grommunio.mail.data.ActionTypes actiontype}.
	 * @param {String} actionType what action type to check.
	 * @return {Boolean} true if the given action type is one of the types defined in this class.
	 */
	isSendOrForward: function(actionType)
	{
		return actionType === this.REPLY || actionType === this.REPLYALL || actionType === this.FORWARD || actionType === this.FORWARD_ATTACH;
	}
};
