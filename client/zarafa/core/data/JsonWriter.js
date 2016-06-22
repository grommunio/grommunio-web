Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.JsonWriter
 * @extends Ext.data.JsonWriter
 */
Zarafa.core.data.JsonWriter = Ext.extend(Ext.data.JsonWriter, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			writeAllFields : false,
			// FIXME: Disable automatic encoding for now,
			// the MAPIProxy needs an individuall encoded string
			// for each record in the request. We might want to
			// fix this in the future though.
			encode : false
		});

		Zarafa.core.data.JsonWriter.superclass.constructor.call(this, config);
	},

	/**
	 * Render the data in the data object which will be {@link Ext.encode encoded}
	 * and send over the protocol to the server after this function call. During
	 * rendering all {@link Date date} objects will be converted to UNIX timestamps.
	 * This will prevent ExtJs/JSON specific encoding functions to convert the
	 * date object into a "YYYY-MM-DDTHH:MM:SS" timestring.
	 * @param {Object/Array} data The object which musted be rendered
	 * @private
	 */
	renderData : function(data)
	{
		if (Ext.isArray(data)) {
			for (var i = 0, len = data.length; i < len; i++) {
				this.renderData(data[i]);
			}
			return;
		}

		Ext.iterate(data, function(key, value) {
			if (Ext.isDate(value)) {
				data[key] = Math.floor(value.getTime() / 1000);
			}
			if (Ext.isObject(value)) {
				this.renderData(value);
			}
		}, this);
	},

	/**
	 * Final action of a write event.  Apply the written data-object to params.
	 * This function is extended from {@link Ext.data.JsonWriter Extjs}, to use
	 * {@link #renderData} to add some extra data conversions before encoding
	 * the data by {@link Ext.encode Ext.encode}.
	 * @param {Object} http params-object to write-to.
	 * @param {Object} baseParams as defined by {@link Ext.data.Store#baseParams}.
	 * The baseParms must be encoded by the extending class, eg: {@link Ext.data.JsonWriter}, {@link Ext.data.XmlWriter}.
	 * @param {Object/Object[]} data Data-object representing compiled Store-recordset.
	 */
	render : function(params, baseParams, data)
	{
		// Apply the parameters into the data object, this allows
		// optional data to be send to the server.
		Ext.apply(data, baseParams, params);

		// Apply special rendering to convert all objects
		this.renderData(data);
		Zarafa.core.data.JsonWriter.superclass.render.call(this, params, baseParams, data);
	},

	/**
	 * Adds special function for serialization needed when openening
	 * a record. We can use the default {@link Zarafa.core.data.JsonWriter.toIdHash toIdHash}
	 * function.
	 *
	 * @param {Ext.data.Record} record
	 * @return {Object}
	 * @private
	 */
	openRecord : function(record)
	{
		return this.toIdHash(record);
	},

	/**
	 * Rather then using the regular {@link Ext.data.JsonWriter#toHash toHash}
	 * function, this will use the specialized {@link Zarafa.core.data.JsonWriter#toPropHash toPropHash}
	 * function.
	 *
	 * @param {Ext.data.Record} record
	 * @return {Object}
	 * @override
	 * @private
	 */
	createRecord : function(record)
	{
		return this.toPropHash(record);
	},

	/**
	 * Rather then using the regular {@link Ext.data.JsonWriter#toHash toHash}
	 * function, this will use the specialized {@link Zarafa.core.data.JsonWriter#toPropHash toPropHash}
	 * function.
	 *
	 * @param {Ext.data.Record} record
	 * @return {Object}
	 * @override
	 * @private
	 */
	updateRecord : function(record)
	{
		return this.toPropHash(record);
	},

	/**
	 * Use the {@link Zarafa.core.data.JsonWriter#toIdHash toIdHash} function for creating the hash.
	 *
	 * @param {Ext.data.Record} record
	 * @return {Object}
	 * @override
	 * @private
	 */
	destroyRecord : function(record)
	{
		return this.toIdHash(record);
	},

	/**
	 * Similar to {@link Ext.data.JsonWriter#toHash}
	 *
	 * This will limit the serialization to only the ID properties and message
	 * action commands for the given {@link Zarafa.core.data.IPMRecord record}.
	 *
	 * @param {Ext.data.Record} record The record to hash
	 * @param {Boolean} allowEmpty True to allow empty ID elements to be send
	 * @return {Object} The hashed object
	 * @private
	 */
	toIdHash : function(record, allowEmpty)
	{
		var hash = {};

		Ext.each(record.getIdProps(), function(idProp) {
			var id = record.get(idProp);
			if (allowEmpty || Ext.isDefined(id)) {
				hash[idProp] = id;
			}
		}, this);

		this.addMessageActionsHash(hash, record);

		return hash;
	},

	/**
	 * Similar to {@link Ext.data.JsonWriter#toHash}
	 *
	 * Besides serializing the data itself, it will insert
	 * the recipients, attachments and message action commands
	 * into the object data.
	 *
	 * @param {Ext.data.Record} record The record to hash
	 * @return {Object} The hashed object
	 * @private
	 */
	toPropHash : function(record)
	{
		var hash = this.toIdHash(record, false);

		// FIXME: How to pass on deleted properties?
		hash.props = this.toHash.call(this, record);

		// FIXME: remove identification entryids from props,
		// in the future Extjs will support the 'config'
		// argument to toHash which we can use the filter
		// out the ID properties...
		this.removeIdHashFromProps(hash, record);

		// Add additional information from the subStores into the hash
		for (var key in record.subStores) {
			if (record.supportsSubStore(key) === true) {
				var store = record.subStores[key];

				if (store && store.writer) {
					Ext.apply(hash, store.writer.toPropHash(record)); 
				}
			}
		}

		this.addMessageActionsHash(hash, record);

		return hash;
	},

	/**
	 * remove additional identification properties from the props using the
	 * {@link Zarafa.core.data.JsonWriter.idProperties idProperties}
	 * field.
	 *
	 * @param {Object} hash The hash into which the identification fields must be added
	 * @param {Zarafa.core.data.IPMrecord} record The record to serialize from
	 * @private
	 */
	removeIdHashFromProps : function(hash, record)
	{
		Ext.each(record.getIdProps(), function(idProp) { 
			if (Ext.isDefined(hash.props) && Ext.isDefined(hash.props[idProp])) {
				delete hash.props[idProp]; 
			}
		}, this);
	},

	/**
	 * Add message actions into the hash. Message actions are not properties
	 * which come from the server, but are used to add an additional action
	 * instruction for the server to perform. As such the action needs to
	 * be serialized seperately into the hash object.
	 *
	 * @param {Object} hash The hash into which the message actions must be added
	 * @param {Zarafa.core.data.IPMrecord} record The record to serialize from
	 * @private
	 */
	addMessageActionsHash : function(hash, record)
	{
		var actions = record.getMessageActions();
		var message_action = {};

		// No Message actions defined
		if (!Ext.isDefined(actions)) {
			return;
		}

		for (var key in actions) {
			if (Ext.isDefined(actions[key])) {
				message_action[key] = actions[key];
			}
		}

		hash.message_action = message_action;
	}
});
