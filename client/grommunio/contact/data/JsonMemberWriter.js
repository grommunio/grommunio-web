/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact.data');

/**
 * @class Grommunio.contact.data.JsonMemberWriter
 * @extends Grommunio.core.data.JsonWriter
 */
Grommunio.contact.data.JsonMemberWriter = Ext.extend(Grommunio.core.data.JsonWriter, {
	/**
	 * Similar to {@link Ext.data.JsonWriter#toHash}
	 *
	 * Convert members into a hash. Members exists as
	 * {@link Grommunio.contact.DistlistMemberRecord DistlistMemberRecord} within
	 * a {@link Grommunio.core.data.IPMRecord IPMRecord} and thus must be serialized
	 * separately into the hash object.
	 *
	 * @param {Ext.data.Record} record The record to hash
	 * @return {Object} The hashed object
	 * @override
	 * @private
	 */
	toPropHash: function(record)
	{
		var memberStore = record.getMemberStore();
		var hash = {};

		if (!Ext.isDefined(memberStore)) {
			return hash;
		}

		var memberRecords = memberStore.getRange();
		hash.members = [];

		for (var i = 0; i < memberRecords.length; i++) {
			hash.members.push(memberRecords[i].data);
		}

		return hash;
	}
});
