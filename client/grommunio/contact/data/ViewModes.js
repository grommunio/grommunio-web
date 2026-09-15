/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact.data');

/**
 * @class Grommunio.contact.data.ViewModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different viewing modes of the contact context.
 *
 * @singleton
 */
Grommunio.contact.data.ViewModes = Grommunio.core.Enum.create({
	/**
	 * View all contact items from the selected folder(s) using a normal view.
	 *
	 * @property
	 * @type Number
	 */
	NORMAL: 0,

	/**
	 * View all contact items from the selected folder(s) as business cards.
	 *
	 * @property
	 * @type Number
	 */
	BUSINESS: 1,

	/**
	 * View all contact items from the selected folder(s) as address cards.
	 *
	 * @property
	 * @type Number
	 */
	ADDRESS: 2,

	/**
	 * View all contact items from the selected folder(s) as detailed cards.
	 *
	 * @property
	 * @type Number
	 */
	DETAILED: 3,

	/**
	 * View all contact items from the selected folder(s) as telephone list.
	 *
	 * @property
	 * @type Number
	 */
	PHONE_LIST: 4,

	/**
	 * View all contact items from the selected folder(s) grouped by category.
	 *
	 * @property
	 * @type Number
	 */
	GROUP_CATEGORY: 5,

	/**
	 * View all contact items from the selected folder(s) grouped by company.
	 *
	 * @property
	 * @type Number
	 */
	GROUP_COMPANY: 6,

	/**
	 * View all contact items from the selected folder(s) grouped by location.
	 *
	 * @property
	 * @type Number
	 */
	GROUP_LOCATION: 7,
	/**
	 * View all found contact items of the selected folder(s) in a list.
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 8
});
