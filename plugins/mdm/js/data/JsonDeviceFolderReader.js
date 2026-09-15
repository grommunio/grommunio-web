/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.mdm.data');

/**
 * @class Grommunio.plugins.mdm.data.JsonDeviceFolderReader
 * @extends Grommunio.core.data.JsonReader
 *
 * This extension of the {@link Grommunio.core.data.JsonReader} supports
 * {@link Grommunio.plugins.mdm.data.MDMDeviceStore stores} which can hold different type of
 * {@link Grommunio.plugins.mdm.data.MDMDeviceRecord records}.
 */
Grommunio.plugins.mdm.data.JsonDeviceFolderReader = Ext.extend(Grommunio.core.data.JsonReader, {
	
	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Grommunio.core.data.RecordCustomObjectType#MDM_Device_Folder}.
	 */
	constructor: function (meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			id: 'folderid',
			idProperty: 'folderid',
			dynamicRecord: false
		});

		if (!Ext.isDefined(recordType)) {
			recordType = Grommunio.core.data.RecordFactory.getRecordClassByCustomType(meta.customObjectType);
		}

		Grommunio.plugins.mdm.data.JsonDeviceFolderReader.superclass.constructor.call(this, meta, recordType);
	}
});
