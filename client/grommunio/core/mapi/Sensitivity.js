/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.Sensitivity
 * @extends Grommunio.core.Enum
 *
 * @singleton
 */
Grommunio.core.mapi.Sensitivity = Grommunio.core.Enum.create({
	/**
	 * Denotes that the message has no special sensitivity.
	 * @property
	 * @type Number
	 */
	'NONE': 0x00000000,

	/**
	 * Denotes that the message is personal.
	 * @property
	 * @type Number
	 */
	'PERSONAL': 0x00000001,

	/**
	 * Denotes that the message is private.
	 * @property
	 * @type Number
	 */
	'PRIVATE': 0x00000002,

	/**
	 * Denotes that the message is designated company confidential.
	 * @property
	 * @type Number
	 */
	'COMPANY_CONFIDENTIAL': 0x00000003,

	/**
	 * Return the display name for the given sensitivity
	 * @param {Grommunio.core.mapi.Sensitivity} sensitivity The given sensitivity
	 * @return {String} The display name for the sensitivity
	 */
	getDisplayName: function(sensitivity)
	{
		switch (sensitivity) {
			case Grommunio.core.mapi.Sensitivity.NONE:
				return _("None");
			case Grommunio.core.mapi.Sensitivity.PERSONAL:
				return _("Personal");
			case Grommunio.core.mapi.Sensitivity.PRIVATE:
				return _("Private");
			case Grommunio.core.mapi.Sensitivity.COMPANY_CONFIDENTIAL:
				return _("Confidential");
		}
		return '';
	}
});
