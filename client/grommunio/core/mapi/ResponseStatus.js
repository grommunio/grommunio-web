/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.ResponseStatus
 * @extends Grommunio.core.Enum
 *
 * @singleton
 */
Grommunio.core.mapi.ResponseStatus = Grommunio.core.Enum.create({
	/**
	 * Denotes that no response is required
	 * @property
	 * @type Number
	 */
	RESPONSE_NONE		: 0,

	/**
	 * Denotes that the message belongs to meeting organizer
	 * @property
	 * @type Number
	 */
	RESPONSE_ORGANIZED	: 1,

	/**
	 * Denotes that attendee has tentatively accepted the meeting request
	 * @property
	 * @type Number
	 */
	RESPONSE_TENTATIVE	: 2,

	/**
	 * Denotes that attendee has accepted the meeting request
	 * @property
	 * @type Number
	 */
	RESPONSE_ACCEPTED	: 3,
	/**
	 * Denotes that attendee has declined the meeting request
	 * @property
	 * @type Number
	 */
	RESPONSE_DECLINED	: 4,

	/**
	 * Denotes that attendee has not yet responded to the meeting request
	 * @property
	 * @type Number
	 */
	RESPONSE_NOT_RESPONDED	: 5,

	/**
	 * Return the display name for the given Response Status
	 * @param {Grommunio.core.mapi.ResponseStatus} responsestatus The given response status
	 * @return {String} The display name for the response status
	 */
	getDisplayName: function(responsestatus)
	{
		switch (responsestatus) {
			case Grommunio.core.mapi.ResponseStatus.RESPONSE_ORGANIZED:
				return _('Organizer');
			case Grommunio.core.mapi.ResponseStatus.RESPONSE_NONE:
				return _('No response');
			case Grommunio.core.mapi.ResponseStatus.RESPONSE_NOT_RESPONDED:
				return _('Not responded');
			case Grommunio.core.mapi.ResponseStatus.RESPONSE_TENTATIVE:
				return _('Tentative');
			case Grommunio.core.mapi.ResponseStatus.RESPONSE_ACCEPTED:
				return _('Accepted');
			case Grommunio.core.mapi.ResponseStatus.RESPONSE_DECLINED:
				return _('Declined');
		}
		return '';
	}
});
