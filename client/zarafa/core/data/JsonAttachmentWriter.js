Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.JsonAttachmentWriter
 * @extends Zarafa.core.data.JsonWriter
 */
Zarafa.core.data.JsonAttachmentWriter = Ext.extend(Zarafa.core.data.JsonWriter, {
	/**
	 * Similar to {@link Ext.data.JsonWriter#toHash}
	 *
	 * Convert attachments into a hash. Attachments exists as
	 * {@link Zarafa.core.data.IPMAttachmentRecord IPMAttachmentRecord} within
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
		var attachmentStore = record.getAttachmentStore();
		var hash = {};

		if (!Ext.isDefined(attachmentStore)) {
			return hash;
		}

		// @FIXME currently only inline attachments are handled,
		// normal attachments will be handled seperately

		// Overwrite previous definition to something we can work with.
		hash.attachments = {};
		hash.attachments.dialog_attachments = attachmentStore.getId();

		var modified = attachmentStore.getModifiedRecords();
		var removed = attachmentStore.getRemovedRecords();

		Ext.each(modified, function(attach) {
			if (attach.isInline()) {
				if (!Ext.isDefined(hash.attachments.add)) {
					hash.attachments.add = [];
				}

				// FIXME: serialize?
				var data = attach.data;

				hash.attachments.add.push(data);
			}
		}, this);

		Ext.each(removed, function(attach) {
			if (attach.isInline()) {
				if (!Ext.isDefined(hash.attachments.remove)) {
					hash.attachments.remove = [];
				}

				// FIXME: serialize?
				var data = attach.data;

				hash.attachments.remove.push(data);
			}
		}, this);

		return hash;
	}
});
