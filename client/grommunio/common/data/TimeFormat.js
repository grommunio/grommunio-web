/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.common.data.TimeFormat
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different filters for the stores.
 *
 * @singleton
 */
Grommunio.common.data.TimeFormat = Grommunio.core.Enum.create({
	/**
	 * TWELVEHOUR which used to for 'g:i A' format.
	 *
	 * @property
	 * @type Number
	 */
  TWELVEHOUR: 'g:i A',

  /**
	 * TWENTYFOURHOUR which used to for 'G:i' format.
	 *
	 * @property
	 * @type Number
	 */
  TWENTYFOURHOUR: 'G:i'
});
