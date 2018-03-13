Ext.namespace('Zarafa.core.data');

// Extend Ext.data.Field documentation with a single config option.
/**
 * @class Ext.data.Field
 * @extends Object
 *
 * @cfg {Boolean} forceProtocol Used to determine if this field must
 * always be send to the server when {@link Zarafa.core.data.MAPIRecord#set record.set}
 * has been called. By default a field is only send to the server when it has been
 * modified, but with this option enabled, it will also be send when it has simply been set
 * with the same value as before.
 */

/**
 * @class Zarafa.core.data.MAPIRecord
 * @extends Ext.data.Record
 *
 * An extension to the {@link Ext.data.Record Record} that adds the open() method for loading
 * the 'full' contents of a MAPI item. The list modules on the server side only return partial records,
 * omitting, for example, the body of e-mail messages. The open() method can be used to retrieve
 * these fields.
 *
 */
Zarafa.core.data.MAPIRecord = Ext.extend(Ext.data.Record, {
	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties : [ 'entryid', 'store_entryid', 'parent_entryid' ],

	/**
	 * The array of properties which must be used to uniquely
	 * identify this record on the server (See {@link #baseIdProperties}.
	 * @property
	 * @type Array
	 * @private
	 */
	idProperties : undefined,

	/**
	 * The key-value object of {@link Zarafa.core.data.MAPISubStore MAPISubStore} which stores
	 * data of the complex properties like recipients, attachments etc. This container is mainly
	 * created to hold all {@link Zarafa.core.data.MAPISubStore MAPISubStore} at one place so
	 * {@link Zarafa.core.data.JsonWriter JsonWriter} can determine which {@link Zarafa.core.data.MAPISubStore MAPISubStore}
	 * it needs to serialize when serializing an {@link Zarafa.core.data.MAPIRecord MAPIRecord}.
	 * @property
	 * @type Object
	 * @private
	 */
	subStores : undefined,

	/**
	 * The key-value object of Booleans which stores the name of each SubStore which is supported
	 * by this Record. For each subStore name, the matching SubStore Type is provided which must be
	 * used to allocate the subStore. If no type is provided, then the given SubStore is not supported
	 * by this record.
	 * @property
	 * @type Object
	 * @private
	 */
	subStoresTypes : undefined,

	/**
	 * Used by {@link #setEventPropagation} and {@link #hasEventPropagation}, using this a record
	 * can be configured to prevent any events from the {@link Zarafa.core.data.IPMStore store} to
	 * be propagated through the {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr}
	 * @property
	 * @type Boolean
	 * @private
	 */
	eventPropagation : true,

	/**
	 * True to enable fine-grained modifications tracking between individual {@link Ext.data.Store#update} events.
	 * When trackUpdateModifications is true, {@link #updateModifications} will keep track of all properties
	 * which were updated since the last {@link Ext.data.Store#update} event.
	 * Must be updated through {@link #setUpdateModificationsTracking}.
	 * @property
	 * @type Boolean
	 * @private
	 */
	trackUpdateModifications : false,

	/**
	 * If {@link #trackUpdateModifications} is true, this field will contain all changes since the
	 * last {@link Ext.data.Store#update} event. When the next {@link Ext.data.Store#update} event
	 * has been fired, this object will be cleared again.
	 * @property
	 * @type Object
	 * @private
	 */
	updateModifications : undefined,

	/**
	 * If {@link #trackUpdateModifications} is true, this field will contains all substores which have
	 * fired the 'update' event since the last {@link Ext.data.Store#update} event. When the next
	 * {@link Ext.data.Store#update} event has been fired, this object will be cleared again.
	 * @property
	 * @type Object
	 * @private
	 */
	updateSubStoreModifications : undefined,

	/**
	 * The number of editors working on this records. The {@link #beginEdit} and {@link #endEdit}
	 * support nested editing blocks. This means that {@link #update} will not be fired until
	 * this counter drops to 0.
	 * @property
	 * @type Number
	 * @private
	 */
	editingCount : 0,

	/**
	 * The property will contain list of sub action types that will be sent to server when saving/deleting
	 * this record.
	 * @property
	 * @type Object
	 */
	actions : undefined,

	/**
	 * True if record is used for modal dialog. This is required because modal dialog will be the second dialog,
	 * with the same record (even though they are copies the entryid will be the same for both)
	 *
	 * @property
	 * @type Boolean
	 * @private
	 */
	isModalDialogRecord : false,

	/**
	 * @constructor
	 * @param {Object} data The data which must be applied to this record
	 * @param {Object} id The unique id for this record
	 * @param {Zarafa.core.data.RecordDefinition} definition The record definition used to
	 * construct this record
	 */
	constructor : function(data, id, definition)
	{
		Zarafa.core.data.MAPIRecord.superclass.constructor.call(this, data, id);

		this.idProperties = this.baseIdProperties.clone();

		this.actions = {};

		// initialize substore container
		this.subStores = {};
		this.subStoresTypes = {};

		if (definition) {
			this.subStoresTypes = definition.getSubStores();
		}
	},

	/**
	 * Copy the {@link Zarafa.core.data.MAPIRecord Record} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Zarafa.core.data.MAPIRecord} The copy of the record.
	 */
	copy : function(newId)
	{
		var copy = Zarafa.core.data.RecordFactory.createRecordObjectByRecordData(this.data, newId || this.id);

		copy.idProperties = this.idProperties.clone();
		copy.phantom = this.phantom;

		return copy.applyData(this, true);
	},

	/**
	 * Applies all data from an {@link Zarafa.core.data.MAPIRecord Record}
	 * to this instance. This will update all data, attachments, recipients, etc..
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to apply to this
	 * @param {Boolean} cheapCopy True to allow cheap assignment rather then the more
	 * expensive copying of all data.
	 * @return {Zarafa.core.data.MAPIRecord} this
	 */
	applyData : function(record, cheapCopy)
	{
		this.beginEdit();

		// This has to be synced before calling set(), as this field will
		// be used inside that function.
		this.trackUpdateModifications = record.trackUpdateModifications;

		// For each key in the remote data set, we are going to manually set
		// it inside our own dataset. This ensures that the 'modified' and
		// 'updateModifications' fields will automatically be updated to contain
		// the correct set of data.
		// if record is modal dialog record then instead of all merge only those properties which was changed
		var data = record.isModalDialogRecord ? record.modified : record.data;
		for (var key in data) {
			if(key === 'message_class') {
				// Don't update record's message_class while updating the record
				// As it is it's identity of record type and fields assigned to it.
				continue;
			}
			if (Ext.isDate(record.data[key])) {
				this.set(key, record.data[key].clone());
			} else {
				this.set(key, record.data[key]);
			}
		}

		// The actions are seperate from the 'data', so we must copy it
		// separately. Note that we have no change or event mechanism for
		// this field, so bluntly copying the object is sufficient.
		this.actions = Ext.apply({}, record.actions);

		// Trigger a fake 'open' event, when the original
		// record is open and the id properties indicate that
		// both instances are referring to the exact same instance
		if (this.idProperties.equals(record.idProperties)) {
			// Create all substores & merge the contents into
			// the new substores. Perform this action before
			// calling afterOpen() as that function expects
			// the contents of the substores to be properly
			// initialized, and might add additional records
			// into the substores
			this.createSubStores();
			this.mergeSubStores(record.subStores, cheapCopy);

			// We are done with merging everything,
			// call afterOpen() if needed to ensure the
			// last initialization of the record occurs,
			// and if record which refered by "this"
			// is not opened.
			if (record.isOpened() && !this.isOpened()) {
				this.afterOpen();
			}
		}

		this.endEdit();

		return this;
	},

	/**
	 * Save all changes inside this record to the store.
	 * This will call {@link Zarafa.core.data.MAPIStore#save} with itself
	 * as argument.
	 */
	save : function()
	{
		this.getStore().save(this);
	},

	/**
	 * Compare this {@link Zarafa.core.data.MAPIRecord record} instance with another one to see
	 * if they are the same MAPI Item from the server (i.e. The entryid matches).
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The MAPIRecord to compare with
	 * @return {Boolean} True if the records are the same.
	 */
	equals : Ext.emptyFn,

	/**
	 * Enable/Disable event {@link #eventPropagation propagation} from the
	 * {@link Zarafa.core.data.IPMStore store} regarding this record by the
	 * {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr}.
	 * @param {Boolean} eventPropagation True if events can be propagated.
	 */
	setEventPropagation : function(eventPropagation)
	{
		this.eventPropagation = eventPropagation;
	},

	/**
	 * Checks if events can from the {@link Zarafa.core.data.IPMStore store} regarding
	 * this record can be {@link #eventPropagation propagated} further by the
	 * {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr}.
	 * @return {Boolean} True if events can be propagated.
	 */
	hasEventPropagation : function()
	{
		return this.eventPropagation;
	},

	/**
	 * Enable/disable UpdateModifications tracking. This will keep track of the
	 * exact modifications between two {@link Ext.data.Store#update} events. This allows
	 * finegrained tuning of UI components which constantly listen to
	 * {@link Ext.data.Store#update} events and only require the modifications since the
	 * last update call.
	 * @param {Boolean} enable Enable updatemodification tracking
	 */
	setUpdateModificationsTracking : function(enable)
	{
		this.trackUpdateModifications = enable;
	},

	/**
	 * Get the updateModifications tracking status
	 * @return {Boolean} True when update Modifications tracking has been enabled..
	 */
	getUpdateModificationsTracking : function()
	{
		return this.trackUpdateModifications;
	},

	/**
	 * @return {Ext.data.Store} data store this record belongs to.
	 */
	getStore : function()
	{
		return this.store;
	},

	/**
	 * Opens the record, loading all fields.
	 * @param {Object} options Extra options to be used for loading the record
	 */
	open : function(options)
	{
		if (this.isOpened() && (!options || options.forceLoad !== true)) {
			return;
		}
		this.store.open(this, options);
	},

	/**
	 * Called by the store after the record was opened successfully.
	 * @private
	 */
	afterOpen : function()
	{
		this.opened = true;
		this.createSubStores();
		delete this.updateModifications;
		delete this.updateSubStoreModifications;
	},

	/**
	 * @return {Boolean} true iff the record has been fully loaded.
	 */
	isOpened : function()
	{
		return this.opened === true;
	},

	/**
	 * Set a value for the given fieldname.
	 * @param {String} name The {@link Ext.data.Field#name name of the field} to set.
	 * @param {String/Object/Array} value The value to set the field to.
	 * @param {Boolean} force (optional) True to force the property to be changed in
	 * the modified array. Setting this argument will effectively override the
	 * {@link Ext.data.Field#forceProtocol forceProtocol} option for the property we are modifying here.
	 */
	set : function(name, value, force)
	{
		var forceProtocol = force;
		if (!Ext.isDefined(forceProtocol)) {
			var field = this.fields.get(name);
			forceProtocol = Ext.isDefined(field) ? field.forceProtocol : false;
		}

		if (this.trackUpdateModifications === true) {
			var encode = Ext.isPrimitive(value) ? String : Ext.encode;

			if (encode(this.data[name]) !== encode(value)) {
				// If the value is different, then we have to update
				// the 'updateModifications'. This is slightly different
				// behavior then the 'modified' array, as that array will
				// be updated even when the value is the same but
				// 'forceProtocol' was enabled.
				if (!this.updateModifications) {
					this.updateModifications = {};
				}

				if (this.updateModifications[name] === undefined) {
					this.updateModifications[name] = this.data[name];
				}
			} else if (forceProtocol !== true) {
				// No changes were made, nor is this property being
				// forced to be transmitted to the server...
				return;
			}
		}

		Zarafa.core.data.MAPIRecord.superclass.set.call(this, name, value);
		this.modified = this.modified || {};
		if (forceProtocol === true && this.modified[name] === undefined) {
			this.modified[name] = this.data[name];
		}
	},

	/**
	 * Called after a record has been edited
	 * @private
	 */
	afterEdit : function()
	{
		Zarafa.core.data.MAPIRecord.superclass.afterEdit.call(this);
		delete this.updateModifications;
		delete this.updateSubStoreModifications;
	},

	/**
	 * Called after a record modifications have been rejected
	 * @private
	 */
	afterReject : function()
	{
		Zarafa.core.data.MAPIRecord.superclass.afterReject.call(this);
		delete this.updateModifications;
		delete this.updateSubStoreModifications;
	},

	/**
	 * Begin an edit. While in edit mode, no events (e.g.. the <code>update</code> event)
	 * are relayed to the containing store.
	 * See also: <code>{@link #endEdit}</code> and <code>{@link #cancelEdit}</code>.
	 *
	 * This function is overridden from {@link Ext.data.Record#beginEdit} and adds
	 * support for nested editing blocks by using the {@link #editingCount}.
	 */
	beginEdit : function()
	{
		// Increase editing counter, if it is a negative value, it means that
		// it has been corrupted and we must force it to something valid.
		this.editingCount++;
		if (this.editingCount < 1) {
			this.editingCount = 1;
		}

		// If this is not a nested call, we can direct the call to the superclass.
		if (this.editingCount === 1) {
			Zarafa.core.data.MAPIRecord.superclass.beginEdit.call(this);
			this.updateModifications = this.updateModifications || {};
			this.updateSubStoreModifications = this.updateSubStoreModifications || {};
		}
	},

	/**
	 * Cancels all changes made in the current edit operation.
	 *
	 * This function is overridden from {@link Ext.data.Record#cancelEdit} and adds
	 * support for nested editing blocks by using the {@link #editingCount}.
	 */
	cancelEdit : function()
	{
		// Increase editing counter, if it is a negative value, it means that
		// it has been corrupted and we must force it to something valid.
		this.editingCount--;
		if (this.editingCount < 0) {
			this.editingCount = 0;
		}

		// If this is not a nested call, we can direct the call to the superclass.
		if (this.editingCount === 0) {
			Zarafa.core.data.MAPIRecord.superclass.cancelEdit.call(this);
			delete this.updateModifications;
			delete this.updateSubStoreModifications;
		}
	},

	/**
	 * Ends all editing made in the current edit operation and calls {@link #afterEdit}.
	 *
	 * This function is overridden from {@link Ext.data.Record#endEdit} and adds
	 * support for nested editing blocks by using the {@link #editingCount}.
	 */
	endEdit : function()
	{
		// Increase editing counter, if it is a negative value, it means that
		// it has been corrupted and we must force it to something valid.
		this.editingCount--;
		if (this.editingCount < 0) {
			this.editingCount = 0;
		}

		// If this is not a nested call, we can direct the call to the superclass.
		if (this.editingCount === 0) {
			Zarafa.core.data.MAPIRecord.superclass.endEdit.call(this);
		}
	},

	/**
	 * Usually called by the {@link Ext.data.Store} which owns the Record.
	 * Commits all changes made to the Record since either creation, or the last commit operation.
	 * <p>Developers should subscribe to the {@link Ext.data.Store#update} event
	 * to have their code notified of commit operations.</p>
	 * @param {Boolean} silent (optional) True to skip notification of the owning
	 * store of the change (defaults to false)
	 */
	commit : function(silent)
	{
		// Delete the local modification tracking
		delete this.updateModifications;
		delete this.updateSubStoreModifications;

		// Commit changes to substores
		for (var key in this.subStores) {
			this.subStores[key].commitChanges();
		}

		Zarafa.core.data.MAPIRecord.superclass.commit.call(this, silent);
	},

	/**
	 * When UpdateModifications tracking has been enabled, this function will return
	 * true if the given field has been modified since the last {@link Ext.data.Store#update}
	 * event. If UpdateModifications tracking has been disabled, this function will return
	 * the same value as {@link #isModified}.
	 * @param {String} fieldName The fieldname which has been modified
	 * @return {Boolean} True if the field has been modified
	 */
	isModifiedSinceLastUpdate : function(fieldName)
	{
		if (this.trackUpdateModifications === true) {
			return !!(this.updateModifications && this.updateModifications.hasOwnProperty(fieldName));
		} else {
			return this.isModified(fieldName);
		}
	},

	/**
	 * When updateModifications tracking has been enabled, this function will return
	 * true if the given substore has been modified since the last {@link Ext.data.Store#update}
	 * event. UpdateModifications tracking has been disabled, this function will return
	 * if the subStore has been modified since the subStore was created.
	 * @param {String} subStore Name of the subStore
	 * @return {Boolean} True if the field has been modified
	 */
	isSubStoreModifiedSincelastUpdate : function(subStore)
	{
		if (this.trackUpdateModifications === true) {
			return !!(this.updateSubStoreModifications && this.updateSubStoreModifications.hasOwnProperty(subStore));
		} else {
			subStore = this.getSubStore(subStore);
			return (!Ext.isEmpty(subStore.modified) || !Ext.isEmpty(subStore.removed));
		}
	},

	/**
	 * Returns the list of all added/modified/deleted records inside the subStore since the last
	 * {@link Ext.data.Store#update} event.
	 * @param {String} subStore Name of the subStore
	 * @return {Array} The array of the records which were changed since the last update.
	 */
	getSubStoreChangesSinceLastUpdate : function(subStore)
	{
		if (this.trackUpdateModifications === true) {
			if (this.updateSubStoreModifications && this.updateSubStoreModifications[subStore]) {
				return this.updateSubStoreModifications[subStore].changes;
			}
		} else {
			subStore = this.getSubStore(subStore);
			return [].concat(subStore.modified, subStore.removed);
		}
	},

	/**
	 * Get the Message Action list for the {@link Zarafa.core.data.MAPIRecord record}.
	 * @return {Mixed} The Message Action list.
	 */
	getMessageActions : function()
	{
		return this.actions;
	},

	/**
	 * Get Message Action for the {@link Zarafa.core.data.MAPIRecord record}.
	 * @param {String} actionName The name of action.
	 * @return {Mixed} The Message Action.
	 */
	getMessageAction : function(actionName)
	{
		if(this.actions[actionName]) {
			return this.actions[actionName];
		} else {
			return false;
		}
	},

	/**
	 * Add action to Message Action list
	 * @param {String} name The action name to add to the list.
	 * @param {String} value The value attached to the action name
	 */
	addMessageAction : function(name, value)
	{
		this.actions[name] = value;

		// @todo we don't want to send updates at this point since the record may not be complete. Needs a begin/end construct
		// to work properly

		// Notify modication change, but do not send a notification to the UI (since no UI has changed)
		if(Ext.isDefined(this.store) && this.store.modified.indexOf(this) == -1){
			this.store.modified.push(this);
		}
	},

	/**
	 * Delete action from the Message Action list
	 * @param {String} name The action name to delete from the list.
	 */
	deleteMessageAction : function(name)
	{
		delete this.actions[name];
	},

	/**
	 * @param {String} name name of message action.
	 * @return {Boolean} True if a {@link #actions message action} with the given name exists.
	 */
	hasMessageAction : function(name)
	{
		return Ext.isDefined(this.actions[name]);
	},

	/**
	 * Clear all Message Actions.
	 */
	clearMessageActions : function()
	{
		this.actions = {};
	},

	/**
	 * Clear Action Response.
	 */
	clearActionResponse : function()
	{
		delete this.action_response;
	},

	/**
	 * Get requested data from the Action Response.
	 * @param {String} key Requested action response property
	 * @return {Mixed} The corresponding data
	 */
	getActionResponse : function(key)
	{
		if(this.action_response){
			return this.action_response[key];
		}
	},

	/**
	 * Copy the {@link Zarafa.core.data.MAPIRecord record} to a different
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to copy the record to
	 */
	copyTo : function(folder)
	{
		this.addMessageAction('action_type', 'copy');
		this.addMessageAction('destination_parent_entryid', folder.get('entryid'));
		this.addMessageAction('destination_store_entryid', folder.get('store_entryid'));
	},

	/**
	 * Move the {@link Zarafa.core.data.MAPIRecord record} to a different
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to copy the record to
	 */
	moveTo : function(folder)
	{
		this.addMessageAction('action_type', 'move');
		this.addMessageAction('destination_parent_entryid', folder.get('entryid'));
		this.addMessageAction('destination_store_entryid', folder.get('store_entryid'));
	},

	/**
	 * Checks if the SubStore with the given name is supported by this record.
	 * @param {String} name The name of the subStore to check
	 * @return {Boolean} True if the given SubStore is supported by this Record.
	 */
	supportsSubStore : function(name)
	{
		return Ext.isFunction(this.subStoresTypes[name]);
	},

	/**
	 * This will create a new {@link #subStores SubStore} for the given name
	 * (if this is {@link #supportsSubStore supported}). The new substore will
	 * automatically be {@link #setSubStore set} on this record.
	 *
	 * @param {String} name The name of the subStore to create
	 * @return {Zarafa.core.data.MAPISubStore} The new substore.
	 */
	createSubStore : function(name)
	{
		if (this.supportsSubStore(name)) {
			var store = this.getSubStore(name);
			if (!Ext.isDefined(store)) {
				store = this.setSubStore(name, new this.subStoresTypes[name]());
				store.on('update', this.onSubStoreUpdate, this);
				store.on('add', this.onSubStoreChange, this);
				store.on('remove', this.onSubStoreChange, this);
			}
			return store;
		}
	},

	/**
	 * Create all {@link #subStores} which are {@link #subStoresTypes supported}
	 * by this record.
	 */
	createSubStores : function()
	{
		for (var key in this.subStoresTypes) {
			if (!this.getSubStore(key)) {
				this.createSubStore(key);
			}
		}
	},

	/**
	 * Get the SubStore for a particular name. This will get the SubStore from the {@link #subStores} field.
	 * @param {String} name The name of the substore to get
	 * @return {Zarafa.core.data.MAPISubStore} The substore.
	 */
	getSubStore : function(name)
	{
		if (this.subStores !== null) {
			return this.subStores[name];
		}
		return undefined;
	},

	/**
	 * Set the SubStore for a particular name. This will set the SubStore on the {@link #subStores} field.
	 * @param {String} name The name of the subStore to set
	 * @param {Zarafa.core.data.MAPISubStore} store the subStore.
	 * @return {Zarafa.core.data.MAPISubStore} The substore.
	 */
	setSubStore : function(name, store)
	{
		if (this.subStores === null) {
			this.subStores = {name : store};
		} else {
			this.subStores[name] = store;
		}
		store.setParentRecord(this);
		return store;
	},

	/**
	 * Merge a substore into the substore inside this record.
	 * @param {String} name The name of the subStore to merge
	 * @param {Zarafa.core.data.MAPISubStore} remoteSubStore The store to merge
	 * @param {Boolean} cheapCopy Use the cheap assignment rather then the more expensive copying
	 * of all records
	 */
	mergeSubStore : function(name, remoteSubStore, cheapCopy)
	{
		var subStore = this.getSubStore(name);

		if (subStore && remoteSubStore) {
			if (cheapCopy !== true ) {
					// When we are not performing a cheap copy we wish to preserve
					// the "add", "modify" and "delete" changes in the subStore.

					var prop = name === 'attachments' ? 'attach_id' : 'entryid';
					// Go over the current store, and start searching for the corresponding
					// record in the remote store.
					subStore.each(function(record) {
						var remoteRecordIndex = remoteSubStore.findBy(function (remoteRecord) {
							return this.idComparison(record.get(prop), remoteRecord.get(prop));
						}, this);

						if (remoteRecordIndex < 0) {
							// The other store doesn't contain this record,
							// remove it from the current store.
							subStore.remove(record);
						}
					}, this);

					// Go over the remote store to search for any new records which were added
					remoteSubStore.each(function(record) {
						var origRecordIndex = subStore.findBy(function (storeRecord) {
							return this.idComparison(record.get(prop), storeRecord.get(prop));
						}, this);

						if (origRecordIndex < 0) {
							// New record, add it to the current store.
							subStore.add(record.copy());
						}
					}, this);
			} else {
				// A cheap copy is nothing more that destroy all
				// currently available data and move all records
				// from the remote store into the current store.
				// We fire the 'datachanged' event to inform the
				// UI of the bulk change which has been performed.
				subStore.removeAll(true);
				subStore.add(remoteSubStore.getRange(), true);
				subStore.fireEvent('datachanged', subStore);
			}
		}
	},

	/**
	 * Function which is used to compare two entry ids also
	 * it is take care of comparing local contact items.
	 *
	 * @param {String} entryIdOne The first id to compare
	 * @param {String} entryIdTwo The second id to compare
	 * @return {Boolean} return true if entryId is same else false.
	 * @protected
	 */
	idComparison : function(entryIdOne, entryIdTwo)
	{
		entryIdOne = Zarafa.core.EntryId.hasContactProviderGUID(entryIdOne) ?
			Zarafa.core.EntryId.unwrapContactProviderEntryId(entryIdOne) : entryIdOne;

		entryIdTwo = Zarafa.core.EntryId.hasContactProviderGUID(entryIdTwo) ?
			Zarafa.core.EntryId.unwrapContactProviderEntryId(entryIdTwo) : entryIdTwo;

		return Zarafa.core.EntryId.compareEntryIds(entryIdOne, entryIdTwo);
	},

	/**
	 * Merge all data from the object containing subStores into this record.
	 * This will call {@link #mergeSubStore} for each subStore found in the SubStores object,
	 * note that only stores which are {@link #supportsSubStore supported} will be merged.
	 * @param {Object} subStores The key-value array containing all subStores which must
	 * be applied to the record.
	 * @param {Boolean} cheapCopy Use the cheap assignment rather then the more expensive copying
	 * of all records
	 */
	mergeSubStores : function(subStores, cheapCopy)
	{
		for (var key in subStores) {
			if (this.supportsSubStore(key)) {
				this.mergeSubStore(key, subStores[key], cheapCopy);
			}
		}
	},

	/**
	 * Event handler which is fired when data in this subStore has changed. This will markt the subStore as
	 * changed and force the {@link Ext.data.Store#update} event of the store of this record.
	 * @param {Zarafa.core.data.MAPISubStore} store The store which was changed
	 * @param {Zarafa.core.data.MAPIRecord[]} records The records which were added/modified/removed
	 * @private
	 */
	onSubStoreChange : function(store, records)
	{
		for (var key in this.subStores) {
			if (this.subStores[key] === store) {
				if (this.trackUpdateModifications === true) {
					if (!this.updateSubStoreModifications) {
						this.updateSubStoreModifications = {};
					}

					if (!Ext.isDefined(records)) {
						records = store.getRange();
					}

					var changes = this.updateSubStoreModifications[key];
					if (!changes) {
						changes = {
							store : store,
							changes : [].concat(records)
						};
						this.updateSubStoreModifications[key] = changes;
					} else {
						changes.changes = changes.changes.concat(records);
					}
				}

				this.dirty = true;
				// Because we manually force the 'update' event to be fired,
				// we must create the local modified array. ExtJs demands
				// that afterEdit() must only be called when the modified
				// array exists.
				this.modified = this.modified || {};
				if (!this.editing) {
					this.afterEdit();
				}
				break;
			}
		}
	},

	/**
	 * Event handler which is fired when data in this subStore has been updated. This will check
	 * if the given action is {@link Ext.data.Record#COMMIT}, in that case no action is taken,
	 * in other cases {@link #onSubStoreChange} is called to act upon a change inside the substore
	 * contents.
	 * @param {Zarafa.core.data.MAPISubStore} store The store which fired the event
	 * @param {Zarafa.core.data.MAPIRecord[]} records The records which were modified
	 * @param {String} action The action which was performed (could be
	 * {@link Ext.data.Record#EDIT}, {@link Ext.data.Record#REJECT}, {@link Ext.data.Record#COMMIT}).
	 * @private
	 */
	onSubStoreUpdate : function(store, records, action)
	{
		if (action !== Ext.data.Record.COMMIT) {
			this.onSubStoreChange(store, records);
		}
	},

	/**
	 * Add extra Identification property to the {@link #idProperties} array.
	 * This will serialize the given property into the identification section
	 * when communication with the server.
	 *
	 * @param {String} prop The propertyname to be added
	 */
	addIdProp : function(prop)
	{
		if (!this.hasIdProp(prop)) {
			this.idProperties.push(prop);
		}
	},

	/**
	 * Check if the given property is an {@link #idProperties id prop}.
	 * @param {String} prop The name of the property
	 * @return {Boolean} True if the given prop is an ID property
	 */
	hasIdProp : function(prop)
	{
		return this.idProperties.indexOf(prop) > -1;
	},

	/**
	 * Remove extra Identification property from the {@link #idProperties} array.
	 * @param {String} prop The name of the property
	 */
	removeIdProp : function(prop)
	{
		if(this.hasIdProp(prop)) {
			this.idProperties.splice(this.idProperties.indexOf(prop), 1);
		}
	},

	/**
	 * Obtain the list of of identification properties ({@link #idProperties}).
	 * These properties will be placed inside the identification section of
	 * the protocol during the communication with the server.
	 *
	 * @return {array} the array of identification properties.
	 */
	getIdProps : function()
	{
		return this.idProperties;
	},

	/**
	 * Convinience method to get {@link Zarafa.core.mapi.DisplayType} or {@link Zarafa.core.mapi.DisplayTypeEx}
	 * property value from {@link Zarafa.core.data.IPMRecord}.
	 *
	 * @return {Zarafa.core.mapi.DisplayType|Zarafa.core.mapi.DisplayTypeEx} The display type value.
	 */
	getDisplayType : function()
	{
		var displayType = this.get('display_type');
		var displayTypeEx = this.get('display_type_ex');
		var returnValue;

		switch(displayType) {
			case Zarafa.core.mapi.DisplayType.DT_MAILUSER:
			case Zarafa.core.mapi.DisplayType.DT_DISTLIST:
				returnValue = displayTypeEx & ~Zarafa.core.mapi.DisplayTypeEx.DTE_FLAG_ACL_CAPABLE;
				break;
			default:
				returnValue = displayType;
				break;
		}

		return returnValue;
	},

	/**
	 * Destroy the record, this will destroy the record and the record data
	 * ensuring that all references are lost.
	 */
	destroy : function()
	{
		// Destroy all substores
		for (var key in this.subStores) {
			this.subStores[key].destroy();
		}
		this.subStores = null;
	}
});
