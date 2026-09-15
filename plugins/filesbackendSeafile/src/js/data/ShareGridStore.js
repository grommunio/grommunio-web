/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.backend.Seafile.data');

/**
 * Lightweight array store that backs the share grid with in-memory data.
 */
Grommunio.plugins.files.backend.Seafile.data.ShareGridStore = Ext.extend(
	Ext.data.ArrayStore,
	{
		constructor: function (e) {
			Grommunio.plugins.files.backend.Seafile.data.ShareGridStore.superclass.constructor.call(
				this,
				{
					fields: [
						'id',
						'shareWith',
						'shareWithDisplayname',
						'type',
						'permissionCreate',
						'permissionChange',
						'permissionDelete',
						'permissionShare',
					],
					fileType: e,
				},
			);
		},
	},
);
Ext.reg(
	'filesplugin.seafile.sharegridstore',
	Grommunio.plugins.files.backend.Seafile.data.ShareGridStore,
);
