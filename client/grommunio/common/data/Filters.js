/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.common.data.Filters
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different filters for the stores.
 *
 * @singleton
 */
Grommunio.common.data.Filters = Grommunio.core.Enum.create({
	/**
	 * UNREAD which used to filter all unread items from store.
	 *
	 * @property
	 * @type Number
	 */
	UNREAD: 0
});
