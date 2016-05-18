/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 */
Ext.namespace('Zarafa.common.delegates.data');

Zarafa.common.delegates.data.DelegateRecordFields = [
	{name: 'entryid', type: 'string'},
	{name: 'display_name', type: 'string'},
	{name: 'can_see_private', type: 'boolean', defaultValue: false},
	{name: 'has_meeting_rule', type: 'boolean', defaultValue: false},

	{name: 'rights_calendar', type: 'int'},
	{name: 'rights_tasks', type: 'int'},
	{name: 'rights_inbox', type: 'int'},
	{name: 'rights_contacts', type: 'int'},
	{name: 'rights_notes', type: 'int'},
	{name: 'rights_journal', type: 'int'}
];

/**
 * @class Zarafa.common.delegates.data.DelegateRecord
 * @extends Zarafa.core.data.MAPIRecord
 * 
 * Record will hold information about delegates.
 */
Zarafa.common.delegates.data.DelegateRecord = Ext.extend(Zarafa.core.data.MAPIRecord, {
	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties : [ 'entryid' ],

	/**
	 * Copy the {@link Zarafa.common.delegates.data.DelegateRecord DelegateRecord} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Zarafa.common.delegates.data.DelegateRecord} The copy of the record.
	 */
	copy : function(newId)
	{
		var copy = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DELEGATE, this.data, newId || this.id);

		copy.idProperties = this.idProperties.clone();
		copy.phantom = this.phantom;

		return copy.applyData(this);
	},

	/**
	 * Applies all data from an {@link Zarafa.common.delegates.data.DelegateRecord DelegateRecord}
	 * to this instance. This will update all data.
	 * 
	 * @param {Zarafa.common.delegates.data.DelegateRecord} record The record to apply to this
	 * @return {Zarafa.common.delegates.data.DelegateRecord} this
	 */
	applyData : function(record)
	{
		this.beginEdit();

		Ext.apply(this.data, record.data);
		Ext.apply(this.modified, record.modified);

		this.dirty = record.dirty;

		this.endEdit();

		return this;
	},

	/**
	 * Compare this {@link Zarafa.common.delegates.data.DelegateRecord DelegateRecord} instance
	 * with another one to see if they are same.
	 * 
	 * @param {Zarafa.common.delegates.data.DelegateRecord} record The Record to compare with
	 * @return {Boolean} True if the records are same.
	 */
	equals : function(record)
	{
		// Simplest case, do we have the same object...
		if (this === record) {
			return true;
		}

		return Zarafa.core.EntryId.compareABEntryIds(this.get('entryid'), record.get('entryid'));
	}
});

// Register a custom type to be used by the Record Factory
Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_DELEGATE');

Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DELEGATE, Zarafa.common.delegates.data.DelegateRecord);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DELEGATE, Zarafa.common.delegates.data.DelegateRecordFields);
