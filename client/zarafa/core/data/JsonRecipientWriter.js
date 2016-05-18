Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.JsonRecipientWriter
 * @extends Zarafa.core.data.JsonWriter
 */
Zarafa.core.data.JsonRecipientWriter = Ext.extend(Zarafa.core.data.JsonWriter, {
	/**
	 * Similar to {@link Ext.data.JsonWriter#toHash}
	 *
	 * Convert recipients into a hash. Recipients exists as
	 * {@link Zarafa.core.data.IPMRecipientRecord IPMRecipientRecord} within
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
		var recipientStore = record.getRecipientStore();
		var hash = {};

		if (!Ext.isDefined(recipientStore)) {
			return hash;
		}

		// Get list of modified (modified and newly added) records
		var modifiedRecords = recipientStore.getModifiedRecords();
		// Get list of removed records
		var deletedRecords = recipientStore.getRemovedRecords();

		if(modifiedRecords.length > 0 || deletedRecords.length > 0){
			hash.recipients = {};

			// Adding the modified records to the add or modified part of the recipients bit
			for (var i = 0; i < modifiedRecords.length; i++) {
				var recipient = modifiedRecords[i];

				// FIXME: serialize?
				var data = recipient.data;

				if(recipient.isMeetingOrganizer()) {
					// organizer information shouldn't be passed in recipient table at all
					continue;
				}

				if (Ext.isEmpty(recipient.get('rowid'))) {
					// If recipient does not have a rowid the recipient is new
					if(!Ext.isDefined(hash.recipients.add)) {
						hash.recipients.add = [];
					}

					hash.recipients.add.push(data);
				} else {
					// Recipient already exists and needs to be updated
					if(!Ext.isDefined(hash.recipients.modify)) {
						hash.recipients.modify = [];
					}

					hash.recipients.modify.push(data);
				}
			}

			// Adding the removed records to the remove part of the recipients bit
			for (var i = 0; i < deletedRecords.length; i++) {
				var recipient = deletedRecords[i];
				var data = recipient.data;

				if(recipient.isMeetingOrganizer()) {
					// organizer information shouldn't be passed in recipient table at all
					continue;
				}

				if (!Ext.isDefined(hash.recipients.remove)) {
					hash.recipients.remove = [];
				}

				hash.recipients.remove.push(data);
			}
		}

		return hash;
	}
});
