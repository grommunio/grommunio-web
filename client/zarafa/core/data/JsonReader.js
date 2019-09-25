Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.JsonReader
 * @extends Ext.data.JsonReader
 *
 * This extension of the {@link Ext.data.JsonReader} supports {@link Zarafa.core.data.IPMStore stores}
 * which can hold different type of {@link Zarafa.core.data.IPMRecord records}.
 *
 * If in the constructor no recordType is provided, dynamic {@link Zarafa.core.data.IPMRecord record} type
 * support is assumed. With dynamic types, the incoming response data is used to determine which
 * {@link Zarafa.core.data.MAPIRecord MAPIRecord} must be constructed for each individual root element.
 */
Zarafa.core.data.JsonReader = Ext.extend(Ext.data.JsonReader, {
	/**
	 * In {@link #getEfMapping} we generate a mapping of all Record Fields per ObjectType,
	 * all mappings are stored in a special cache to prevent them from being regenerated
	 * each time.
	 * @property
	 * @type Object
	 * @private
	 */
	efCache : undefined,

	/**
	 * @cfg {Boolean} dynamicRecord Enable dynamic detection of the records
	 * which are read by this JsonReader. When enabled this will prefer using
	 * the {@link Zarafa.core.data.RecordFactory} to detect the recordType rather
	 * then using the {@link #recordType} directly. (defaults to true)
	 */
	dynamicRecord : true,

	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, {@link Zarafa.core.data.JsonReader}
	 * will dynamicly detect the record type based on the response.
	 */
	constructor : function(meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			totalProperty : 'count',
			root : 'item',
			id : 'entryid',
			idProperty : 'entryid'
		});

		// Check if the meta object contained the successProperty.
		// Note that this must be called before the superclass constructor,
		// because the meta object will be altered there.
		var hasSuccessProperty = Ext.isDefined(meta.successProperty);

		// If no recordType is provided, enable the dynamic record handling
		// of the JsonReader.
		if (!Ext.isDefined(recordType)) {
			// FIXME: We shouldn't for IPM as base recordclass here, instead
			// this should be handled as configuration option, or something even smarter.
			recordType = Zarafa.core.data.RecordFactory.getRecordClassByMessageClass('IPM');
		}

		// Check we dynamic records are disabled. 
		if (Ext.isDefined(meta.dynamicRecord)) {
			this.dynamicRecord = meta.dynamicRecord;
		}

		if (this.dynamicRecord !== false) {
			this.efCache = {};
		}

		Zarafa.core.data.JsonReader.superclass.constructor.call(this, meta, recordType);

		// This fixes a bug in the Ext.data.JsonReader. Even when no successProperty
		// is given, the getSuccess function will still be implemented after which
		// the function will often fail due to the lack of the success property within
		// the response data.
		if (!hasSuccessProperty) {
			this.getSuccess = function(o) { return true; };
		}
	},

	/**
	 * Build the extractors which are used when reading the Json data. This initialized
	 * functions like {@link #getTotal}, {@link #getSuccess}, {@link #getId}.
	 * @private
	 */
	buildExtractors : function()
	{
		var s = this.meta;

		Zarafa.core.data.JsonReader.superclass.buildExtractors.call(this);

		// Wrap the original getId function to check if the data is the raw
		// data which has wrapped the 'props' field, or if this is the unwrapped
		// data.
		if (s.id || s.idProperty) {
			var old = this.getId;
			this.getId = function(rec) {
				if (rec.props) {
					var id = old(rec.props);
					if (!Ext.isEmpty(id)) {
						return id;
					}
				}

				return old(rec);
			};
		}
	},

	/**
	 * Obtain the mapping between response objects and {@link Zarafa.core.data.IPMRecord record} fields for
	 * the given recordType. If no mapping yet exist for this recordType one will be constructed
	 * and added to the {@link Zarafa.core.data.IPMRecord.efCache cache}.
	 *
	 * @param {String} key The unique key for this record type (used for caching purposes).
	 * @param {Array} items The array of {@link Zarafa.core.data.IPMRecord record} items.
	 * @param {Number} len The length of the items array. 
	 * @return {Array} The name/value list of response to {@link Zarafa.core.data.IPMRecord record} fields.
	 * @private
	 */
	getEfMapping : function(key, items, len)
	{
		if (Ext.isString(key)) {
			key = key.toUpperCase();
		}

		var ef = this.efCache[key];

		if (!Ext.isDefined(ef))
		{
			ef = [];
        	for(var i = 0; i < len; i++){
				var f = items[i];
				var map = (!Ext.isEmpty(f.mapping)) ? f.mapping : f.name;
				ef.push(this.createAccessor.call(this, map));
			}
			this.efCache[key] = ef;
		}

		return ef;
	},

	/**
	 * Type-casts a single row of raw-data from server
	 * @param {Object} data The data object which must be deserialized.
	 * @param {Array} items The {@link Ext.data.Field Field} used for deserialization.
	 * @param {Integer} len The length of the items array.
	 * @private
	 */
	extractValues : function(data, items, len)
	{
		var values = {};
	
		// If the data object is wrapped (it contains objects like 'props', 'attachments',
		// 'recipients', etc... Then we must call extractValues for each individual subobject.
		if (Ext.isDefined(data.props)) {
			values = Ext.apply({}, data);
			values.props = this.extractValues(data.props, items, len);
			return values;
		}

		if (this.dynamicRecord === true)
		{
			var recordType = Zarafa.core.data.RecordFactory.getRecordClassByRecordData(data);
			if (!Ext.isDefined(recordType)) {
				recordType = this.recordType;
			}

			items = recordType.prototype.fields.items;
			len = recordType.prototype.fields.length;

			// Normally the caller has initialized this.ef for us, but only at this time
			// do we know the real recordType. As such we have to override the previous
			// this.ef mapping.
			this.ef = this.getEfMapping(data.message_class || data.object_type, items, len);
		}

		// Extract the values per object which we want to deserialize.
		for (var j = 0; j < len; j++) {
			var f = items[j];
			var v = this.ef[j](data);
			if (Ext.isDefined(v)) {
				values[f.name] = f.convert(v, data);
			}
		}

		return values;
	},

	/**
	 * Returns extracted, type-cast rows of data.  Iterates to call #extractValues for each row
	 *
	 * This function is exactly copied from {@link Ext.data.DataReader.extractData} with the only
	 * difference is using the RecordFactory for record allocation.
	 *
	 * @param {Object|Array} data-root from server response
	 * @param {Boolean} returnRecords [false] Set true to return instances of {@link Zarafa.core.data.MAPIRecord MAPIRecord}.
	 * @private
	 */
	extractData : function(root, returnRecords)
	{
		// A bit ugly this, too bad the Record's raw data couldn't be saved in a common property named "raw" or something.
		var rawName = (this instanceof Ext.data.JsonReader) ? 'json' : 'node';

		var rs = [];

		// Had to add Check for XmlReader, #isData returns true if root is an Xml-object.  Want to check in order to re-factor
		// #extractData into DataReader base, since the implementations are almost identical for JsonReader, XmlReader
		if (this.isData(root) && !(this instanceof Ext.data.XmlReader)) {
			root = [root];
		}
		if (returnRecords === true) {
			for (var i = 0; i < root.length; i++) {
				var n = root[i];

				var record = undefined;
				var id = this.getId(n);
				var data = n.props || n;

				// Clear all data from the object which must be deserialized,
				// we only want the 'object_type' and 'message_class' properties.
				data = { message_class : data.message_class, object_type : data.object_type };

				if (this.dynamicRecord === true) {
					record = Zarafa.core.data.RecordFactory.createRecordObjectByRecordData(data, id);
				}

				if (!record) {
					record = new this.recordType({}, id);
				}

				// move primitive properties and identification properties at same level
				this.moveIdProperties(n, record.baseIdProperties);

				var f		= record.fields,
					fi		= f.items,
					fl		= f.length;
				this.update(record, this.extractValues(n, fi, fl));
				record[rawName] = n;    // <-- There's implementation of ugly bit, setting the raw record-data.
				rs.push(record);
			}
		} else {
			for (var i = 0; i < root.length; i++) {
				var n = root[i];

				var Record = undefined;
				if (this.dynamicRecord === true) {
					Record = Zarafa.core.data.RecordFactory.getRecordClassByRecordData(n.props || n);
				}
				
				// Fall back to specified record type if we can't get the type from the data
				if (!Record) {
					Record = this.recordType;
				}

				// move primitive properties and identification properties at same level
				this.moveIdProperties(n, Record.prototype.baseIdProperties);

				var f		= Record.prototype.fields,
					fi		= f.items,
					fl		= f.length;

				// here we can't do anything about complex structures so its ignored here
				var data = this.extractValues(n, fi, fl);
				data[this.meta.idProperty] = this.getId(n.props || n);
				rs.push(data);
			}
		}
		return rs;
	},

	/**
	 * Function will merge all identification properties and primitive properties
	 * to the props field and return the merged data. so {@link Zarafa.core.JsonReader JsonReader}
	 * can read the data and extract the properties.
	 * @param {Object} data data that is passed to {@link #extractData} to extract properties.
	 * @param {String|Array} idProperties The id properties which should be moved into the properties object.
	 * @return {Object} The updated data object.
	 */
	moveIdProperties : function(data, idProperties)
	{
		// If there is not data then return no data
		if (!data) {
			return data;
		}

		if (!data.props) {
			data.props = {};
		}

		// move the base identification property to <props> tag level
		var idProperty = this.meta.idProperty;
		if (idProperty) {
			var value = data[idProperty];
			if (Ext.isDefined(value)) {
				data.props[idProperty] = value;
				delete data[idProperty];
			}
		}

		// move all extra identification properties to <props> tag level
		if (Ext.isString(idProperties)) {
			var value = data[idProperties];
			if (Ext.isDefined(value)) {
				data.props[idProperties] = value;
				delete data[idProperties];
			}
		} else if (idProperties) {
			for (var i = 0, len = idProperties.length; i < len; i++) {
				var idProp = idProperties[i];
				var value = data[idProp];

				if(Ext.isDefined(value)) {
					data.props[idProp] = value;
					delete data[idProp];
				}
			}
		}

		return data;
	},

	/**
	 * Used for un-phantoming a record after a successful database insert.
	 * Sets the records pk along with new data from server.
	 * You must return at least the database pk using the idProperty defined in
	 * your DataReader configuration. The incoming data from server will be merged
	 * with the data in the local record. In addition, you must return record-data
	 * from the server in the same order received. Will perform a commit as well,
	 * un-marking dirty-fields. Store's "update" event will be suppressed.
	 *
	 * @param {Record/Record[]} record The phantom record to be realized.
	 * @param {Object/Object[]} data The new record data to apply. Must include the primary-key from database defined in idProperty field.
	 * @private
	 */
	realize : function(record, data)
	{
		// This function is copy & pasted from Ext.js Ext.data.JsonReader#realize.
		// Our only difference is the assignment of the record.data field.
		if (Array.isArray(record)) {
			for (var i = record.length - 1; i >= 0; i--) {
				// recurse
				if (Array.isArray(data)) {
					this.realize(record.splice(i,1).shift(), data.splice(i,1).shift());
				} else {
					// weird...record is an array but data isn't??  recurse but just send in the whole invalid data object.
					// the else clause below will detect !this.isData and throw exception.
					this.realize(record.splice(i,1).shift(), data);
				}
			}
		} else {
			// If records is NOT an array but data IS, see if data contains just 1 record.  If so extract it and carry on.
			if (Array.isArray(data)) {
				data = data.shift();
			}
			if (!this.isData(data)) {
				// TODO: Let exception-handler choose to commit or not rather than blindly records.commit() here.
				// record.commit();
				throw new Ext.data.DataReader.Error('realize', record);
			}
			record.phantom = false; // <-- That's what it's all about
			record._phid = record.id;  // <-- copy phantom-id -> _phid, so we can remap in Store#onCreateRecords
			record.id = this.getId(data);

			// And now the infamous line for which we copied this entire function.
			// Extjs expects that we transfer _all_ properties back from the server to the client after
			// a new item was created. Since this has a negative impact on the performance.
			//
			// This has been solved to let the server-side only return the properties which have
			// changed, or are new (like the entryid). We can then simply use Ext.apply to apply
			// the updated data over the already available data.
			//
			// But for those who have paid attention in the data flow of Extjs, know that this
			// sounds quite a lot like the function description of Ext.data.JsonReader#update.
			// 
			// So to make everything even simpler, we don'e update the record.data object here,
			// but instead we simply continue to the Ext.data.JsonReader#update function to
			// handle the rest of the work. 
			//
			//record.data = data;

			// Since we postpone the record.data update, there is no need to commit,
			// this too is done in update().
			//record.commit();

			// Time for the real work...
			this.update(record, data);

			// During realize the record might have received a new
			// id value. We have to reMap the store to update the keys.
			if (record.store) {
				record.store.reMap(record);
			}
		}
	},

	/**
	 * Used for updating a non-phantom or "real" record's data with fresh data from
	 * server after remote-save. If returning data from multiple-records after a batch-update,
	 * you must return record-data from the server in the same order received.
	 * Will perform a commit as well, un-marking dirty-fields. Store's "update" event
	 * will be suppressed as the record receives fresh new data-hash
	 *
	 * @param {Record/Record[]} record 
	 * @param {Object/Object[]} data
	 * @private
	 */
	update : function(record, data)
	{
		// Recursively call into update to update each record individually.
		if (Array.isArray(record)) {
			for (var i = 0; i < record.length; i++) {
				if(Array.isArray(data)) {
					this.update(record[i], data[i]);
				} else {
					this.update(record[i], data);
				}
			}
			return;
		}

		// It can happen that the data is wrapped in a array of length 1.
		if (Array.isArray(data)) {
			data = data.shift();
		}

		if (this.isData(data)) {
			// move primitive properties and identification properties at same level
			data = this.moveIdProperties(data, record.baseIdProperties);

			// All preprocessing has been done. All remaining data
			// can be applied into the IPMRecord directly.
			record.data = Ext.apply(record.data, data.props || data);

			// scalar values from props are applied so remove it from data object
			delete data.props;

			// Put the action response from the server in the record
			if(data.action_response){
				record.action_response = data.action_response;
				delete data.action_response;
			}

			// If the record contains substores to store complex data then we have to first 
			// serialize those data into its consecutive stores and then we can continue
			// with normal processing
			Ext.iterate(data, function(key, value) {
				if (Array.isArray(value) || Ext.isObject(value)) {
					var store;

					if (record.supportsSubStore(key)) {
						store = record.getSubStore(key);
						if (!store) {
							store = record.createSubStore(key);
						} else {
							store.removeAll(true);
						}

						// Load data into the SubStore, and remove
						// it from the data object.
						if (!Ext.isEmpty(value)) {
							store.loadData(value);
							delete data[key];
						}
					}
				}
			}, this);

			// Discard any additional data which was set on the data object,
			// this data has probably been set by plugins, but they have sufficient
			// alternatives to fit their custom data into the IPMRecord structure.
		}

		record.commit();
	}
});
