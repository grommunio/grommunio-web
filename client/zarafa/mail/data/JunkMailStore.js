Ext.namespace('Zarafa.mail.data');

/**
 * @class Zarafa.mail.data.JunkMailStore
 * @extends Ext.util.Observable
 *
 * Singleton around the Outlook Junk Email Rule: safe senders, safe recipients
 * and blocked senders, served by the junkmailmodule from the rule's condition.
 * All mutations are guarded by the loaded state, so a failed or pending load
 * can never overwrite the server-side lists.
 * @singleton
 */
Zarafa.mail.data.JunkMailStore = Ext.extend(Ext.util.Observable, {
	/**
	 * @property {String[]} safeSenders
	 * @private
	 */
	safeSenders: undefined,

	/**
	 * @property {String[]} safeRecipients
	 * @private
	 */
	safeRecipients: undefined,

	/**
	 * @property {String[]} blockedSenders
	 * @private
	 */
	blockedSenders: undefined,

	/**
	 * @property {Number} junkIncludeContacts
	 * @private
	 */
	junkIncludeContacts: 0,

	/**
	 * @property {Boolean} loaded True after a successful load. Saves and
	 * mutations are refused while false.
	 */
	loaded: false,

	/**
	 * @property {Boolean} loading A list request is in flight; further load
	 * calls only queue their callbacks.
	 * @private
	 */
	loading: false,

	/**
	 * @constructor
	 */
	constructor: function()
	{
		Zarafa.mail.data.JunkMailStore.superclass.constructor.call(this);

		this.safeSenders = [];
		this.safeRecipients = [];
		this.blockedSenders = [];
		this.pendingCallbacks = [];

		this.addEvents(
			/**
			 * @event load
			 * Fires when the lists have been loaded from the server.
			 * @param {Zarafa.mail.data.JunkMailStore} store
			 */
			'load',
			/**
			 * @event save
			 * Fires when the lists have been saved to the server.
			 * @param {Zarafa.mail.data.JunkMailStore} store
			 */
			'save',
			/**
			 * @event exception
			 * Fires when a server request failed.
			 * @param {Zarafa.mail.data.JunkMailStore} store
			 */
			'exception'
		);
	},

	/**
	 * Load the lists from the server. Concurrent calls share one request.
	 * @param {Function} callback (optional) called with true/false
	 * @param {Object} scope (optional) scope for the callback
	 */
	load: function(callback, scope)
	{
		if (Ext.isFunction(callback)) {
			this.pendingCallbacks.push({ fn: callback, scope: scope });
		}
		if (this.loading) {
			return;
		}
		this.loading = true;

		container.getRequest().singleRequest(
			'junkmailmodule',
			'list',
			{},
			new Zarafa.core.data.AbstractResponseHandler({
				doList: function(response) {
					var item = response.item && response.item[0];
					var props = item && item.props;
					if (props) {
						this.safeSenders = Ext.isArray(props.safe_senders) ? props.safe_senders : [];
						this.safeRecipients = Ext.isArray(props.safe_recipients) ? props.safe_recipients : [];
						this.blockedSenders = Ext.isArray(props.blocked_senders) ? props.blocked_senders : [];
						this.junkIncludeContacts = props.junk_include_contacts ? 1 : 0;
					}
					this.loading = false;
					this.loaded = true;
					this.fireEvent('load', this);
					this.flushCallbacks(true);
				}.createDelegate(this),
				doError: function() {
					this.loading = false;
					this.fireEvent('exception', this);
					this.flushCallbacks(false);
				}.createDelegate(this)
			})
		);
	},

	/**
	 * @private
	 */
	flushCallbacks: function(success)
	{
		var callbacks = this.pendingCallbacks;
		this.pendingCallbacks = [];
		Ext.each(callbacks, function(cb) {
			cb.fn.call(cb.scope || this, success);
		}, this);
	},

	/**
	 * Save the lists to the server. Refused while not {@link #loaded}: an
	 * unloaded cache would overwrite the stored lists with emptiness.
	 * @param {Function} callback (optional) called with true/false
	 * @param {Object} scope (optional) scope for the callback
	 */
	save: function(callback, scope)
	{
		if (!this.loaded) {
			this.fireEvent('exception', this);
			if (Ext.isFunction(callback)) {
				callback.call(scope || this, false);
			}
			return;
		}

		container.getRequest().singleRequest(
			'junkmailmodule',
			'save',
			{
				props: {
					safe_senders: this.safeSenders,
					safe_recipients: this.safeRecipients,
					blocked_senders: this.blockedSenders,
					junk_include_contacts: this.junkIncludeContacts
				}
			},
			new Zarafa.core.data.AbstractResponseHandler({
				doSuccess: function() {
					this.fireEvent('save', this);
					if (Ext.isFunction(callback)) {
						callback.call(scope || this, true);
					}
				}.createDelegate(this),
				doError: function() {
					this.fireEvent('exception', this);
					container.getNotifier().notify('error.save', _('Sender lists'),
						_('The sender lists could not be saved'));
					if (Ext.isFunction(callback)) {
						callback.call(scope || this, false);
					}
				}.createDelegate(this)
			})
		);
	},

	/**
	 * Reload the lists, apply the mutation on the fresh state, and save. The
	 * reload keeps a long-lived session from clobbering changes another client
	 * made to the same rule in the meantime.
	 * @param {Function} mutator returns true when something changed
	 * @private
	 */
	refreshAndApply: function(mutator)
	{
		this.load(function(success) {
			if (!success) {
				container.getNotifier().notify('error.save', _('Sender lists'),
					_('The sender lists could not be saved'));
				return;
			}
			if (mutator.call(this)) {
				this.save();
			}
		}, this);
	},

	/**
	 * @return {String[]} safe sender entries (copy)
	 */
	getSafeSenders: function()
	{
		return this.safeSenders.slice(0);
	},

	/**
	 * @param {String[]} arr
	 */
	setSafeSenders: function(arr)
	{
		this.safeSenders = this.cleanList(arr);
	},

	/**
	 * @return {String[]} blocked sender entries (copy)
	 */
	getBlockedSenders: function()
	{
		return this.blockedSenders.slice(0);
	},

	/**
	 * @param {String[]} arr
	 */
	setBlockedSenders: function(arr)
	{
		this.blockedSenders = this.cleanList(arr);
	},

	/**
	 * @return {String[]} safe recipient entries (copy)
	 */
	getSafeRecipients: function()
	{
		return this.safeRecipients.slice(0);
	},

	/**
	 * @param {String[]} arr
	 */
	setSafeRecipients: function(arr)
	{
		this.safeRecipients = this.cleanList(arr);
	},

	/**
	 * Add an entry to the safe senders and save, loading first when needed.
	 * @param {String} entry email address or @domain
	 */
	addSafeSender: function(entry)
	{
		this.refreshAndApply(function() {
			return this.addTo(this.safeSenders, entry);
		});
	},

	/**
	 * Add an entry to the blocked senders and save, loading first when needed.
	 * @param {String} entry email address or @domain
	 */
	addBlockedSender: function(entry)
	{
		this.refreshAndApply(function() {
			return this.addTo(this.blockedSenders, entry);
		});
	},

	/**
	 * @param {String} address sender email address
	 * @return {Boolean} True when the address or its domain is a safe sender
	 */
	isSafeSender: function(address)
	{
		return this.inList(this.safeSenders, address);
	},

	/**
	 * @param {String} address sender email address
	 * @return {Boolean} True when the address or its domain is blocked
	 */
	isBlockedSender: function(address)
	{
		return this.inList(this.blockedSenders, address);
	},

	/**
	 * @return {Boolean} whether contacts count as safe senders
	 */
	getIncludeContacts: function()
	{
		return this.junkIncludeContacts !== 0;
	},

	/**
	 * @param {Boolean} value
	 */
	setIncludeContacts: function(value)
	{
		this.junkIncludeContacts = value ? 1 : 0;
	},

	/**
	 * @param {String} entry The entry to validate
	 * @return {Boolean} True for a plausible address or @domain entry
	 */
	isValidEntry: function(entry)
	{
		if (!Ext.isString(entry)) {
			return false;
		}
		entry = entry.trim();

		return entry.length > 2 && entry.length <= 256 &&
			((/^@[^@\s;,]+$/).test(entry) || (/^[^@\s;,]+@[^@\s;,]+$/).test(entry));
	},

	/**
	 * @private
	 */
	cleanList: function(arr)
	{
		if (!Ext.isArray(arr)) {
			return [];
		}
		var seen = {};
		var out = [];
		Ext.each(arr, function(e) {
			if (!Ext.isString(e)) {
				return;
			}
			e = e.trim();
			var lower = e.toLowerCase();
			if (e !== '' && !seen[lower]) {
				seen[lower] = true;
				out.push(e);
			}
		});

		return out;
	},

	/**
	 * @private
	 * @return {Boolean} True when added, false when already present
	 */
	addTo: function(list, entry)
	{
		entry = String(entry).trim();
		if (entry === '') {
			return false;
		}
		var lower = entry.toLowerCase();
		var exists = list.some(function(s) { return s.toLowerCase() === lower; });
		if (!exists) {
			list.push(entry);
		}

		return !exists;
	},

	/**
	 * @private
	 */
	inList: function(list, address)
	{
		if (Ext.isEmpty(address)) {
			return false;
		}
		address = address.toLowerCase();
		var atIndex = address.indexOf('@');
		var domain = atIndex >= 0 ? address.substring(atIndex) : '';

		return list.some(function(s) {
			s = s.toLowerCase();
			return s === address || (domain !== '' && s === domain);
		});
	}
});

Zarafa.mail.data.JunkMailStore = new Zarafa.mail.data.JunkMailStore();
