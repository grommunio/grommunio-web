/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.MeetingType
 * @extends Grommunio.core.Enum
 * 
 * @singleton
 */
Grommunio.core.mapi.MeetingType = Grommunio.core.Enum.create({
	/**
	 * Denotes that the client has not set this property for the message.
	 * @property
	 * @type Number
	 */
	MEETING_NONE	: 0x00000000,

	/**
	 * Denotes that the message is a new meeting request.
	 * @property
	 * @type Number
	 */
	MEETING_REQUEST	: 0x00000001,

	/**
	 * Denotes that the message is a full update of a prior meeting request.
	 * @property
	 * @type Number
	 */
	MEETING_FULL_UPDATE	: 0x00010000,		// 65536

	/**
	 * Denotes that the message is an informational update of a prior meeting request.
	 * @property
	 * @type Number
	 */
	MEETING_INFO_UPDATE	: 0x00020000,		// 131072

	/**
	 * Denotes that the message is out-of-date and a more recent update has been sent to the recipient.
	 * @property
	 * @type Number
	 */
	MEETING_OUT_OF_DATE	: 0x00080000,		// 524288

	/**
	 * Denotes that the message is a copy of a meeting request,
	 * or a copy of an update of a prior meeting request received by the principal recipient.
	 * The original meeting request or the update has been sent to a delegate of the principal.
	 * @property
	 * @type Number
	 */
	MEETING_DELEGATED	: 0x00100000		// 1048576
});
