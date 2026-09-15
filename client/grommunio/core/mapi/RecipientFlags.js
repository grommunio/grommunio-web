/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.RecipientFlags
 * @extends Grommunio.core.Enum
 *
 * Enumerates the different recipient flags.
 * any combination of these flags can be saved recipient_flags property.
 *
 * @singleton
 */
Grommunio.core.mapi.RecipientFlags = Grommunio.core.Enum.create({
	/**
	 * Denotes that the recipient is a sendable attendee of the meeting request.
	 * @property
	 * @type Number
	 */
	recipSendable: 1,

	/**
	 * Denotes that the recipient is an organizer of the meeting request.
	 * @property
	 * @type Number
	 */
	recipOrganizer: 2,

	/**
	 * Denotes that the recipient gave a response for the exception of the meeting request.
	 * @property
	 * @type Number
	 */
	recipExceptionalResponse: 16,

	/**
	 * Denotes that the recipient is deleted from the exception of the meeting request.
	 * @property
	 * @type Number
	 */
	recipExceptionalDeleted: 32,

	/**
	 * Denotes that the recipient is deleted from the exception of the meeting request.
	 * @property
	 * @type Number
	 */
	recipOriginal: 256,

	/**
	 * Reserved Flag.
	 * @property
	 * @type Number
	 */
	recipReserved: 512
});
