Ext.namespace('Zarafa.calendar');

/**
 * @class Zarafa.calendar.AppointmentStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.appointmentstore
 * 
 * The AppointmentStore class provides a way to connect to the 'appointmentlistmodule' in the server back-end to an 
 * Ext.grid.GridPanel object. It provides a means to retrieve appointment listings asynchronously.
 * The store has to be initialised with a store Id, which corresponds (somewhat confusingly) to
 * a MAPI store id. The AppointmentStore object, once instantiated, will be able to retrieve and list
 * appointments from a single specific store only.
 */
Zarafa.calendar.AppointmentStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor : function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass : 'IPM.Appointment',
			defaultSortInfo : {
				field : 'startdate',
				direction : 'desc'
			}
		});

		Zarafa.calendar.AppointmentStore.superclass.constructor.call(this, config);
	},

	/**
	 * With recurring appointments, each occurence has the same entryid.
	 * For those cases, we cannot use the entryid as unique property, instead
	 * we combine it with the basedate.
	 * @param {Ext.data.Record} record The record for which the key is requested
	 * @return {String} The key by which the record must be saved into the {@link Ext.util.MixedCollection}.
	 * @protected
	 */
	getRecordKey : function(record)
	{
		// Check isRecurringOccurence exists because the user could have moved a non-appointment message to
		// the calendar
		if ( Ext.isDefined(record.isRecurringOccurence) && record.isRecurringOccurence()) {
			return record.id + '' + record.get('basedate');
		} else {
			return record.id;
		}
	},

	/**
	 * Event handler fired by the {@link Ext.data.Store} when a record is being removed
	 * from the store. This adds a special case to the default behavior of the {@link Ext.data.Store#destroyRecord}
	 * especially for recurring appointments. When the appointment is recurring, and no basedate is provided, we
	 * manually fire a {@link Ext.data.Store#remove} event for each occurence which is currently loaded. This will
	 * ensure that the UI can remove every occurence from the UI while we send a single record to the server to
	 * remove the entire series from the server.
	 * 
	 * @param {Ext.data.Store} store The store from where the record is removed
	 * @param {Ext.data.Record} record The record record which was removed
	 * @param {Number} index The index of the record where the record was removed
	 * @private
	 */
	destroyRecord : function(store, record, index)
	{
		// Don't remove a record which is already removed
		if (this.removed.indexOf(record) > -1) {
			return;
		}

		// Special case for deleting recurrences
		if (record.isRecurring && record.isRecurring()) {
			// Search for all occurences which belong to this recurrence.
			// Note that 'record' is already removed from the store,
			// so we don't risk of adding it again into the array.
			var deleteOccurences = [];
			this.each(function(r) {
				if (r.id === record.id) {
					deleteOccurences.push(r);
				}
			});

			// Now remove every occurence from the store, before removing we
			// push it into the 'removed' array to make sure that when we arrive
			// inside this function again, the first if-statement will return.
			for (var i = 0, len = deleteOccurences.length; i < len; i++) {
				var occur = deleteOccurences[i];
				this.removed.push(occur);
				this.remove(occur);
				this.removed.remove(occur);
			}

			// All occurences have been deleted. Continue as usual...
		}

		Zarafa.calendar.AppointmentStore.superclass.destroyRecord.call(this, store, record, index);
	},

	/**
	 * Filter a list of {@link Zarafa.core.data.IPMRecord records} by checking if the record
	 * belongs to this Store. This comparison is based on checking if the entryid of the given
	 * records match the entryid of the records inside the store. If the records are being
	 * {@link Zarafa.core.data.JsonReader#realize realized} by the {@link Zarafa.core.data.JsonReader JsonReader}
	 * then we check if the parent_entryid matches this store.
	 *
	 * What will be returned is an object containing the records as present inside the store,
	 * and the data objects which should be applied to them (the data from the records of the
	 * store that triggered the event).
	 *
	 * @param {Zarafa.core.data.IPMRecord|Array} records The record or records to filter
	 * @param {Ext.data.Api.actions} action The API action for which the updates are looked for.
	 * @return {Object} Object containing the key 'records' containing the array of records inside
	 * this store, and the key 'updatedRecords' containing the array of records which should be 
	 * applied to those records.
	 * @private
	 */
	getRecordsForUpdateData : function(records, action)
	{
		if (!Ext.isDefined(records) || action === Ext.data.Api.actions.create) {
			return Zarafa.calendar.AppointmentStore.superclass.getRecordsForUpdateData.apply(this, arguments);
		}

		var results = { records: [],  updatedRecords : [] };

		if (!Array.isArray(records)) {
			records = [ records ];
		}

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];

			if (!record.isMessageClass('IPM.Appointment') && !record.isMessageClass('IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}')) {
				continue;
			} else if (record.isRecurringOccurence()) {
				// The appointment is an occurence, this means we are
				// updating an exception. Find the exact occurence which
				// was changed.
				var index = this.findBy(function(rec) {
					return Zarafa.core.EntryId.compareEntryIds(record.get('entryid'), rec.get('entryid')) &&
						   Ext.isDate(record.get('basedate')) && Ext.isDate(rec.get('basedate')) &&
						   (record.get('basedate').getTime() === rec.get('basedate').getTime());
				});

				if (index >= 0) {
					// The update is for an occurence, make sure we add
					// the 'basedate' as identifier.
					results.records.push(this.getAt(index));
					results.updatedRecords.push(record);
				}

			} else if (record.isRecurring()) {
				// if the record is a series, we must search for
				// the occurences (except for exceptions).
				var index = -1;
				do {
					index = this.findBy(function(rec) {
						return ((action === Ext.data.Api.actions.destroy) || !rec.isRecurringException()) &&
							   Zarafa.core.EntryId.compareEntryIds(record.get('entryid'), rec.get('entryid'));
					}, undefined, index + 1);
				
					if (index >= 0) {
						var update = this.getAt(index);
						var clonedRec = record.copy();

						// The 'basedate' property must not be altered by the series,
						// as this value will the different for each occurence.
						var basedate = update.get('basedate');
						if (Ext.isDate(basedate)) {
							clonedRec.set('basedate', basedate.clone());
						}
						// The 'recurrence' property must not be altered by the series,
						// as occurences have a different value for this property.
						clonedRec.set('recurrence', update.get('recurrence'));

						// Update time and duration properties correctly according to the series information.
						clonedRec.set('startdate', update.get('startdate').clearTime(true).add(Date.MINUTE, record.get('recurrence_startocc')));
						clonedRec.set('duedate', update.get('startdate').clearTime(true).add(Date.MINUTE, record.get('recurrence_endocc')));
						clonedRec.set('commonstart', clonedRec.get('startdate').clone());
						clonedRec.set('commonend', clonedRec.get('duedate').clone());
						clonedRec.set('duration', (clonedRec.get('duedate') - clonedRec.get('startdate')) / (60 * 1000));

						results.records.push(update);
						results.updatedRecords.push(clonedRec);
					}
				} while(index != -1);
			} else {
				// For non-recurring appointments we should simply look
				// for the appointment where the entyid matches.
				var storeRec = this.getById(record.get('entryid'));

				if (storeRec) {
					results.records.push(storeRec);
					results.updatedRecords.push(record);
				}
			}
		}

		return results;
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Zarafa.core.data.Notifications#objectDeleted objectDeleted}
	 * notification has been recieved. This will remove the 
	 * {@link Zarafa.calendar.AppointmentRecord appointment} Or  {@link Zarafa.calendar.MeetingRequestRecord meeting}from the
	 * {@link Zarafa.calendar.AppointmentStore store} and after removing store gets reload.
	 * 
	 * @param {Zarafa.core.data.Notifications} action The notification action
	 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
	 * @param {Object} data The data which has been recieved from the PHP-side which must be applied
	 * to the given records.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
	 * @param {Boolean} success The success status, True if the notification was successfully recieved.
	 * @private
	 */
	onNotifyObjectdeleted : function(action, records, data, timestamp, success)
	{
		Zarafa.calendar.AppointmentStore.superclass.onNotifyObjectdeleted.apply(this, arguments);
		this.reload();
	}
});

Ext.reg('zarafa.appointmentstore', Zarafa.calendar.AppointmentStore);
