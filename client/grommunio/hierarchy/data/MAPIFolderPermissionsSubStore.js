/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.data');

/**
 * @class Grommunio.hierarchy.data.MAPIFolderPermissionsSubStore
 * @extends Grommunio.core.data.MAPISubStore
 */
Grommunio.hierarchy.data.MAPIFolderPermissionsSubStore = Ext.extend(Grommunio.core.data.MAPISubStore, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var recordType = Grommunio.core.data.RecordFactory.getRecordClassByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_USER_PERMISSION);

		Ext.applyIf(config, {
			writer: new Grommunio.hierarchy.data.JsonPermissionsWriter(),
			// provide a default reader
			reader: new Grommunio.core.data.JsonReader({
				root: 'item',
				dynamicRecord: false
			}, recordType)
		});

		Grommunio.hierarchy.data.MAPIFolderPermissionsSubStore.superclass.constructor.call(this, config);
	}

});
