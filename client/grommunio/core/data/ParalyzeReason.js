/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.ParalyzeReason
 * @extends Grommunio.core.Enum
 * @singleton
 *
 * The various reasons why grommunio Web can be {@link Zararafa.core.Request#paralyze paralyzed}.
 */
Grommunio.core.data.ParalyzeReason = Grommunio.core.Enum.create({
	/**
	 * Denotes that grommunio Web is paralyzed because the browser
	 * window is reloading or otherwise unloading.
	 * @property
	 * @type Number
	 */
	BROWSER_RELOADING: 0,

	/**
	 * Denotes that grommunio Web is paralyzed because the session
	 * has been expired and the user is no longer logged in.
	 * @property
	 * @type Number
	 */
	SESSION_EXPIRED: 1,

	/**
	 * Denotes that grommunio Web is paralyzed because the session
	 * was altered (cookie session id doesn't match expected id)
	 * @property
	 * @type Number
	 */
	SESSION_INVALID: 2
});
