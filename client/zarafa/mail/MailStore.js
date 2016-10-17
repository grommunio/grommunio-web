Ext.namespace('Zarafa.mail');

/**
 * @class Zarafa.mail.MailStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.mailstore
 *
 * The MailStore class provides a way to connect the 'maillistmodule' in the server back-end to an
 * Ext.grid.GridPanel object. It provides a means to retrieve mail listings asynchronously.
 * The MailStore object, once instantiated, will be able to retrieve and list mails from a
 * single specific folder only.
 */
Zarafa.mail.MailStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor : function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass : 'IPM.Note',
			defaultSortInfo : {
				field : 'message_delivery_time',
				direction : 'desc'
			}
		});

		Zarafa.mail.MailStore.superclass.constructor.call(this, config);

		// Don't register standalone stores (used in modal dialogs) with the PresenceManager
		if ( !this.standalone ){
			Zarafa.core.PresenceManager.registerStore(this, ['sender', 'received_by', 'sent_representing']);
		}
	},

	/**
	 * Filter a list of {@link Zarafa.core.data.IPMRecord records} by checking if the record
	 * belongs to this Store. This comparison is based on checking if the entryid of the given
	 * records match the entryid of the records inside the store.
	 *
	 * What will be returned is an object containing the records as present inside the store,
	 * and the data objects which should be applied to them (the data from the records of the
	 * store that triggered the event).
	 *
	 * Function will also mark all updates that are already opened of this meeting to be
	 * out dated and force it to be opened again when its loaded in preview pane.
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
		if (!Ext.isDefined(records) || action !== Ext.data.Api.actions.open) {
			return Zarafa.mail.MailStore.superclass.getRecordsForUpdateData.apply(this, arguments);
		}

		var results = { records: [],  updatedRecords : [] };

		if (!Ext.isArray(records)) {
			records = [ records ];
		}

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];

			if(record instanceof Zarafa.calendar.MeetingRequestRecord) {
				// use CleanGlobalObjectId, so we can force reload of all exceptions also for recurring series
				var globalObjectId = record.get('goid2');

				if(!Ext.isEmpty(globalObjectId)) {
					// find all meeting request records which is earlier/latest update of this meeting request record
					var index = -1;
					do {
						index = this.findExact('goid2', globalObjectId, index + 1);

						// check if we got any matching record or not
						if(index >= 0) {
							var rec = this.getAt(index);

							// check if we found the same record which we updated, for that we need to pass updated data
							// instead of just cloning the same record
							if (!record.equals(rec)) {
								if(rec.isOpened()) {
									// indicate that record data is outdated, record should be reopened again when needed
									rec.opened = false;

									results.records.push(rec);
									results.updatedRecords.push({});
								}
							} else {
								// add original updated record with updated data
								results.records.push(this.getAt(index));
								results.updatedRecords.push(record);
							}
						}
					} while(index != -1);
				} else {
					// no global object id found, we can't do anything
					return Zarafa.mail.MailStore.superclass.getRecordsForUpdateData.apply(this, arguments);
				}
			} else {
				// for other type of mails, just invoke parent class
				return Zarafa.mail.MailStore.superclass.getRecordsForUpdateData.apply(this, arguments);
			}
		}

		return results;
	}
});

Ext.reg('zarafa.mailstore', Zarafa.mail.MailStore);
