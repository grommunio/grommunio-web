Ext.namespace('Zarafa.common.freebusy.data');

/**
 * @class Zarafa.common.freebusy.data.FreebusyModel
 * @extends Ext.util.Observable
 */
Zarafa.common.freebusy.data.FreebusyModel = Ext.extend(Ext.util.Observable,
{
	/**
	 * @cfg {Boolean} nonWorkingHoursHidden
	 * The {@link Zarafa.common.freebusy.ui.TimelineView TimelineView} must only
	 * display the working hours for the user.
	 */
	nonWorkingHoursHidden : true,
	/**
	 * @cfg {Zarafa.core.DateRange} daterange
	 * The {@link Zarafa.core.DateRange} object that determines what time period will be shown
	 * (defaults to 7 days before today till 3 weeks after).
	 */
	daterange: null,
	/**
	 * @cfg {Zarafa.core.DateRange} selectorRange
	 * The {@link Zarafa.core.DateRange} object that determines what time period will be selected
	 * (defaults to next whole or half hour and will last by default for 30 minutes).
	 */
	selectorRange: null,
	/**
	 * The {@link Zarafa.core.DateRange} object that indicates the daterange for which the
	 * suggestions for the {@link #suggestionBlockStore} must be calculated.
	 * @property
	 * @type Zarafa.common.freebusy.data.FreebusyBlockStore
	 */
	suggestionRange: null,
	/**
	 * @cfg {Zarafa.core.data.IPMRecipientStore} userStore
	 * The {@link Zarafa.core.data.IPMRecipientStore store} object that handles the freebusy blocks displayed on the timeline.
	 */
	userStore: null,
	/**
	 * @cfg {Zarafa.common.freebusy.data.FreebusyBlockStore} blockStore
	 * The {@link Zarafa.common.freebusy.data.FreebusyBlockStore store} object that handles the freebusy blocks displayed on the timeline.
	 */
	blockStore: null,
	/**
	 * @cfg {Zarafa.common.freebusy.data.FreebusyBlockStore} sumBlockStore
	 * The {@link Zarafa.common.freebusy.data.FreebusyBlockStore} object that handles the freebusy sum blocks displayed in the header of the timeline.
	 */
	sumBlockStore: null,
	/**
	 * freeBlockStore Internal store which keeps track of all blocks which mark
	 * the periods in which no user is occupied. This is used to generate the {@link #suggestionBlockStore}.
	 * @property
	 * @type Zarafa.common.freebusy.data.FreebusyBlockStore
	 */
	freeBlockStore: null,
	/**
	 * @cfg {Zarafa.common.freebusy.data.FreebusyBlockStore} suggestionBlockStore
	 * The {@link Zarafa.common.freebusy.data.FreebusyBlockStore} object that handles the freebusy sum blocks which indicates which blocks are
	 * available for new meetings.
	 */
	suggestionBlockStore: null,
	/**
	 * This property is used to prevent the firing of the selectorrangeupdate event. When an outside
	 * source changes the selector range's values this model does not fire that event.
	 * @property
	 * @type Boolean
	 */
	updatingSelectorRangeExternally: false,
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		// Use 12:00 as base time, this prevents problems for DST switches
		// at 00:00 like in Brasil.
		var now = new Date();
		now.setHours(12);

		var server = container.getServerConfig();
		var startOffset = server.getFreebusyLoadStartOffset();
		var startDate = now.add(Date.DAY, -startOffset).clearTime();
		var endOffset = server.getFreebusyLoadEndOffset();
		var endDate = now.add(Date.DAY, endOffset).clearTime();

		var selectStart, selectEnd;
		if(config.selectorRange){
			// If selectorRange has been supplied copy the startdate and duedate values.
			selectStart = config.selectorRange.getStartDate();
			selectEnd = config.selectorRange.getDueDate();
		}else{
			// Defaults to next whole or half hour and will last by default for 30 minutes
			selectStart = new Date().ceil(Date.MINUTE, 30);
			selectEnd = selectStart.add(Date.MINUTE, 30);
		}

		Ext.applyIf(config, {
			userStore: config.userStore || new Zarafa.core.data.IPMRecipientStore(),
			daterange: config.daterange || new Zarafa.core.DateRange({ startDate : startDate, dueDate : endDate}),
			selectorRange: new Zarafa.core.DateRange({ startDate : selectStart, dueDate : selectEnd}),
			blockStore: config.blockStore || new Zarafa.common.freebusy.data.FreebusyBlockStore(),
			sumBlockStore: config.sumBlockStore || new Zarafa.common.freebusy.data.FreebusyBlockStore({ remoteSort: false}),
			suggestionBlockStore: config.suggestionBlockStore || new Zarafa.common.freebusy.data.FreebusyBlockStore({ remoteSort: false})
		});

		Ext.apply(this, config);

		this.addEvents(
			/**
			 * @event showworkinghourschange
			 * Fires when the {@link #nonWorkingHoursHidden} has been changed
			 * @param {Boolean} hideNonWorkingHours True if only working hours
			 * should be shown.
			 */
			'showworkinghourschange',
			/**
			 * @event userstorechange
			 * Fires when the user store is changed.
			 * @param {Zarafa.core.data.IPMRecipientStore} newStore The new store
			 * @param {Zarafa.core.data.IPMRecipientStore} oldStore The old store
			 */
			'userstorechange',
			/**
			 * @event blockstorechange
			 * Fires when the block store is changed.
			 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} newStore The new store
			 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} oldStore The old store
			 */
			'blockstorechange',
			/**
			 * @event sumblockstorechange
			 * Fires when the sumblock store is changed.
			 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} newStore The new store
			 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} oldStore The old store
			 */
			'sumblockstorechange',
			/**
			 * @event suggestionblockstorechange
			 * Fires when the suggestionblock store is changed.
			 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} newStore The new store
			 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} oldStore The old store
			 */
			'suggestionblockstorechange',
			/**
			 * @event daterangechange
			 * Fires when the {@link Zarafa.core.DateRange DateRange} has been changed.
			 * @param {Zarafa.core.DateRange} newRange The new DateRange object.
			 * @param {Zarafa.core.DateRange} oldRange The old DateRange object.
			 */
			'daterangechange',
			/**
			 * @event selectorrangeupdate
			 * Fires when the selector {@link Zarafa.core.DateRange DateRange}
			 * has been changed.
			 * @param {Zarafa.core.DateRange} newRange The new DateRange object.
			 * @param {Zarafa.core.DateRange} oldRange The old DateRange object.
			 */
			'selectorrangeupdate'
		);

		Zarafa.common.freebusy.data.FreebusyModel.superclass.constructor.call(this, config);

		this.initEvents();

		this.setDateRange(config.daterange, true);
		this.setUserStore(config.userStore, true);
		this.setSelectorRange(config.selectorRange, true);
		this.setBlockStore(config.blockStore, true);
		this.setSumBlockStore(config.sumBlockStore, true);
		this.setSuggestionBlockStore(config.suggestionBlockStore, true);

		this.createFreeBlockStore();
		this.createSuggestionRange();
	},

	/**
	 * Initialize all {@link Zarafa.common.freebusy.data.FreebusyModel FreebusyModel} related events.
	 * @private
	 */
	initEvents: function()
	{
		this.on('showworkinghourschange', this.onShowWorkingHoursChange, this);
		this.on('userstorechange', this.onUserStoreChange, this);
	},

	/**
	 * Create a {@link Zarafa.common.freebusy.data.FreebusyBlockStore FreebusyBlockStore} which
	 * is used internally to keep track of the TimeBlocks in which all users are available.
	 * @return {Zarafa.common.freebusy.data.FreebusyBlockStore} The created store
	 * @private
	 */
	createFreeBlockStore : function()
	{
		if (!this.freeBlockStore) {
			this.freeBlockStore = new Zarafa.common.freebusy.data.FreebusyBlockStore({ remoteSort: false});
		}
		return this.freeBlockStore;
	},

	/**
	 * Create a {@link Zarafa.core.DateRange DateRange} object which is used internally to keep
	 * track of the range for which the suggestions must be calculated.
	 * @return {Zarafa.core.DateRange} The created daterange
	 * @private
	 */
	createSuggestionRange : function()
	{
		if (!this.suggestionRange) {
			this.suggestionRange = new Zarafa.core.DateRange();
			this.setSuggestionDate(this.selectorRange.getStartDate());
			this.suggestionRange.on('update', this.onSuggestionRangeUpdate, this, { buffer: 5 });
		}
		return this.suggestionRange;
	},

	/**
	 * Get the visibility of the non-working hours.
	 * @return {Boolean} True if the non-working hours are hidden
	 */
	showOnlyWorkingHours : function()
	{
		return this.nonWorkingHoursHidden;
	},

	/**
	 * Set the visibility of the non-working hours.
	 * @param {Boolean} hide True to hide the non-working hours
	 */
	hideNonWorkingHours : function(hide)
	{
		var oldNonWorkingHoursHidden = this.nonWorkingHoursHidden;
		this.nonWorkingHoursHidden = hide;
		if (oldNonWorkingHoursHidden != this.nonWorkingHoursHidden) {
			this.fireEvent('showworkinghourschange', this.nonWorkingHoursHidden);
		}
		return this.nonWorkingHoursHidden;
	},

	/**
	 * Returns the User store.
	 * @return {Zarafa.core.data.IPMRecipientStore} store
	 */
	getUserStore: function()
	{
		return this.userStore;
	},

	/**
	 * Sets the store.
	 * @param {Zarafa.core.data.IPMRecipientStore} store store
	 * @param {Boolean} initial (optional) True if this function is called
	 * during initialization.
	 * @return {Zarafa.core.data.IPMRecipientStore} store
	 */
	setUserStore: function(store, initial)
	{
		if (initial !== true && this.userStore === store) {
			return;
		}

		var oldUserStore = this.userStore;
		if (this.userStore) {
			this.userStore.un('resolved', this.onUserResolved, this);
			this.userStore.un('load', this.onUserLoad, this);
			this.userStore.un('add', this.onUserAdd, this);
			this.userStore.un('remove', this.onUserRemove, this);
			this.userStore.un('clear', this.onUserClear, this);
		}

		this.userStore = Ext.StoreMgr.lookup(store);

		if (this.userStore) {
			this.userStore.on({
				scope: this,
				resolved: this.onUserResolved,
				load: this.onUserLoad,
				add: this.onUserAdd,
				remove: this.onUserRemove,
				clear: this.onUserClear
			});
		}

		this.fireEvent('userstorechange', this.userStore, oldUserStore);
		if (this.userStore !== oldUserStore && oldUserStore && oldUserStore.autoDestroy) {
			oldUserStore.destroy();
		}

		return this.userStore;
	},

	/**
	 * Returns the block store.
	 * @return {Zarafa.common.freebusy.data.FreebusyBlockStore} store
	 */
	getBlockStore: function()
	{
		return this.blockStore;
	},

	/**
	 * Sets the store.
	 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} store
	 * @param {Boolean} initial (optional) True if this function is called
	 * during initialization.
	 * @return {Zarafa.common.freebusy.data.FreebusyBlockStore} store
	 */
	setBlockStore: function(store, initial)
	{
		if (initial !== true && this.blockStore === store) {
			return;
		}

		var oldBlockStore = this.blockStore;
		if (this.blockStore) {
			this.blockStore.un('load', this.onBlockLoad, this);
			this.blockStore.un('remove', this.onBlockRemove, this, { buffer : 100 });
			this.blockStore.un('clear', this.onBlockRemove, this);
		}

		this.blockStore = Ext.StoreMgr.lookup(store);

		if (this.blockStore) {
			this.blockStore.on('load', this.onBlockLoad, this);
			this.blockStore.on('remove', this.onBlockRemove, this, { buffer : 100 });
			this.blockStore.on('clear', this.onBlockRemove, this);
		}

		this.fireEvent('blockstorechange', this.blockStore, oldBlockStore);
		if (this.blockStore !== oldBlockStore && oldBlockStore && oldBlockStore.autoDestroy) {
			oldBlockStore.destroy();
		}

		return this.blockStore;
	},

	/**
	 * Returns the block store.
	 * @return {Zarafa.common.freebusy.data.FreebusyBlockStore} store
	 */
	getSumBlockStore : function()
	{
		return this.sumBlockStore;
	},

	/**
	 * Sets the block store.
	 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} store The sum block store
	 * @param {Boolean} initial (optional) True if this function is called
	 * during initialization.
	 * @return {Zarafa.common.freebusy.data.FreebusyBlockStore} The sum block store
	 * @private
	 */
	setSumBlockStore : function(store, initial)
	{
		if (initial !== true && this.sumBlockStore === store) {
			return;
		}

		var oldSumBlockStore = this.sumBlockStore;

		if (this.sumBlockStore) {
			this.sumBlockStore.un('load', this.onSumBlockLoad, this, { buffer: 5 });
		}

		this.sumBlockStore = Ext.StoreMgr.lookup(store);

		if (this.sumBlockStore) {
			this.sumBlockStore.on('load', this.onSumBlockLoad, this, { buffer: 5 });
		}

		this.fireEvent('sumblockstorechange', this.sumBlockStore, oldSumBlockStore);
		if (this.sumBlockStore !== oldSumBlockStore && oldSumBlockStore && oldSumBlockStore.autoDestroy) {
			oldSumBlockStore.destroy();
		}

		return this.sumBlockStore;
	},

	/**
	 * Returns the block store.
	 * @return {Zarafa.common.freebusy.data.FreebusyBlockStore} store
	 */
	getSuggestionBlockStore : function()
	{
		return this.suggestionBlockStore;
	},

	/**
	 * Sets the block store.
	 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} store The free block store
	 * @param {Boolean} initial (optional) True if this function is called
	 * during initialization.
	 * @return {Zarafa.common.freebusy.data.FreebusyBlockStore} The free block store
	 * @private
	 */
	setSuggestionBlockStore : function(store, initial)
	{
		if (initial !== true && this.suggestionBlockStore === store) {
			return;
		}

		var oldSuggestionBlockStore = this.suggestionBlockStore;

		this.suggestionBlockStore = Ext.StoreMgr.lookup(store);

		this.fireEvent('suggestionblockstorechange', this.suggestionBlockStore, oldSuggestionBlockStore);
		if (this.suggestionBlockStore !== oldSuggestionBlockStore && oldSuggestionBlockStore && oldSuggestionBlockStore.autoDestroy) {
			oldSuggestionBlockStore.destroy();
		}

		return this.suggestionBlockStore;
	},

	/**
	 * This returns the number of users inside the {@link #userStore}.
	 * @return {Number} The number of users inside the userStore.
	 */
	getUserCount : function()
	{
		return this.userStore.getCount();
	},

	/**
	 * Adds user to the user list. The freebusy information is automatically requested when the user is resolved.
	 * @param {String} name name of the user that will be resolved and added to the list
	 * @param {Zarafa.core.mapi.RecipientType} type (optional) The recipientType for the user (defaults to MAPI_TO)
	 * @return {Zarafa.core.data.IPMRecipientRecord} the record representing the newly added user.
	 */
	addUser: function(name, type)
	{
		type = Ext.isNumber(type) ? type : Zarafa.core.mapi.RecipientType.MAPI_TO;

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, {
			display_name : name,
			recipient_type : type
		});

		// Adding record to userlist store to update the userlist
		this.userStore.add(record);

		return record;
	},

	/**
	 * Returns the daterange
	 * @return {Zarafa.util.DateRange} Daterange set in this model
	 */
	getDateRange: function()
	{
		return this.daterange;
	},

	/**
	 * Sets the date range.
	 * @param {Zarafa.util.DateRange} dateRange Daterange set for this model
	 * @param {Boolean} initial (optional) True if this function is called
	 * during initialization.
	 * @return {Zarafa.util.DateRange} Daterange set for this model
	 */
	setDateRange: function(dateRange, initial)
	{
		if (initial !== true && this.daterange === dateRange) {
			return;
		}

		var oldDateRange = this.daterange;
		this.daterange = dateRange;
		this.fireEvent('daterangechange', this.daterange, oldDateRange);
		return this.daterange;
	},

	/**
	 * Returns the selector range
	 * @return {Zarafa.util.DateRange} Daterange set for the selector in this model
	 */
	getSelectorRange: function()
	{
		return this.selectorRange;
	},

	/**
	 * Sets the selector range.
	 * @param {Zarafa.util.DateRange} selectorRange Daterange set for the selector in this model
	 * @param {Boolean} initial (optional) True if this function is called
	 * during initialization.
	 * @return {Zarafa.util.DateRange} Daterange set for the selector in this model
	 * @private
	 */
	setSelectorRange: function(selectorRange, initial)
	{
		if (initial !== true && this.selectorRange === selectorRange) {
			return;
		}

		if (this.selectorRange) {
			this.selectorRange.un('update', this.onSelectorRangeUpdate, this, { buffer: 5 });
		}

		this.selectorRange = selectorRange;

		if (this.selectorRange) {
			this.selectorRange.on('update', this.onSelectorRangeUpdate, this, { buffer: 5 });
		}

		return this.selectorRange;
	},

	/**
	 * Modifies the selected range in the timeline by changing the selectorRange.
	 * @param {Date} startDate Start date
	 * @param {Date} dueDate Due date
	 */
	selectRange: function(startDate, dueDate){
		/* Set a temporary state to disable the firing of the selectorrangeupdate event. When the
		 * start and due date are equal to those currently set in the selectorRange the DateRange
		 * will not fire an update. This temporary state is only reset to false when this update is
		 * fired. To prevent problems with this we check whether the selectorRange will fire an
		 * update.
		 */
		if(!this.selectorRange.equals( new Zarafa.core.DateRange({ startDate : startDate, dueDate : dueDate}) )){
			this.updatingSelectorRangeExternally = true;
		}
		this.selectorRange.set(startDate, dueDate);
	},

	/**
	 * Returns the suggestion range
	 * @return {Zarafa.util.DateRange} Daterange set for the suggestions in this model
	 */
	getSuggestionRange: function()
	{
		return this.suggestionRange;
	},

	/**
	 * Set the date for which the suggestionlist must be calculated.
	 * This will set the {@link #suggestionRange} object to the given
	 * date, and will reset the timerange according to the working/non-working
	 * hour settings.
	 * @param {Ext.Date} startDate The start Date for the suggestions
	 * @param {Number} duration (optional) The period for the suggestions
	 */
	setSuggestionDate : function(startDate, duration)
	{
		var start = startDate.clone().clearTime();
		var due = startDate.clone().clearTime();

		if (this.nonWorkingHoursHidden) {
			start = start.add(Date.MINUTE, container.getSettingsModel().get('zarafa/v1/main/start_working_hour'));
			due = due.add(Date.MINUTE, container.getSettingsModel().get('zarafa/v1/main/end_working_hour'));
		} else {
			// Use 12:00 as time, this prevents problems
			// for DST switches at 00:00 like in Brasil.
			due.setHours(12);
			due = due.add(Date.DAY, 1).clearTime();
		}

		// If the current suggestionTime equals the new time, the
		// DateRange will not trigger the update event. However, when
		// the duration has been set, we must assume a forced update
		// must be performed. So just fire the update event manually.
		//
		if (this.suggestionRange.getStartTime() !== start.getTime()) {
			this.suggestionRange.set(start, due);
		} else if (Ext.isDefined(duration)) {
			this.suggestionRange.fireEvent('update', this.suggestionRange);
		}
	},

	/**
	 * Load freebusy data for the {@link #blockStore} for the provided users.
	 * @param {Zarafa.core.data.IPMRecipient[]} userRecords The users for which the
	 * freebusy data is requested
	 * @private
	 */
	loadFreebusyData : function(userRecords)
	{
		var dateRange = this.getDateRange();
		var loadData = {
			add: true, // All blocks will be appended to the existing list.
			actionType : Zarafa.core.Actions['list'],
			params: {
				users: [],
				start: dateRange.getStartTime() / 1000,
				end: dateRange.getDueTime() / 1000
			}
		};

		if (!Array.isArray(userRecords)) {
			userRecords = [ userRecords ];
		}

		// Collect all unique identifiers of the resolved users, we sent
		// both the record ID as the entryid. The entryid is used by the PHP
		// to collect the data for the given recipient, the userid is used
		// in the response to correlate the response to the correct recipientRecord.
		Ext.each(userRecords, function(userRecord) {
			if (userRecord.isResolved()) {
				loadData.params.users.push({
					userid : userRecord.id,
					entryid : userRecord.get('entryid'),
					organizer : userRecord.isMeetingOrganizer()
				});
			}
		});

		// Perhaps none of the so-called "Resolved" users were
		// resolved. Thats lame, but it does mean less work for us.
		if (!Ext.isEmpty(loadData.params.users)) {
			this.blockStore.load(loadData);
		}
	},

	/**
	 * When the {@link #userStore} has resolved users, we can request all freebusy data
	 * for the resolved users.
	 * @param {Zarafa.core.data.IPMRecipientStore} userStore
	 * @param {Zarafa.core.data.IPMRecipient} userRecords
	 * @private
	 */
	onUserResolved : function(userStore, userRecords)
	{
		this.loadFreebusyData(userRecords);
	},

	/**
	 * When the {@link #userStore} has been loaded, make sure that all users will be
	 * resolved.
	 * @param {Zarafa.core.data.IPMRecipientStore} userStore
	 * @param {Zarafa.core.data.IPMRecipient} userRecords
	 * @private
	 */
	onUserLoad : function(userStore, userRecords)
	{
		this.loadFreebusyData(userRecords);
	},

	/**
	 * When an user is added to the userStore make sure that it is being resolved.
	 * @param {Zarafa.core.data.IPMRecipientStore} userStore Store
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} userRecords Records of the added users
	 * @param {Number} index Index
	 * @private
	 */
	onUserAdd: function(userStore, userRecords, index)
	{
		this.loadFreebusyData(userRecords);
	},

	/**
	 * When an user is removed from the userStore removing the related data in the blockStore.
	 * @param {Zarafa.core.data.IPMRecipientStore} userStore Store
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} userRecords
	 * @param {Number} index Index
	 * @private
	 */
	onUserRemove: function(userStore, userRecords, index)
	{
		Ext.each(userRecords, function(userRecord) {
			var records = this.blockStore.getRange();
			Ext.each(records, function(record) {
				if(record.get('userid') == userRecord.id) {
					this.blockStore.remove(record);
				}
			}, this);
		}, this);
	},

	/**
	 * When all users are removed from the userStore, all blocks can be removed from the blockStore.
	 * @param {Zarafa.core.data.IPMRecipientStore} userStore Store
	 * @param {Zarafa.core.data.IPMRecipientStore[]} userRecords
	 * @private
	 */
	onUserClear : function(userStore, records)
	{
		this.blockStore.removeAll();
	},

	/**
	 * Construct a {@link Ext.data.Record record} for the {@link #sumBlockStore}
	 * based on the start and end information from the given {@link Ext.data.Record record}.
	 * @param {Ext.data.Record} record The original record from which the sum block is based
	 * @return {Ext.data.Record} the record for the sumBlockStore
	 */
	createSumBlock : function(record)
	{
		return new Zarafa.common.freebusy.data.FreebusyBlockRecord({
			start: record.get('start'),
			end: record.get('end'),
			status: record.get('status')
		});
	},

	/**
	 * Construct a number of {@link Ext.data.Record records} for the {@link #suggestionStore}
	 * based on the start and end information. Calculating the number of possible suggestions
	 * is based on the start and end time. Within this range, (starting with 'start') we check
	 * if an suggestion with the given duration is possible. If it is, then a new block is created,
	 * and we move our 'start' value with the 'interval' value. If at this point we still have
	 * sufficient space until the end time, we can create another suggestion. This continues
	 * until we have reached the end of the interval.
	 */
	createSuggestionBlocks : function(start, end, duration, interval)
	{
		var blocks = [];

		// Reduce the end of the period with the duration. This way we can
		// schedule a suggestion for each interval between start and end.
		end -= duration;

		for (var i = start; i <= end; i += interval) {
			blocks.push(new Zarafa.common.freebusy.data.FreebusyBlockRecord({
				start: i,
				end: i + duration
			}));
		}

		return blocks;
	},

	/**
	 * Merge a {@link Ext.data.Record record} from the {@link #blockStore} into
	 * the {@link Ext.data.Record sumRecord} if the two overlap.
	 * @param {Ext.data.Record} record The record to merge into sumRecord
	 * @param {Ext.data.Record} sumRecord The record containing the summed data
	 * @return {Boolean} True if the record has been merged into sumRecord.
	 * @private
	 */
	mergeRecordIntoSumBlock : function(record, sumRecord)
	{
		// Status is different, we can't merge the record into sumRecord
		if (record.get('status') !== sumRecord.get('status')) {
			return false;
		}

		// Obtain the start & end timestamps for each record
		var start = record.get('start');
		var end = record.get('end');
		var sumStart = sumRecord.get('start');
		var sumEnd = sumRecord.get('end');

		// If the block is completely outside the sumBlock,
		// we can't do merge the record.
		if (end < sumStart || sumEnd < start) {
			return false;
		}

		// If the sumblock completely encapsulates the block,
		// we don't need to do anything, except marking the record as merged.
		if (sumStart <= start && end <= sumEnd) {
			return true;
		}

		// If the block completely encapsulates the sumblock,
		// we need to replace the sumblock with the new block.
		if (start < sumStart && sumEnd < end) {
			sumRecord.set('start', start);
			sumRecord.set('end', end);
			return true;
		}

		// If the block starts earlier then the sumblock,
		// we need to expand the sumblock to start earlier.
		if (start < sumStart) {
			sumRecord.set('start', start);
			return true;
		}

		// If the block starts later then the sumblock,
		// we need to expand the sumblock the end later.
		if (sumEnd < end) {
			sumRecord.set('end', end);
			return true;
		}

		// We checked earlier if the record is within sumRecord,
		// outside sumRecord or partially overlaps. Why did we
		// arrive here then? Perhaps the record exists in a
		// parallel universe?
		return false;
	},

	/**
	 * Merge the given {@link Ext.data.Record records} with normal FB block information
	 * into the {@link #sumBlockStore}. Each {@link Ext.data.Record record}
	 * is compared to the existing {@link Ext.data.Record records} from the {@link #sumBlockStore}.
	 * If needed the existing {@link Ext.data.Record record} is expanded to include the updated time.
	 * If the original {@link Ext.data.Record record} does not match any sumBlock then a new
	 * sumBlock will be created.
	 * @param {Ext.data.Record[]} records The records which must be merged into the sum block store
	 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} sumBlockStore The store containing the sum blocks
	 * @param {Boolean} splitBusyStatus (optional) If true then sumBlocks will be generated per
	 * BusyStatus group, otherwise a single sumBlock will be generated.
	 */
	mergeBlocksToSumBlockStore : function(records, sumBlockStore, splitBusyStatus)
	{
		var lastBlock = {};

		// Sort all records by start date, this ensures that we can apply the merging safely.
		records.sort(function(a, b) {
			return a.get('start') - b.get('start');
		});

		Ext.each(records, function(record) {
			//  We are not generating sumBlocks for the free status.
			var busyStatus = record.get('status');
			if (busyStatus === Zarafa.core.mapi.BusyStatus.UNKNOWN || busyStatus === Zarafa.core.mapi.BusyStatus.FREE) {
				return true;
			}

			if (splitBusyStatus === false) {
				busyStatus = Zarafa.core.mapi.BusyStatus.BUSY;
			}

			// The first item can be inserted directly
			if (sumBlockStore.getCount() === 0) {
				sumBlockStore.add(this.createSumBlock(record));
				return true;
			}

			var sumRecord = lastBlock[busyStatus];

			// Check if the new record can be merged into the sumRecord,
			// if this is not the case, we should add it as a new block.
			if (!Ext.isDefined(sumRecord) || this.mergeRecordIntoSumBlock(record, sumRecord) !== true) {
				var newSumBlock = this.createSumBlock(record);
				sumBlockStore.add(newSumBlock);
				lastBlock[busyStatus] = newSumBlock;
			}
		}, this);
	},

	/**
	 * Walk through the {@link Ext.data.Record records} from the {@link #sumBlockStore}
	 * to determine if any {@link Ext.data.Record record} overlapse. If this is the
	 * case the two {@link Ext.data.Record records} will be merged into a single block.
	 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} sumBlockStore The store containing the sumblocks
	 */
	mergeSumBlocks : function(sumBlockStore)
	{
		var lastBlock = {};

		// Start sorting the sumblocks based on their start date, they
		// could not have been added sorted into the store, since we
		// have been modifying the start/end values of the blocks after adding.
		sumBlockStore.sort('start', 'ASC');

		sumBlockStore.each(function(record) {
			var prevRecord = lastBlock[record.get('status')];

			// Check if the previous record and the current record overlap,
			// if this is the case the records can be merged. The comparison
			// is very simple since we only need to check if the end-time for
			// the previous item is after the start-time of the current item.
			if (Ext.isDefined(prevRecord)) {
				if (prevRecord.get('end') >= record.get('start')) {
					// Update the previous block
					prevRecord.set('end', record.get('end'));
					// And we don't need the new block anymore
					sumBlockStore.remove(record);
					return true;
				}
			}

			lastBlock[record.get('status')] = record;
		}, this);
	},

	/**
	 * Fires after a new set of Records has been loaded.
	 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} store
	 * @param {Ext.data.Record[]} records The Records that were loaded
	 * @param {Object} options The loading options that were specified (see {@link #load} for details)
	 * @private
	 */
	onBlockLoad : function(store, records, options)
	{
		// Always start with a clean store
		this.sumBlockStore.removeAll();

		if (this.getUserStore().getCount() == 1) {
			// One user, still easy, sumBlockStore is the same as blockStore
			this.blockStore.each(function(record) {
				//  We are not generating sumBlocks for the free status.
				var busyStatus = record.get('status');
				if (busyStatus !== Zarafa.core.mapi.BusyStatus.UNKNOWN && busyStatus !== Zarafa.core.mapi.BusyStatus.FREE) {
					this.sumBlockStore.add(this.createSumBlock(record));
				}
			}, this);
		} else {
			// Multiple users, tricky, merge the blockstore into the sumBlockStore
			this.mergeBlocksToSumBlockStore(this.blockStore.getRange(), this.sumBlockStore);
		}

		// Sort all sumblocks based on the status. This will force the
		// TENTATIVE records to be rendered before the BUSY which in turn is before
		// the OUTOFOFFICE. This in turn forces the browser to position the OUTOFOFFICE
		// divs on top of the BUSY blocks (which in turn are on top of TENATIVE) when
		// the blocks overlap.
		this.sumBlockStore.sort('status', 'ASC');

		this.sumBlockStore.fireEvent('load', this.sumBlockStore, this.sumBlockStore.getRange(), {});
	},

	/**
	 * Fires when a Record has been removed from the Store
	 *
	 * NOTE: Because of buffering which is applied for the invocation event handler,
	 * this handler will only be called for the first remove event
	 * in a batch. This implies that we cannot rely on the record and
	 * index arguments.
	 *
	 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} store
	 * @param {Ext.data.Record} record The Record that was removed
	 * @param {Number} index The index at which the record was removed
	 * @private
	 */
	onBlockRemove : function(store, record, index)
	{
		this.onBlockLoad(store, store.getRange(), {});
	},

	/**
	 * Fires after a new set of Records has been loaded.
	 * @param {Zarafa.common.freebusy.data.FreebusyBlockStore} store
	 * @param {Ext.data.Record[]} records The Records that were loaded
	 * @param {Object} options The loading options that were specified (see {@link #load} for details)
	 * @private
	 */
	onSumBlockLoad : function(store, records, options)
	{
		// Always start with a clean store
		this.freeBlockStore.removeAll();

		if (store.getCount() > 0) {
			// FIXME: We should actually build this store while building
			// the busy blocks. This is most likely faster then doing it
			// separately.
			this.mergeBlocksToSumBlockStore(records, this.freeBlockStore, false);
		}

		this.loadSuggestionBlocks();
	},

	/**
	 * Fires when the {@link #nonWorkingHoursHidden} has been updated.
	 * This will updated the {@link #suggestionRange} accordingly.
	 * @param {Boolean} hideNonWorkingHours True to only show working hours.
	 * @private
	 */
	onShowWorkingHoursChange : function(hideNonWorkingHours)
	{
		this.setSuggestionDate(this.suggestionRange.getStartDate());
	},

	/**
	 * Fires when the {@link #userStore} has been updated. This will force
	 * a load on the store to automatically update the {@link #blockStore}.
	 * @param {Zarafa.core.data.IPMRecipientStore} newStore
	 * @param {Zarafa.core.data.IPMRecipientStore} oldStore
	 * @private
	 */
	onUserStoreChange : function(newStore, oldStore)
	{
		newStore.fireEvent('load', newStore, newStore.getRange());
	},

	/**
	 * Fires when the {@link #selectorRange} has been updated. This
	 * will update the {@link #suggestionRange} accordingly.
	 * @param {Zarafa.core.DateRange} newRange The new selected range.
	 * @param {Zarafa.core.DateRange} oldRange The old selected range.
	 * @private
	 */
	onSelectorRangeUpdate : function(newRange, oldRange)
	{
		// Check to see if the update was triggered by outside sources
		if(!this.updatingSelectorRangeExternally){
			this.fireEvent('selectorrangeupdate', newRange, oldRange);
		}
		// Reset the state
		this.updatingSelectorRangeExternally = false;
		this.setSuggestionDate(newRange.getStartDate(), newRange.getDuration());
	},

	/**
	 * Fires when the {@link #suggestionRange} has been updated. This
	 * will recalculate the {@link #suggestionBlockStore} accordingly.
	 * @param {Zarafa.core.DateRange} newRange The new selected range.
	 * @param {Zarafa.core.DateRange} oldRange The old selected range.
	 * @private
	 */
	onSuggestionRangeUpdate : function(newRange, oldRange)
	{
		this.loadSuggestionBlocks();
	},

	/**
	 * This will recalculate the suggestion blocks in the {@link #suggestionBlockStore}
	 * based on the information from the {@link #freeBlockStore} and the {@link #selectorRange}.
	 * @private
	 */
	loadSuggestionBlocks : function()
	{
		// Always start with a clean store
		this.suggestionBlockStore.removeAll();

		if (this.freeBlockStore.getCount() > 0) {
			var start = this.suggestionRange.getStartTime() / 1000;
			var end = this.suggestionRange.getDueTime() / 1000;
			var duration = this.selectorRange.getDuration(Date.SECOND);
			var interval = Ext.min([duration, 30 * 60]); // FIXME: make configurable

			// But what if the appointment takes 0 minutes..
			// That would be dumb, but we won't be fooled!
			if (interval <= 0) {
				interval = 30 * 60;
			}

			this.freeBlockStore.each(function(sumBlock) {
				var sumStart = sumBlock.get('start');
				var sumEnd = sumBlock.get('end');

				if (sumEnd < start || sumStart > end) {
					// The entire block falls before the requested range,
					// just keep looping until we find the desired range.
					return;
				} else if (sumStart > end) {
					// The entire block falls after the requested range
					// we don't need to do anything anymore.
					return false;
				} else if (sumStart <= start) {
					// The block overlap our range, our new start
					// time is the end time of this block.
					start = sumEnd;
				} else {
					// The entire block falls after our start range,
					// simply add a suggestionblock from start to the sumBlock start.
					this.suggestionBlockStore.add(this.createSuggestionBlocks(start, Ext.min([sumStart, end]), duration, interval));
					start = sumEnd;
				}
			}, this);

			// Check if we still have a leftover...
			if (start < end) {
				this.suggestionBlockStore.add(this.createSuggestionBlocks(start, end, duration, interval));
			}
		}

		this.suggestionBlockStore.fireEvent('load', this.suggestionBlockStore, this.suggestionBlockStore.getRange(), {});
	},

	/**
	 * Function can be used to check if all added attendees are free on particular timeslot.
	 * @param {Date} periodStartTime object of start time
	 * @param {Date} periodEndTime object of end time
	 * @param {Boolean} modifiedOnly True if only the modified attendees should be checked
	 * @return {Boolean} return true if all attendees are free else false.
	 */
	checkAttendeesBusyStatus : function(periodStartTime, periodEndTime, modifiedOnly)
	{
		var userStore = this.getUserStore();
		if (!userStore) {
			return false;
		}

		var modified = userStore.getRange();
		for (var i = 0, len = modified.length; i < len; i++) {
			var user = modified[i];
			if ((modifiedOnly !== true || user.phantom === true) && !user.isMeetingOrganizer()) {
				if (this.checkAttendeeBusyStatus(user.id, periodStartTime, periodEndTime)) {
					return true;
				}
			}
		}

		return false;
	},

	/**
	 * Check if the given user is free on the given timeslot
	 * @param {String} userid The userid of the user to check for availability
	 * @param {Date} periodStartTime object of start time
	 * @param {Date} periodEndTime object of end time
	 * @return {Boolean} return true if the attendee is free.
	 */
	checkAttendeeBusyStatus : function(userid, periodStartTime, periodEndTime)
	{
		var blockStore = this.getBlockStore();
		if(!blockStore) {
			return false;
		}

		// Ensure that only the current userid is shown
		blockStore.filter('userid', userid, false, true, true);

		// Sort on start date
		blockStore.sort('start', 'ASC');

		// We need timestamps rather then Date objects
		periodStartTime = periodStartTime.getTime() / 1000;
		periodEndTime = periodEndTime.getTime() / 1000;

		// Lets search the block for Blocks that overlap with the requested period.
		var busy = false;

		for (var index = 0, len = blockStore.getCount(); index < len; index++) {
			var record = blockStore.getAt(index);

			/*
			 * First we need to remove appointments which are occuring extermely before/after our
			 * selected time, because then we have only set of appointments which are overlapping/inside
			 * our time slot.
			 * For that to achieve we first need sort the records based on start time and then to find
			 * out sum block record whose end time is greater then our selected start time
			 * and start time is less then our selected end time then we can say that
			 * the selected time is not proper for all the attendees.
			 */
			// remove appointments occuring extremely before our selected time
			if (record.get('end') > periodStartTime) {
				// check if we are really interested in this block
				if (record.get('status') === Zarafa.core.mapi.BusyStatus.FREE || record.get('status') === Zarafa.core.mapi.BusyStatus.UNKNOWN) {
					continue;
				}

				// before we have sorted the records based on start time so we will be having a record which either
				// overlaps current selected time or doesn't overlap it
				// below condition will check if the record overlaps current selected time
				if (record.get('start') < periodEndTime) {
					busy = true;
				}

				// if the above condition is not satisfied then we can say that
				// record is not overlapping current selected time and therefore
				// break the loop
				break;
			}
		}

		blockStore.clearFilter();

		return busy;
	}
});
