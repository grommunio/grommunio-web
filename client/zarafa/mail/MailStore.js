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
	constructor: function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass: 'IPM.Note',
			defaultSortInfo: {
				field: 'message_delivery_time',
				direction: 'desc'
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
	getRecordsForUpdateData: function(records, action)
	{
		if (!Ext.isDefined(records) || action !== Ext.data.Api.actions.open) {
			return Zarafa.mail.MailStore.superclass.getRecordsForUpdateData.apply(this, arguments);
		}

		var results = { records: [], updatedRecords: [] };

		if (!Array.isArray(records)) {
			records = [ records ];
		}

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];

			if(record instanceof Zarafa.calendar.MeetingRequestRecord) {
				// use CleanGlobalObjectId, so we can force reload of all exceptions also for recurring series
				var globalObjectId = record.get('goid2');

				if (Ext.isEmpty(globalObjectId)) {
					// no global object id found, we can't do anything
					return Zarafa.mail.MailStore.superclass.getRecordsForUpdateData.apply(this, arguments);
				}

				// find all meeting request records which is earlier/latest update of this meeting request record
				var index = -1;
				do {
					index = this.findExact('goid2', globalObjectId, index + 1);

					// check if we got any matching record or not
					if(index < 0) {
						continue;
					}

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
				} while(index != -1);
			} else if(record.isMessageClass('IPM.TaskRequest', true)) {
				// Don't update MailStore-record when it is an IPM.TaskRequest/Accept/Decline/Update
				// because when user tried to open that particular task request, we actually open
				// the associated task.
				continue;
			} else {
				// for other type of mails, just invoke parent class
				return Zarafa.mail.MailStore.superclass.getRecordsForUpdateData.apply(this, arguments);
			}
		}

		return results;
	},

	/**
	 * Function is used to set the filter restriction if {#hasFilterApplied filter is enabled}
	 * while reloading mail store.
	 * @param {Object} options An options which set the filter restriction in params
	 * if filter was already applied on store.
	 */
	reload: function(options)
	{
		if (this.hasFilterApplied) {
			options = Ext.apply(options||{}, {
				params:{
					restriction:{
						filter: this.getFilterRestriction(Zarafa.common.data.Filters.UNREAD)
					}
				}
			});
		}
		Zarafa.mail.MailStore.superclass.reload.call(this, options);
	},

	/**
	 * Returns the number of items that have the store has
	 * corresponds as a parent folder. (i.e. for conversations it will only
	 * count the items from the Inbox folder and not the items from the Sent Items
	 * folder)
	 *
	 * @return {Number} The number of items
	 */
	getStoreLength: function()
	{
		// Get all items count when 'Unread' filtered has been applied.
		if (!this.hasFilterApplied) {
			var count = 0;
			var items = this.snapshot ? this.snapshot.items : this.getRange();
			items.forEach(function(item) {
				if (item.get('folder_name') === 'inbox') {
					count++;
				}
			});

			return count;
		}

		return Zarafa.mail.MailStore.superclass.getStoreLength.apply(this, arguments);
	},

	/**
	 * Function which provide the restriction based on the given {@link Zarafa.common.data.Filters.UNREAD Filter}
	 *
	 * @param {Zarafa.common.data.Filters} filterType The filterType which needs to perform on store.
	 * @return {Array|false} RES_BITMASK restriction else false.
	 */
	getFilterRestriction: function(filterType)
	{
		if (filterType === Zarafa.common.data.Filters.UNREAD) {
			var unreadFilterRestriction = Zarafa.core.data.RestrictionFactory.dataResBitmask(
				'PR_MESSAGE_FLAGS',
				Zarafa.core.mapi.Restrictions.BMR_EQZ,
				Zarafa.core.mapi.MessageFlags.MSGFLAG_READ);

			var model = container.getCurrentContext().getModel();
			if (model) {
				var previewedRecord = model.getPreviewRecord();

				// Add preview record in filter restriction so we can
				// make it remains preview in preview panel.
				if(!Ext.isEmpty(previewedRecord) && this.hasFilterApplied) {
					return Zarafa.core.data.RestrictionFactory.createResOr([
						Zarafa.core.data.RestrictionFactory.dataResProperty(
							'entryid',
							Zarafa.core.mapi.Restrictions.RELOP_EQ,
							previewedRecord.get('entryid')
						),
						unreadFilterRestriction
					]);
				}
			}

			return unreadFilterRestriction;
		}
		return false;
	}
});

Ext.reg('zarafa.mailstore', Zarafa.mail.MailStore);
