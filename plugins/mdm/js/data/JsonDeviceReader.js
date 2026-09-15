/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.mdm.data');

/**
 * @class Grommunio.plugins.mdm.data.JsonCertificateReader
 * @extends Grommunio.core.data.JsonReader
 */
Grommunio.plugins.mdm.data.JsonCertificateReader = Ext.extend(Grommunio.core.data.JsonReader, {

	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Grommunio.core.mapi.ObjectType#MAPI_MDM}.
	 */
	constructor: function (meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			dynamicRecord: false
		});
		recordType = Grommunio.core.data.RecordFactory.getRecordClassByMessageClass('IPM.MDM');

		Grommunio.plugins.mdm.data.JsonCertificateReader.superclass.constructor.call(this, meta, recordType);
	}
});
