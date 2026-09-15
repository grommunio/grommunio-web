/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	/*
	 * We must set the default value of the bufferResize property
	 * to something more appropriate to our needs.
	 */
	Ext.override(Ext.Container, {
		bufferResize: false
	});
})();
