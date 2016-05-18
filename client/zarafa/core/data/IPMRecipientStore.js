/*
 * We depend on IPMRecipientRecord rather the RecordCustomObjectType
 * as ZARAFA_RECIPIENT is defined in IPMRecipientRecord.
 * #dependsFile client/zarafa/core/data/IPMRecipientRecord.js
 */
Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMRecipientStore
 * @extends Zarafa.core.data.MAPISubStore
 */
Zarafa.core.data.IPMRecipientStore = Ext.extend(Zarafa.core.data.MAPISubStore, {
	/**
	 * The proxy that handles the resolving requests.
	 * @property
	 * @type Zarafa.core.data.IPMRecipientResolveProxy
	 */
	resolveProxy: undefined,

	/**
	 * The {@link Ext.data.DataReader} used for handling resolving responses
	 * @property
	 * @type Ext.data.DataReader
	 */
	resolveReader: undefined,

	/**
	 * @cfg {Boolean} autoResolve True to enable automatic {@link #resolve resolving} of
	 * recipients when they are added into the store. Defaults to true.
	 */
	autoResolve : true,

	/**
	 * @cfg {Zarafa.core.data.RecordCustomObjectType} customObjectType The custom object type
	 * which represents the {@link Ext.data.Record records} which should be created using
	 * {@link Zarafa.core.data.RecordFactory#createRecordObjectByCustomType}.
	 */
	customObjectType : Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT,

	/**
	 * @cfg {Boolean} allowResolvingToLocalContacts True to allow recipients to resolve to local 
	 * contacts as well. If set to false it can only be resolved to GAB users. This information is 
	 * send to the server with every resolve request done from this store. Defaults to true.
	 */
	allowResolvingToLocalContacts: true,

	/**
	 * @cfg {Boolean} allowResolvingToGABGroups True to allow recipients to resolve to GAB groups 
	 * as well. If set to false it can cannot resolve to groups like "Everyone". This information is 
	 * send to the server with every resolve request done from this store. Defaults to true.
	 */
	allowResolvingToGABGroups: true,

	/**
	 * The proxy that handles the expand requests.
	 * @property
	 * @type Zarafa.core.data.IPMRecipientResolveProxy
	 */
	expandProxy: undefined,

	/**
	 * The {@link Zarafa.core.data.JsonReader} used for handling expand responses
	 * @property
	 * @type Ext.data.DataReader
	 */
	expandReader: undefined,

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// provide a default writer
			writer : new Zarafa.core.data.JsonRecipientWriter(),
			// provide a default reader
			reader : new Zarafa.core.data.JsonRecipientReader({
				customObjectType : config.customObjectType || this.customObjectType
			})
		});

		this.addEvents(
			/**
			 * @event beforeresolve
			 * Fires when a resolve request has been sent to the server.
			 * @param {Zarafa.core.data.IPMRecipientStore} store The store which fired the event
			 * @param {Zarafa.core.data.IPMRecipientRecord[]} records The records that have been send for resolving
			 */
			'beforeresolve',
			/**
			 * @event resolved
			 * Fires when the server has returned a request for resolving records.
			 * @param {Zarafa.core.data.IPMRecipientStore} store The store which fired the event
			 * @param {Zarafa.core.data.IPMRecipientRecord[]} records The records that have been send for resolving
			 */
			'resolved',
			/**
			 * @event exception
			 * Fires if an exception occurs in the Proxy during a remote request.
			 * This event is relayed through the corresponding {@link Ext.data.DataProxy}.
			 * See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
			 * for additional details.
			 * @param {misc} misc See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
			 * for description.
			 */
			'exception'
		);

		Zarafa.core.data.IPMRecipientStore.superclass.constructor.call(this, config);

		this.resolveProxy = new Zarafa.core.data.IPMRecipientResolveProxy();
		this.expandProxy = new Zarafa.core.data.IPMExpandDistlistProxy();

		this.relayEvents(this.resolveProxy,  ['exception']);

		this.resolveReader = new Ext.data.JsonReader({
			root: 'result'
		}, Zarafa.core.data.IPMRecipientResolveRecord);

		this.expandReader = new Zarafa.core.data.JsonReader({
			root: 'result',
			id : 'entryid',
			dynamicRecord : false
		}, Zarafa.core.data.IPMExpandDistlistRecord);

		this.on({
			'add' : this.onRecipientAdd,
			'update' : this.onRecipientUpdate,
			'exception' : this.onResolveException,
			scope: this
		});
		
		// Register the store with the PresenceManager to have presence statuses added
		Zarafa.core.PresenceManager.registerStore(this);
	},

	/**
	 * Parse a String into a {@link Zarafa.core.data.IPMRecipientRecord}.
	 *
	 * @param {String} str The string to parse
	 * @param {Zarafa.core.mapi.RecipientType} type The recipientType which must be applied to the recipient
	 * @return {Zarafa.core.data.IPMRecipientRecord} The created recipient
	 */
	parseRecipient : function(str, type)
	{
		var recipient = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(this.customObjectType);
		var mailStart = str.indexOf('<');
		var mailEnd = str.indexOf('>');

		if ((mailStart != -1 && mailEnd == -1) ||
			(mailStart == -1 && mailEnd != -1))
				return null;

		recipient.beginEdit();
		if (mailStart != -1) {
			recipient.set('display_name', str.substring(0, mailStart).trim());
			recipient.set('smtp_address', str.substring(mailStart + 1, mailEnd).trim());
		} else {
			recipient.set('display_name', str);

			/* The string may be just a user@domain.com, if so then we can already fill in the SMTP address */
			if (!Zarafa.core.Util.validateEmailAddress(str)) {
				recipient.set('smtp_address', '');
			} else {
				recipient.set('smtp_address', str);
				recipient.set('object_type',Zarafa.core.mapi.ObjectType.MAPI_MAILUSER);
			}
		}

		recipient.set('recipient_type', type || Zarafa.core.mapi.RecipientType.MAPI_TO);
		recipient.endEdit();
		return recipient;
	},

	/**
	 * Obtain the list of currently {@link Zarafa.core.data.IPMRecipientRecord#isResolved resolved}
	 * {@link Zarafa.core.data.IPMRecipientRecord recipients}.
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} records (optional) The list of records which
	 * must be filtered. If not provided, {@link #getRange} is assumed.
	 * @return {Zarafa.core.data.IPMRecipientRecord[]} The list of resolved recipients
	 */
	getResolvedRecipients : function(records)
	{
		var resolved = [];

		records = records || this.data.items;

		for (var i = 0, len = records.length; i < len; i++) {
			var recipient = records[i];
			if (recipient.isResolved()) {
				resolved.push(recipient);
			}
		}

		return resolved;
	},

	/**
	 * Obtain the list of currently {@link Zarafa.core.data.IPMRecipientRecord#isResolved non-resolved}
	 * {@link Zarafa.core.data.IPMRecipientRecord recipients}. We also filter the list with recipients
	 * which have not yet been {@link Zarafa.core.data.IPMRecipientRecord#attemptedToResolve attempted}
	 * to resolve to prevent too much traffic to the server.
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} records (optional) The list of records which
	 * must be filtered. If not provided, {@link #getRange} is assumed.
	 * @return {Zarafa.core.data.IPMRecipientRecord[]} The list of non-resolved recipients
	 */
	getUnresolvedRecipients : function(records)
	{
		var unresolved = [];

		records = records || this.data.items;

		for (var i = 0, len = records.length; i < len; i++) {
			var recipient = records[i];
			if (!recipient.isResolved() && (!recipient.attemptedToResolve() || recipient.isAmbiguous())) {
				unresolved.push(recipient);
			}
		}

		return unresolved;
	},
	
	/**
	 * Obtain the list of currently {@link Zarafa.core.data.IPMRecipientRecord which are invalid}
	 * {@link Zarafa.core.data.IPMRecipientRecord recipients}.reciepitns which do not have valid
	 * SMTP address neither have a entryid and have been attempted to be resolved
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} records (optional) The list of records which
	 * must be filtered. If not provided, {@link #getRange} is assumed.
	 * @return {Zarafa.core.data.IPMRecipientRecord[]} The list of invalid recipients
	 */
	getInvalidRecipients : function(records)
	{
		var invalid = [];

		records = records || this.data.items;

		for (var i = 0, len = records.length; i < len; i++) {
			var recipient = records[i];
			if (!recipient.isResolved() && recipient.attemptedToResolve() && !recipient.isValidSMTP()) {
				invalid.push(recipient);
			}
		}

		return invalid;
	},

	/**
	 * Resolve the given {@link Zarafa.core.data.IPMRecipientRecord IPMRecipientRecord IPMRecipientRecords}
	 * @param {Zarafa.core.data.IPMRecipientRecord/Array} records (optional) The record or records to resolve,
	 * if nothing is provided, all {@link #getUnresolvedRecipients unresolved} recipients will be resolved.
	 * @param {Object} options (optional) Additional options
	 */
	resolve : function(records, options)
	{
		if (Ext.isDefined(records) && !Ext.isArray(records)) {
			records = [ records ];
		}

		records = this.getUnresolvedRecipients(records);
		if (records.length === 0) {
			return;
		}

		var pendingRecords = [];
		var resolveRequests = [];
		// Get the records from the passed recipients that need resolving
		for (var i = 0; i < records.length; i++) {
			var recipientRecord = records[i];

			var displayName = recipientRecord.get('display_name').trim();
			var smtpAddress = recipientRecord.get('smtp_address').trim();
			var addressType = recipientRecord.get('address_type');

			/*
			 * Sometimes emailaddress in not there in the property so it will return undefined
			 * So doing trim() on undefined will return error, This is happening with mails
			 * migrated from lotus notes, and this might happen, if we migrate for other applications
			 */
			var emailAddress = recipientRecord.get('email_address');
			if (!Ext.isEmpty(emailAddress)) {
				emailAddress = emailAddress.trim();
			}

			// Prefer sending the email_address property,
			// if not set send smtp address but only if it is a valid address.
			if (Ext.isEmpty(emailAddress)) {
				if (Zarafa.core.Util.validateEmailAddress(smtpAddress)) {
					emailAddress = smtpAddress;
				} else {
					emailAddress = '';
				}
			}

			resolveRequests.push({
				id: recipientRecord.id,
				display_name : displayName,
				email_address : emailAddress,
				address_type : addressType
			});

			pendingRecords.push(recipientRecord);
		}

		// Setup the parameters that will make up the resolve request to the server
		var parameters = { 
			resolverequests: resolveRequests, 
			exclude_local_contacts: !this.allowResolvingToLocalContacts, 
			exclude_gab_groups: !this.allowResolvingToGABGroups 
		};

		// The arguments that can be used in the callback function
		var args = Ext.apply({}, options, {
			actionType: Zarafa.core.Actions['checknames'],
			listRequest : true,
			pendingRecords: pendingRecords,
			params: parameters
		});

		this.fireEvent('beforeresolve', this, pendingRecords);

		this.resolveProxy.request(Zarafa.core.Actions['checknames'], records, parameters, this.resolveReader, this.onCheckNamesResult, this, args);
	},

	/**
	 * Callback function from the {@link Zarafa.core.data.IPMRecipientResolveResponseHandler CheckNamesResponseHandler},
	 * which will be called when the response has been read. Each returned resolve response will be 
	 * handled separately. If for a resolve request one result is returned the data is applied to 
	 * the recipient directly. If multiple results are returned a dialog is opened where the user can 
	 * select the correct one.
	 * {@link Zarafa.common.Actions.openCheckNamesContent openCheckNamesContent} will be called to 
	 * open a content panel to let the user choose to what entry the recipient should be resolved. If there
	 * are no results returned the user is notified of that fact.
	 * @param {Ext.data.Record/Array} records The record or records which have been received from the server.
	 * @param {Object} options The options object used for the request
	 * @param {Boolean} success True if the request was successfull.
	 * @private
	 */
	onCheckNamesResult: function(records, options, success)
	{
		if (!Ext.isArray(records)) {
			records = [records];
		}

		for (var i = 0; i < records.length; i++) {
			var resolveResult = records[i];
			// Check if we have the ID of the IPMRecipientRecord
			if (!Ext.isEmpty(resolveResult.id)) {
				// Get the RecipientRecord using the recordID
				var recipientRecord = this.getById(resolveResult.id);

				// When the recipientRecord can not be found, skip this one
				if (!recipientRecord) {
					break;
				}

				// When only one match is found we can apply it directly
				if (resolveResult.result.totalRecords == 1) {
					var checknamesRecord = resolveResult.result.records[0];
					// Apply resolving data
					recipientRecord.applyResolveRecord(checknamesRecord, true);

				// Display the checknames dialog to let the user choose what of the multiple matches he wants
				} else if (resolveResult.result.totalRecords > 1) {
					recipientRecord.resolveAttemptAmbiguous = true;
					Zarafa.common.Actions.openCheckNamesContent(resolveResult.result.records, recipientRecord);
				}

				// Set the resolveAttempted property 
				recipientRecord.resolveAttempted = true;
			}
		}

		this.fireEvent('resolved', this, options.pendingRecords);
	},

	/**
	 * Expand the given {@link Zarafa.core.data.IPMRecipientRecord IPMRecipientRecord}
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The record to expand.
	 * @param {Boolean} recurse True if we want expand a distribution list in a distribution list.
	 * @param {Object} options (optional) Additional options
	 */
	expand : function(record, recurse, options)
	{
		// Setup the parameters that will make up the expand request to the server
		var parameters = { 
			entryid: record.get('entryid'),
			recurse: recurse || false
		};

		// The arguments that can be used in the callback function
		var args = Ext.apply({}, options, {
			actionType: Zarafa.core.Actions['expand'],
			listRequest : true,
			recipientType : record.get('recipient_type'),
			params: parameters
		});

		this.expandProxy.request(Zarafa.core.Actions['expand'], record, parameters, this.expandReader, this.onExpandResult, this, args);
	},

	/**
	 * Callback function from the {@link Zarafa.core.data.IPMExpandDistlistResponseHandler ExpandDistlistResponseHandler},
	 * which will be called when the response has been read. Each returned expand response will be 
	 * handled separately. Resulted member record(s) are converted to the recipient record and added to the recipient store.
	 * @param {Ext.data.Record/Array} records The record or records which have been received from the server.
	 * @param {Object} options The options object used for the request
	 * @param {Boolean} success True if the request was successfull.
	 * @private
	 */
	onExpandResult: function(records, options, success)
	{
		if (success) {
			if (!Ext.isArray(records)) {
				records = [records];
			}

			var recipients = [];

			for (var i = 0; i < records.length; i++) {
				var memberRecord = records[i];

				if (!Ext.isEmpty(memberRecord)) {
					recipients.push(memberRecord.convertToRecipient(options.recipientType));
				}
			}

			// Add all the member records into the recipient store
			this.add(recipients);
		}
	},

	/**
	 * Event handler which is fired when a recipient is added to this store, when {@link #autoResolve}
	 * is enabled and the records are dirty, the records will directly be resolved.
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store which fired the event
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} records The records which were added
	 * @private
	 */
	onRecipientAdd : function(store, records)
	{
		if (this.autoResolve) {
            Ext.each(records,function(record){
                    if(record.dirty){
                        this.resolve(records);
                        return false;
                    }
            },this);
        }
	},

	/**
	 * Event handler which is fired when a recipient is updated inside this store, when {@link #autoResolve}
	 * is enabled, the records will be re-resolved. 
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store which fired the event
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} records The records which were updated
	 * @private
	 */
	onRecipientUpdate : function(store, records)
	{
		if (this.autoResolve) {
			this.resolve(records);
		}
	},

	/**
	 * Called when an error occurred on the server-side.
	 * @param {Zarafa.core.data.IPMRecipientResolveProxy} proxy The proxy which fired the event.
	 * @param {String} type The value of this parameter will be either 'response' or 'remote'. 
	 * @param {String} action Name of the action (see {@link Ext.data.Api#actions}).
	 * @param {Object} options The object containing the object which was send to the PHP-side.
	 * @param {Object} response The response object as received from the PHP-side
	 */
	onResolveException: function(proxy, type, action, options, response)
	{
		this.fireEvent('resolved', this, options.pendingRecords);
	}
});
