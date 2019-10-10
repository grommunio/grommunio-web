/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/mapi/DisplayType.js
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 * #dependsFile client/zarafa/core/data/Record.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 */
Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMRecipientRecordFields
 *
 * Array of default fields for the {@link Zarafa.core.data.IPMRecipientRecord} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Zarafa.core.data.IPMRecipientRecord record}.
 */
Zarafa.core.data.IPMRecipientRecordFields = [
	{name: 'entryid'},
	{name: 'search_key'},
	{name: 'rowid', type: 'int'},
	{name: 'object_type', type: 'int', defaultValue: Zarafa.core.mapi.ObjectType.MAPI_MAILUSER},
	{name: 'display_name'},
	{name: 'display_type', type: 'int', defaultValue: Zarafa.core.mapi.DisplayType.DT_MAILUSER},
	{name: 'display_type_ex', type: 'int', defaultValue: Zarafa.core.mapi.DisplayType.DT_MAILUSER},
	{name: 'email_address'},
	{name: 'smtp_address'},
	{name: 'address_type', type: 'string', defaultValue: 'SMTP'},
	{name: 'presence_status', type: 'int'}, // Note: this field will not be filled by the back-end

	{name: 'recipient_type', type: 'int'},
	{name: 'recipient_flags', type: 'int'},
	{name: 'recipient_trackstatus', type: 'int'},
	{name: 'recipient_trackstatus_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},

	{name: 'proposednewtime', type: 'boolean', defaultValue: false},
	{name: 'proposednewtime_start', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'proposednewtime_end', type: 'date', dateFormat: 'timestamp', defaultValue: null}
];

/**
 * @class Zarafa.core.data.IPMRecipientRecord
 * @extends Ext.data.Record
 */
Zarafa.core.data.IPMRecipientRecord = Ext.extend(Ext.data.Record, {
	/**
	 * Indicates whether it has been attempted to resolve this record.
	 * @property
	 * @type Boolean
	 */
	resolveAttempted : false,

	/**
	 * Indicates whether it has been attempted to resolve this record,
	 * but multiple potential recipients were found (out of which the
	 * user has not yet selected the desired recipient).
	 * This property is only valid when {@link #resolveAttempted} is true.
	 * @property
	 * @type Boolean
	 */
	resolveAttemptAmbiguous : false,

	/**
	 * Copy the {@link Zarafa.core.data.IPMRecipientRecord Record} to a new instance
	 * @param {String} newId (optional) A new Record id, defaults to the id of the record being copied. See id.
	 * @return {Zarafa.core.data.IPMRecipientRecord} The copy of the record.
	 */
	copy : function(newId)
	{
		var copy = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, this.data, newId || this.id);

		copy.phantom = this.phantom;

		return copy.applyData(this);
	},

	/**
	 * Applies all data from an {@link Zarafa.core.data.IPMRecipientRecord IPMRecipientRecord}
	 * to this instance. This will update all data.
	 *
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The record to apply to this
	 * @return {Zarafa.core.data.IPMRecipientRecord} this
	 */
	applyData : function(record)
	{
		this.beginEdit();

		Ext.apply(this.data, record.data);
		Ext.apply(this.modified, record.modified);

		this.resolveAttempted = record.resolveAttempted;
		this.resolveAttemptAmbiguous = record.resolveAttemptAmbiguous;
		this.dirty = record.dirty;

		this.endEdit(false);

		return this;
	},

	/**
	 * See {@link Ext.data.Record.isResolved}. Recipients which meeting organizer are always considered
	 * invalid to prevent them to be saved to the server.
	 * @return {Boolean} False if this this is the meeting organizer recipient.
	 */
	isValid : function()
	{
		if (this.isMeetingOrganizer()) {
			return false;
		} else {
			return Zarafa.core.data.IPMRecipientRecord.superclass.isValid.call(this);
		}
	},

	/**
	 * Resolve recipient.
	 */
	resolve : function()
	{
		if (this.store) {
			this.store.resolve(this);
		}
	},

	/**
	 * A recipient has been resolved when an entryid has been set that is not a one-off.
	 * When a one-off entryid has been set, the email address will be tested with a regexp
	 * to check its validity.
	 * @return {Boolean} True if this recipient has been resolved.
	 */
	isResolved : function()
	{
		if (Ext.isEmpty(this.get('entryid'))) {
			return false;
		}
		if (!this.isOneOff()) {
			return true;
		}

		var smtp = this.get('smtp_address');
		return Zarafa.reSingleEmailAddress.test(smtp);
	},

	/**
	 * A {@link #isResolved resolved} recipient could also imply that it is an OneOff entryid,
	 * which is a recipient which is not inside the addressbook.
	 * @return {Boolean} True if this recipient has an OneOff entryid.
	 */
	isOneOff : function()
	{
		return Zarafa.core.EntryId.isOneOffEntryId(this.get('entryid'));
	},

	/**
	 * @return {Boolean} True if the smtp address is a valid email address.
	 */
	isValidSMTP: function()
	{
		return Zarafa.core.Util.validateEmailAddress(this.get('smtp_address'));
	},

	/**
	 * @return {Boolean} True if this recipient has been {@link #attemptedToResolve attempted to resolve},
	 * but turned out to be ambiguous.
	 */
	isAmbiguous : function()
	{
		return this.resolveAttempted && this.resolveAttemptAmbiguous;
	},

	/**
	 * This determines if the Recipient refers to a local Contact from the users own store
	 * @return {Boolean} True when the recipient represents a local contact
	 */
	isPersonalContact: function()
	{
		if (this.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_MAILUSER && Zarafa.core.EntryId.hasContactProviderGUID(this.get('entryid'))) {
			return true;
		}
		return false;
	},

	/**
	 * This determines if the Recipient refers to a local Distlist from the users own store
	 * @return {Boolean} True when the recipient represents a local distlist
	 */
	isPersonalDistList: function()
	{
		if (this.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_DISTLIST && Zarafa.core.EntryId.hasContactProviderGUID(this.get('entryid'))) {
			return true;
		}
		return false;
	},

	/**
	 * @return {Boolean} True if it was attempted to resolve this recipient.
	 */
	attemptedToResolve: function()
	{
		return this.resolveAttempted;
	},

	/**
	 * @return {Boolean} True when the given recipientType is the Organizer
	 */
	isMeetingOrganizer: function()
	{
		var recipientFlags = this.get('recipient_flags');
		return (recipientFlags & Zarafa.core.mapi.RecipientFlags.recipOrganizer) === Zarafa.core.mapi.RecipientFlags.recipOrganizer;
	},

	/**
	 * Compare this {@link Zarafa.core.data.IPMRecipientRecord record} instance with another one to see
	 * if they are the same IPM recipient.
	 *
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The IPMRecipientRecord to compare with
	 * @return {Boolean} True if the records are the same.
	 */
	equals : function(record)
	{
		var equalStrA = this.get('smtp_address');
		var equalStrB = record.get('smtp_address');

		// If we can't compare on smtp address, we should compare
		// on display name.
		if (Ext.isEmpty(equalStrA) || Ext.isEmpty(equalStrB)) {
			equalStrA = this.get('display_name') || '';
			equalStrB = record.get('display_name') || '';
		}

		if (equalStrA.toUpperCase() == equalStrB.toUpperCase()) {
			return true;
		}

		// TODO: Compare on entryid?

		return false;
	},

	/**
	 * Convert this recipient into a {@link Zarafa.core.data.MAPIRecord record}
	 * which can be used in the addressbook. This can only work if this
	 * recipient is {@link #isResolved resolved}.
	 *
	 * @return {Zarafa.core.data.MAPIRecord} The addressbook record which
	 * is represented by this recipient.
	 */
	convertToABRecord : function()
	{
		var objectType = Zarafa.core.mapi.ObjectType.MAPI_MAILUSER;

		if (!this.isResolved()) {
			return false;
		}

		var entryid = this.get('entryid');
		var displayType = this.get('display_type');

		// use the display_type to determine which ObjectType the
		// addressbook entry is. This will allow is to open the
		// correct dialog.

		switch (displayType) {
			case Zarafa.core.mapi.DisplayType.DT_MAILUSER:
			case Zarafa.core.mapi.DisplayType.DT_REMOTE_MAILUSER:
				objectType = Zarafa.core.mapi.ObjectType.MAPI_MAILUSER;
				break;
			case Zarafa.core.mapi.DisplayType.DT_DISTLIST:
			case Zarafa.core.mapi.DisplayType.DT_ORGANIZATION:
			case Zarafa.core.mapi.DisplayType.DT_PRIVATE_DISTLIST:
				objectType = Zarafa.core.mapi.ObjectType.MAPI_DISTLIST;
				break;
		}

		return Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(objectType, {
			entryid: entryid,
			display_type : displayType,
			display_name : this.get('display_name'),
			display_type_ex : this.get('display_type_ex')
		}, entryid);
	},

	/**
	 * Convert this recipient into a {@link Zarafa.core.data.IPMRecord record}.
	 * This can only work if this recipient is {@link #isResolved resolved}.
	 *
	 * @return {Zarafa.core.data.IPMRecord} The addressbook record which
	 * is represented by this recipient.
	 */
	convertToContactRecord : function()
	{
		// Entryids of personal contacts are suffixed with email id (1, 2, 3), so remove that id
		// this is done in php to ensure that we will always have unique entryids
		var entryid = this.get('entryid');
		var uscoreIndex = entryid.indexOf('_');
		if(uscoreIndex > 0) {
			entryid = entryid.substr(0, uscoreIndex);
		}

		// When selected from the Address Book, the Contact will contain the Contact Provider
		// GUID inside the Entryid. To correctly open the Contact, we have to unwrap this entryid
		// to get the normal entryid back.
		if (Zarafa.core.EntryId.hasContactProviderGUID(entryid)) {
			entryid = Zarafa.core.EntryId.unwrapContactProviderEntryId(entryid);
		}

		return Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Contact', {
			entryid : entryid,
			message_class : 'IPM.Contact',
			object_type : Zarafa.core.mapi.ObjectType.MAPI_MESSAGE,
			store_entryid : this.get('store_entryid'),
			parent_entryid : this.get('parent_entryid')
		}, entryid);
	},

	/**
	 * Convert this recipient into a {@link Zarafa.core.data.IPMRecord record}.
	 * This can only work if this recipient is {@link #isResolved resolved}.
	 *
	 * @return {Zarafa.core.data.IPMRecord} The addressbook record which
	 * is represented by this recipient.
	 */
	convertToDistListRecord : function()
	{
		// Entryids of personal contacts are suffixed with email id (1, 2, 3), so remove that id
		// this is done in php to ensure that we will always have unique entryids
		var entryid = this.get('entryid');
		var uscoreIndex = entryid.indexOf('_');
		if(uscoreIndex > 0) {
			entryid = entryid.substr(0, uscoreIndex);
		}

		// When selected from the Address Book, the Distlist will contain the Contact Provider
		// GUID inside the Entryid. To correctly open the Distlist, we have to unwrap this entryid
		// to get the normal entryid back.
		if (Zarafa.core.EntryId.hasContactProviderGUID(entryid)) {
			entryid = Zarafa.core.EntryId.unwrapContactProviderEntryId(entryid);
		}

		return Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.DistList', {
			entryid : entryid,
			message_class : 'IPM.DistList',
			object_type : Zarafa.core.mapi.ObjectType.MAPI_MESSAGE,
			store_entryid : this.get('store_entryid'),
			parent_entryid : this.get('parent_entryid')
		}, entryid);
	},

	/**
	 * Applies the data from an {@link Zarafa.core.data.IPMRecipientResolveRecord IPMRecipientResolveRecord}
	 * to this IPMRecipient.
	 * @param {Zarafa.core.data.IPMRecipientResolveRecord} record The record with resolve data
	 * @param {Boolean} silent True if the record should fire the resolved event on the store. Defaults to true
	 */
	applyResolveRecord: function(record, silent)
	{
		this.beginEdit();

		this.set('entryid', record.get('entryid'));
		this.set('display_name', record.get('display_name'));
		this.set('smtp_address', record.get('smtp_address'));
		this.set('email_address', record.get('email_address'));
		this.set('object_type',  record.get('object_type'));
		this.set('display_type', record.get('display_type'));
		this.set('display_type_ex', record.get('display_type_ex'));
		this.set('address_type', record.get('address_type'));
		this.set('search_key', record.get('search_key'));

		this.endEdit();

		if(!Ext.isDefined(silent) || silent === false) {
			this.store.fireEvent('resolved', this.store, [ this ]);
		}
	},

	/**
	 * Convinience method to get {@link Zarafa.core.mapi.DisplayType} or {@link Zarafa.core.mapi.DisplayTypeEx}
	 * property value from {@link Zarafa.core.data.IPMRecipientRecord}.
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
	 * Format a {@link Zarafa.core.data.IPMRecipientRecord} to a String.
	 * @param {Boolean} useHtmlEncode True if the record should use {@link Ext.util.Format#htmlEncode}
	 * @return {String} The formatted string
	 */
	formatRecipient : function(useHtmlEncode)
	{
		var value = [];
		var name = this.get('display_name');
		var addr = this.get('smtp_address');
		var formatedRecipient;

		if (!Ext.isEmpty(name)) {
			value.push(name);
		}

		if (!Ext.isEmpty(addr) && name != addr) {
			value.push('<' + addr + '>');
		}

		formatedRecipient = value.join(' ');

		if (useHtmlEncode) {
			formatedRecipient = Ext.util.Format.htmlEncode(formatedRecipient);
		}

		return formatedRecipient;
	},

	/**
	 * This will call {@link Zarafa.core.EntryId#createOneOffEntryId} with required parameters
	 * from which oneoff entryid will be generated.
	 */
	generateOneOffEntryId : function()
	{
		var displayName = this.get('display_name');
		var addrType = this.get('address_type');
		var emailAddress = this.get('smtp_address');

		this.set('entryid', Zarafa.core.EntryId.createOneOffEntryId(displayName, addrType, emailAddress));
	},

	/**
	 * End an edit. If any data was modified, the containing store is notified
	 * (ie, the store's <code>update</code> event will fire).
	 * @param {Boolean} clearResolveAttempt (optional) false to prevent the {@link #resolveAttempted}
	 * to be cleared.
	 */
	endEdit : function(clearResolveAttempt)
	{
		this.editing = false;
		if (clearResolveAttempt !== false) {
			this.resolveAttempted = false;
			this.resolveAttemptAmbiguous = false;
		}
		if (this.dirty) {
			this.afterEdit();
		}
	}
});

// Register a custom type to be used by the Record Factory
Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_RECIPIENT');

Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, Zarafa.core.data.IPMRecipientRecord);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, Zarafa.core.data.IPMRecipientRecordFields);
