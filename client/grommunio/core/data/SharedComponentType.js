/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.SharedComponentType
 * @extends Grommunio.core.Enum
 *
 * Used in the bidSharedComponent method in the {@link Grommunio.core.Container Container}
 * to indicate what type of component is requested by the initiator of the bidding round.
 *
 * @singleton
 */
Grommunio.core.data.SharedComponentType = Grommunio.core.Enum.create({
	/**
	 * A dialog that creates a new record/message
	 * @property
	 * @type Number
	 */
	'common.create': 1,

	/**
	 * A dialog that views a record
	 * @property
	 * @type Number
	 */
	'common.view': 2,

	/**
	 * A whole previewpanel
	 * @property
	 * @type Number
	 */
	'common.preview': 3,

	/**
	 * A context menu
	 * @property
	 * @type Number
	 */
	'common.contextmenu': 4,

	/**
	 * A dialog that views search result
	 */
	'common.search': 5,

	/**
	 * A hover card
	 * @property
	 * @type Number
	 */
	'common.hovercard': 6
});

