/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.recurrence.data');

/**
 * @class Grommunio.common.recurrence.data.RecurrenceType
 * @extends Grommunio.core.Enum
 *
 * Enumerates all possible recurrence types
 *
 * @singleton
 */
Grommunio.common.recurrence.data.RecurrenceType = Grommunio.core.Enum.create({
	/**
	 * No recurrence
	 *
	 * @property
	 * @type Number
	 */
	NONE: 0,
  /**
	 * Daily recurrence
	 *
	 * @property
	 * @type Number
	 */
	DAILY: 10,
  /**
	 * Weekly recurrence
	 *
	 * @property
	 * @type Number
	 */
	WEEKLY: 11,
  /**
	 * Monthly recurrence
	 *
	 * @property
	 * @type Number
	 */
	MONTHLY: 12,
  /**
	 * Yearly recurrence
	 *
	 * @property
	 * @type Number
	 */
	YEARLY: 13
});

