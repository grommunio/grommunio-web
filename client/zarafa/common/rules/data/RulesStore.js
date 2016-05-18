Ext.namespace('Zarafa.common.rules.data');

/**
 * @class Zarafa.common.rules.data.RulesStore
 * @extends Zarafa.core.data.MAPIStore
 *
 * Delegate store that will be used to load delegates information from server.
 */
Zarafa.common.rules.data.RulesStore = Ext.extend(Zarafa.core.data.MAPIStore, {
	/**
	 * @cfg {String} actionType type of action that should be used to send request to server,
	 * valid action types are defined in {@link Zarafa.core.Actions Actions}, default value is 'list'.
	 */
	actionType : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			// load data whenever instance of store is created
			autoLoad : true,

			batch : true,

			actionType : Zarafa.core.Actions['list'],

			writer : new Zarafa.core.data.JsonWriter({
				writeAllFields : true
			}),
			reader : new Zarafa.common.rules.data.JsonRulesReader(),

			proxy : new Zarafa.common.rules.data.RulesProxy({
				listModuleName : Zarafa.core.ModuleNames.getListName('RULES'),
				itemModuleName : Zarafa.core.ModuleNames.getItemName('RULES')
			})
		});

		Zarafa.common.rules.data.RulesStore.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when a {@link Zarafa.common.rules.data.RulesRecord RulesRecord} has been added
	 * to this {@link Zarafa.common.rules.data.RulesStore RulesStore}. This will generate unique value for rule_sequence
	 * property.
	 *
	 * @param {Zarafa.common.rules.data.RulesStore} store The {@link Zarafa.common.rules.data.RulesStore} to which the store was added.
	 * @param {Zarafa.common.rules.data.RulesRecord[]} records The array of {@link Zarafa.common.rules.data.RulesRecord records} which have been added.
	 * @param {Number} index The index at which the record(s) were added
	 * @private
	 */
	createRecords : function(store, records, index)
	{
		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
			if (record.phantom) {
				// generate sequence for the new record
				var seq = 10;

				store.each(function(rec) {
					var newSeq = rec.get('rule_sequence');

					if (!Ext.isEmpty(newSeq)) {
						seq = Math.max(seq, newSeq);
					}
				}, this);

				record.data.rule_sequence = (seq + 1); 
			}
		}

		Zarafa.common.rules.data.RulesStore.superclass.createRecords.apply(this, arguments);
	},

	/**
	 * Saves all pending changes to the store.  If the commensurate Ext.data.Api.actions action is not configured, then
	 * the configured <code>{@link #url}</code> will be used.
	 * <pre>
	 * change            url
	 * ---------------   --------------------
	 * removed records   Ext.data.Api.actions.destroy
	 * phantom records   Ext.data.Api.actions.create
	 * {@link #getModifiedRecords modified records}  Ext.data.Api.actions.update
	 * </pre>
	 * @TODO:  Create extensions of Error class and send associated Record with thrown exceptions.
	 * e.g.:  Ext.data.DataReader.Error or Ext.data.Error or Ext.data.DataProxy.Error, etc.
	 * @return {Number} batch Returns a number to uniquely identify the "batch" of saves occurring. -1 will be returned
	 * if there are no items to save or the save was cancelled.
	 */
	save : function()
	{
		if (!this.writer) {
			throw new Ext.data.Store.Error('writer-undefined');
		}

		var queue = [],
		    len,
		    trans,
		    batch,
		    data = {},
		    i;

		var rs = this.getModifiedRecords();

		// If there are no modified records in the store, and none where
		// deleted, we don't need to save anything as there are
		// no changes.
		if (rs.length === 0 && this.removed.length === 0) {
			return;
		}

		// We are going to save all rules in a single batch,
		// the server will handle all updates/deletes automatically
		rs = [].concat(this.getRange());
		if (rs.length) {
			for (i = rs.length - 1; i >= 0; i--) {
				if (!rs[i].isValid()) { // <-- while we're here, splice-off any !isValid real records
					rs.splice(i,1);
				}
			}
		}

		// Put all records in the update batch, note that we don't care if this is empty,
		// as that will resolve on the server to a "Delete everything" action.
		queue.push(['create', rs]);

		len = queue.length;
		if (len) {
			batch = ++this.batchCounter;
			for (i = 0; i < len; ++i) {
				trans = queue[i];
				data[trans[0]] = trans[1];
			}
			if (this.fireEvent('beforesave', this, data) !== false) {
				for (i = 0; i < len; ++i) {
					trans = queue[i];
					this.doTransaction(trans[0], trans[1], batch);
				}
				return batch;
			}
		}
		return -1;
	},

	/**
	 * <p>Loads the Record cache from the configured <tt>{@link #proxy}</tt> using the configured <tt>{@link #reader}</tt>.</p>
	 * <br><p>Notes:</p><div class="mdetail-params"><ul>
	 * <li><b><u>Important</u></b>: loading is asynchronous! This call will return before the new data has been
	 * loaded. To perform any post-processing where information from the load call is required, specify
	 * the <tt>callback</tt> function to be called, or use a {@link Ext.util.Observable#listeners a 'load' event handler}.</li>
	 * <li>If using {@link Ext.PagingToolbar remote paging}, the first load call must specify the <tt>start</tt> and <tt>limit</tt>
	 * properties in the <code>options.params</code> property to establish the initial position within the
	 * dataset, and the number of Records to cache on each read from the Proxy.</li>
	 * <li>If using {@link #remoteSort remote sorting}, the configured <code>{@link #sortInfo}</code>
	 * will be automatically included with the posted parameters according to the specified
	 * <code>{@link #paramNames}</code>.</li>
	 * </ul></div>
	 * @param {Object} options An object containing properties which control loading options:<ul>
	 * <li><b><tt>params</tt></b> :Object<div class="sub-desc"><p>An object containing properties to pass as HTTP
	 * parameters to a remote data source. <b>Note</b>: <code>params</code> will override any
	 * <code>{@link #baseParams}</code> of the same name.</p>
	 * <p>Parameters are encoded as standard HTTP parameters using {@link Ext#urlEncode}.</p></div></li>
	 * <li><b>callback</b> : Function<div class="sub-desc"><p>A function to be called after the Records
	 * have been loaded. The callback is called after the load event is fired, and is passed the following arguments:<ul>
	 * <li>r : Ext.data.Record[] An Array of Records loaded.</li>
	 * <li>options : Options object from the load call.</li>
	 * <li>success : Boolean success indicator.</li></ul></p></div></li>
	 * <li><b>scope</b> : Object<div class="sub-desc"><p>Scope with which to call the callback (defaults
	 * to the Store object)</p></div></li>
	 * <li><b>add</b> : Boolean<div class="sub-desc"><p>Indicator to append loaded records rather than
	 * replace the current cache.  <b>Note</b>: see note for <tt>{@link #loadData}</tt></p></div></li>
	 * </ul>
	 * @return {Boolean} If the <i>developer</i> provided <tt>{@link #beforeload}</tt> event handler returns
	 * <tt>false</tt>, the load call will abort and will return <tt>false</tt>; otherwise will return <tt>true</tt>.
	 */
	load : function(options)
	{
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		// By default 'load' must cancel the previous request.
		if (!Ext.isDefined(options.cancelPreviousRequest)) {
			options.cancelPreviousRequest = true;
		}

		Ext.applyIf(options, {
			actionType : this.actionType
		});

		return Zarafa.common.rules.data.RulesStore.superclass.load.call(this, options);
	}
});
