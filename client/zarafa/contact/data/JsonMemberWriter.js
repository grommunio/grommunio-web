Ext.namespace('Zarafa.contact.data');

/**
 * @class Zarafa.contact.data.JsonMemberWriter
 * @extends Zarafa.core.data.JsonWriter
 */
Zarafa.contact.data.JsonMemberWriter = Ext.extend(Zarafa.core.data.JsonWriter, {
	/**
	 * Similar to {@link Ext.data.JsonWriter#toHash}
	 *
	 * Convert members into a hash. Members exists as
	 * {@link Zarafa.contact.DistlistMemberRecord DistlistMemberRecord} within
	 * a {@link Zarafa.core.data.IPMRecord IPMRecord} and thus must be serialized
	 * seperately into the hash object.
	 *
	 * @param {Ext.data.Record} record The record to hash
	 * @return {Object} The hashed object
	 * @override
	 * @private
	 */
	toPropHash : function(record)
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
