/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.backend.Default.data');

/**
 * @class Grommunio.plugins.files.backend.Default.data.RecipientTypes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different recipient types that are available in the owncloud backend.
 *
 * @singleton
 */
Grommunio.plugins.files.backend.Default.data.RecipientTypes =
	Grommunio.core.Enum.create({
		/**
		 * RecipientType: user
		 *
		 * @property
		 * @type Number
		 */
		USER: 0,

		/**
		 * RecipientType: group
		 *
		 * @property
		 * @type Number
		 */
		GROUP: 1,

		/**
		 * RecipientType: link
		 *
		 * @property
		 * @type Number
		 */
		LINK: 3,
	});
