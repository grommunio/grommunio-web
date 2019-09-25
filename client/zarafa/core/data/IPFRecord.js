Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPFRecord
 * @extends Zarafa.core.data.MAPIRecord
 * 
 */
Zarafa.core.data.IPFRecord = Ext.extend(Zarafa.core.data.MAPIRecord, {
	/**
	 * Compare this {@link Zarafa.core.data.MAPIRecord record} instance with another one to see
	 * if they are the same item from the server (i.e. The entryid matches).
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The MAPIRecord to compare with
	 * @return {Boolean} True if the records are the same.
	 */
	equals : function(record)
	{
		// Simplest case, do we have the same object...
		if (this === record) {
			return true;
		}

		// @FIXME move this to MAPIRecord
		// When only one of the 2 records is a phantom, then the
		// records can impossibly be equal...
		if (this.phantom !== record.phantom) {
			return false;
		}

		// For phantom records, no entryid exists. Since both objects thus only
		// contain on the client-side and cannot be represented by 2 different
		// objects, comparison on the id-field only is sufficient.
		if (this.phantom) {
			return this.id == record.id;
		} else {
			return Zarafa.core.EntryId.compareEntryIds(this.get('entryid'), record.get('entryid'));
		}
	},

	/**
	 * This will determine if the provided className matches the container_class
	 * on this record. This comparison is done case-insensitive. See {@link Zarafa.core.ContainerClass#isClass}
	 * for further details.
	 *
	 * @param {String/Array} className The class name which must be compared to the container_class
	 * @param {Boolean} baseOnly (optional) True when only the start of the container_class needs
	 * to match with the className (So isContainerClass('IPF', true) will return true when the
	 * actual container_class is 'IPF.Note'). Defaults to false.
	 * @return True when the given className matches the container_class.
	 */
	isContainerClass : function(className, baseOnly)
	{
		return Zarafa.core.ContainerClass.isClass(this.get('container_class'), className, baseOnly);
	}
});
