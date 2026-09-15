/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.data');

/**
 * @class Grommunio.hierarchy.data.MAPIFolderSubStore
 * @extends Grommunio.core.data.MAPISubStore
 *
 * Substore which contains {@link Grommunio.hierarchy.data.MAPIFolderRecord folder} records,
 * which should not be serialized back to the server as they are only used for display
 * purposes in the {@link Grommunio.hierarchy.dialog.FolderSizeContentPanel}.
 */
Grommunio.hierarchy.data.MAPIFolderSubStore = Ext.extend(Grommunio.core.data.MAPISubStore, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var recordType = Grommunio.core.data.RecordFactory.getRecordClassByObjectType(Grommunio.core.mapi.ObjectType.MAPI_FOLDER);

		Ext.applyIf(config, {
			reader: new Grommunio.core.data.JsonReader({ dynamicRecord: false }, recordType)
		});

		Grommunio.hierarchy.data.MAPIFolderSubStore.superclass.constructor.call(this, config);
	}
});
