/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.backend.Default.data');

/**
 * @class Grommunio.plugins.files.backend.Default.data.ShareGridRecord
 *
 * This class specifies the ShareGridRecord and it's fields.
 */
Grommunio.plugins.files.backend.Default.data.ShareGridRecord =
	Ext.data.Record.create(
		{ name: 'id', type: 'string' },
		{ name: 'shareWith', type: 'string' },
		{ name: 'shareWithDisplayname', type: 'string' },
		{ name: 'type', type: 'string' },
		{ name: 'permissionCreate', type: 'bool' },
		{ name: 'permissionChange', type: 'bool' },
		{ name: 'permissionDelete', type: 'bool' },
		{ name: 'permissionShare', type: 'bool' },
	);
