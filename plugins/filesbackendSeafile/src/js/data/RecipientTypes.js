/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.backend.Seafile.data');

/**
 * Enum that lists the supported target types for Seafile sharing.
 */
Grommunio.plugins.files.backend.Seafile.data.RecipientTypes =
	Grommunio.core.Enum.create({
		USER: 0,
		GROUP: 1,
		LINK: 3,
	});
