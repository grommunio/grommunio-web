/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 */
Ext.namespace('Grommunio.common.delegates.data');

Grommunio.common.delegates.data.DelegateRecordFields = [
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
 * @class Grommunio.common.delegates.data.DelegateRecord
 * @extends Grommunio.core.data.MAPIRecord
 *
 * Record will hold information about delegates.
 */
Grommunio.common.delegates.data.DelegateRecord = Ext.extend(Grommunio.core.data.MAPIRecord, {
	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties: [ 'entryid' ],

	/**
	 * Copy the {@link Grommunio.common.delegates.data.DelegateRecord DelegateRecord} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Grommunio.common.delegates.data.DelegateRecord} The copy of the record.
	 */
	copy: function(newId)
	{
		var copy = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DELEGATE, this.data, newId || this.id);

		copy.idProperties = this.idProperties.clone();
		copy.phantom = this.phantom;

		return copy.applyData(this);
	},

	/**
	 * Applies all data from an {@link Grommunio.common.delegates.data.DelegateRecord DelegateRecord}
	 * to this instance. This will update all data.
	 *
	 * @param {Grommunio.common.delegates.data.DelegateRecord} record The record to apply to this
	 * @return {Grommunio.common.delegates.data.DelegateRecord} this
	 */
	applyData: function(record)
	{
		this.beginEdit();

		Ext.apply(this.data, record.data);
		Ext.apply(this.modified, record.modified);

		this.dirty = record.dirty;

		this.endEdit();

		return this;
	},

	/**
	 * Compare this {@link Grommunio.common.delegates.data.DelegateRecord DelegateRecord} instance
	 * with another one to see if they are same.
	 *
	 * @param {Grommunio.common.delegates.data.DelegateRecord} record The Record to compare with
	 * @return {Boolean} True if the records are same.
	 */
	equals: function(record)
	{
		// Simplest case, do we have the same object...
		if (this === record) {
			return true;
		}

		return Grommunio.core.EntryId.compareABEntryIds(this.get('entryid'), record.get('entryid'));
	}
});

// Register a custom type to be used by the Record Factory
Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_DELEGATE');

Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DELEGATE, Grommunio.common.delegates.data.DelegateRecord);
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DELEGATE, Grommunio.common.delegates.data.DelegateRecordFields);
