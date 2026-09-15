/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.data');

/**
 * @class Grommunio.calendar.data.SnapModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different snap modes of the calendar context.
 *
 * @singleton
 */
Grommunio.calendar.data.SnapModes = Grommunio.core.Enum.create({
	/**
	 * Preserve current time.
	 *
	 * @property
	 * @type String
	 */
	NONE: 1,

	/**
	 * All selections should snap to the entire day.
	 *
	 * @property
	 * @type String
	 */
	DAY: 2,

	/**
	 * All selections should snap to the smallest time which is
	 * supported by the current zoomlevel.
	 *
	 * @property
	 * @type String
	 */
	ZOOMLEVEL: 3
});
