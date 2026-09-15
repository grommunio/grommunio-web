/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.recurrence.data');

/**
 * @class Grommunio.common.recurrence.data.RecurrenceEnd
 * @extends Grommunio.core.Enum
 *
 * Enumerates all possible recurrence endings
 *
 * @singleton
 */
Grommunio.common.recurrence.data.RecurrenceEnd = Grommunio.core.Enum.create({
  /**
	 * Recurrence never ends
	 *
	 * @property
	 * @type Object
	 */
	NEVER: 0x23,
  /**
	 * Recurrence ends after N occurrences
	 *
	 * @property
	 * @type Object
	 */
	N_OCCURRENCES: 0x22,
  /**
	 * Recurrence ends on date
	 *
	 * @property
	 * @type Object
	 */
	ON_DATE: 0x21
});
