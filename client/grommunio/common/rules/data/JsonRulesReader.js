/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.rules.data');

/**
 * @class Grommunio.common.rules.data.JsonRulesReader
 * @extends Grommunio.core.data.JsonReader
 */
Grommunio.common.rules.data.JsonRulesReader = Ext.extend(Grommunio.core.data.JsonReader, {
	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Grommunio.core.data.RecordCustomObjectType#GROMMUNIO_RULE}.
	 */
	constructor: function(meta, recordType)
	{
		meta = meta || {};

		Ext.applyIf(meta, {
			id: 'rule_id',
			idProperty: 'rule_id',
			dynamicRecord: false
		});

		// If no recordType is provided, force the type to be a rule
		if (!Ext.isDefined(recordType)) {
			recordType = Grommunio.core.data.RecordFactory.getRecordClassByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RULE);
		}

		Grommunio.common.rules.data.JsonRulesReader.superclass.constructor.call(this, meta, recordType);
	}
});
