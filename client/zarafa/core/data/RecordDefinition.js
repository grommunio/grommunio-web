Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.RecordDefinition
 * @extends Ext.util.Observable
 * The definition for a {@link Ext.data.Record record}
 * for a particular message class. Each message class can have its
 * own set of fields and default values. Within this class, the
 * specific values are kept. By default all fields and default values
 * are inherited from the parent definition. So each definition only
 * contains the data which is new for this particular message class.
 *
 * NOTE: This class should never be used outside of the
 * {@link Zarafa.core.data.RecordFactory RecordFactory}.
 */
Zarafa.core.data.RecordDefinition = Ext.extend(Ext.util.Observable, {
	/**
	 * @cfg {Zarafa.core.data.RecordDefinition} parent The parent record definition for this definition.
	 */
	parent : undefined,

	/**
	 * The object class definition for the record.
	 * This type is always a subclass of the {@link Zarafa.core.data.RecordDefinition.base base},
	 * field within this {@link Zarafa.core.data.RecordDefinition definition}.
	 * @property
	 * @type Class
	 * @private
	 */
	type: undefined,

	/**
	 * The configuration object in where all options for the Record instances are configured.
	 *
	 * This is editable as long as no record has been created using this definition yet, after
	 * that this property can no longer be used.
	 * @property
	 * @type Object
	 * @private
	 */
	cfg : undefined,

	/**
	 * @cfg {Object} base The object class definition which must be used as base for the record.
	 * In most cases this base must be extended from {@link Ext.data.Record record}.
	 *
	 * This is applied on the {@link #cfg} object and can be changed as long as no record has been
	 * created using this definition yet, after that this property can no longer be used.
	 */
	base: undefined,

	/**
	 * @cfg {Object} subStores The key-value array where for each subStore type is provided with the type
	 * of the {@link Zarafa.core.data.SubStore SubStore} which must be used for the given subStore.
	 *
	 * This is applied on the {@link #cfg} object and can be changed as long as no record has been
	 * created using this definition yet, after that this property can no longer be used.
	 */
	subStores : undefined,

	/**
	 * @cfg {Ext.data.Field[]} fields The array of fields which belong to this {@link Ext.data.Record record}.
	 * This is mapped on the server to MAPI properties which are stored in the zarafa-server.
	 *
	 * This is applied on the {@link #cfg} object and can be changed as long as no record has been
	 * created using this definition yet, after that this property can no longer be used.
	 */
	fields: undefined,

	/**
	 * @cfg {Object} defaults The key-value array where the default values for particular fields is provided.
	 * When a new {@link Ext.data.Record record} is created (one that does
	 * not yet exist on the server) all default values will be applied to the new
	 * {@link Ext.data.Record record}.
	 *
	 * This is applied on the {@link #cfg} object and can be changed as long as no record has been
	 * created using this definition yet, after that this property can no longer be used.
	 */
	defaults: undefined,

	/**
	 * @cfg {Object} createDefaults The key-value array for default values that should be applied
	 * when a record is created (either a phantom or non-phantom).
	 *
	 * This is applied on the {@link #cfg} object and can be changed as long as no record has been
	 * created using this definition yet, after that this property can no longer be used.
	 */
	createDefaults : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		this.addEvents([
			/**
			 * @event createphantom
			 * Fires when the {@link Zarafa.core.data.RecordFactory RecordFactory} has
			 * created a new phantom record.
			 * @param {Ext.data.Record} record The created phantom record
			 * @param {Object} data The data used to initialize the record
			 */
			'createphantom',
			/**
			 * @event createrecord
			 * Fires when the {@link Zarafa.core.data.RecordFactory RecordFactory} has
			 * created a new record.
			 * @param {Ext.data.Record} record The created record
			 * @param {Object} data The data used to initialize the record
			 */
			'createrecord'
		]);

		// Only the parent is applied on the current
		// class. the rest can be applied to the cfg object.
		this.parent = config.parent;
		delete config.parent;

		this.cfg = Ext.apply({}, config);

		Zarafa.core.data.RecordDefinition.superclass.constructor.call(this, config);
	},

	/**
	 * Create a new {@link Ext.data.Record record} object
	 * based on this {@link Zarafa.core.data.RecordDefinition definition}.
	 *
	 * The data object used to instantiate the new Record will be created using the
	 * default values from {@link Ext.data.Field field} definitions as obtained by
	 * {@link #getFieldDefaultValues}, the default values configured through
	 * the {@link Zarafa.core.data.RecordFactory Record Factory} which are obtained
	 * by the {@link #getDefaultValues} function. And finally the data passed as
	 * argument will be applied. This ordering implies that the {@link Ext.data.Field field}
	 * default values are most likely to be overridden by the other values.
	 *
	 * @param {Object} data (Optional) An object, the properties of which provide
	 * values for the new Record's fields. If not specified the {@link Ext.data.Field.defaultValue}
	 * for each field will be assigned.
	 * @param {Object} id (Optional) The id of the Record. The id is used by the
	 * {@link Ext.data.Store Store} object which owns the {@link Ext.data.Record}
	 * to index its collection of Records (therefore this id should be unique within
	 * each store). If an id is not specified a phantom Record will be created with an
	 * automatically generated id.
	 * @return {Ext.data.Record} the new record which was created
	 */
	createRecord : function(data, id)
	{
		var RecordClass = this.getType();
		var applyData = {};
		Ext.apply(applyData, this.getFieldDefaultValues());
		if (!Ext.isDefined(id)) {
			Ext.apply(applyData, this.getDefaultValues());
		}
		if (data) {
			Ext.apply(applyData, data);
		}

		// Apply the createDefaults object to initialize the record with.
		var record = new RecordClass(applyData, id, this);

		if (record.phantom) {
			this.fireEvent('createphantom', record, data);
		} else {
			// field default values will be applied by the jsonreader
			this.fireEvent('createrecord', record, data);
		}

		// All changes which were made should be committed,
		// as only after this function returns should the changes
		// for the record be kept.
		record.commit();

		return record;
	},

	/**
	 * Obtain the {@link #type object class} definition which can be used for constructing
	 * new {@link Ext.data.Record records}. The type will be a subclass of
	 * {@link Zarafa.core.data.RecordDefinition#base base}.
	 * @return {Class} The object class definition for this record definition
	 */
	getType : function()
	{
		if (!Ext.isDefined(this.type)) {
			var baseClass = this.getBaseClass();
			var fields = this.getFields();
			this.type = Zarafa.core.data.Record.create(fields, baseClass);
		}
		return this.type;
	},

	/**
	 * Set the {@link #base} class for the {@link Zarafa.core.data.RecordDefinition definition}.
	 *
	 * NOTE: If {@link #createRecord} has been called, then changes made by this function will
	 * no longer have effect.
	 *
	 * @param {Class} baseClass The base class to set.
	 */
	setBaseClass : function(baseClass)
	{
		this.cfg.base = baseClass;
	},

	/**
	 * Obtain the {@link #base} class which must be used when creating a new record
	 * from this {@link Zarafa.core.data.RecordDefinition definition}. If
	 * no base class is yet provided, this function will call recursively
	 * into its {@link #parent parents} until a valid base class has been found.
	 * @return {Class} The base class to be used for creating a new record.
	 * @private
	 */
	getBaseClass : function()
	{
		if (!Ext.isDefined(this.base)) {
			if (this.cfg.base) {
				this.base = this.cfg.base;
			} else if (Ext.isDefined(this.parent)) {
				this.base = this.parent.getBaseClass();
			} else {
				this.base = Ext.data.Record;
			}
		}
		return this.base;
	},

	/**
	 * Set the type which must be used for a particular SubStore.
	 * When a SubStore type has been set on a RecordType, then the
	 * subStore is considered 'supported' by the Record.
	 *
	 * NOTE: If {@link #createRecord} has been called, then changes made by this function will
	 * no longer have effect.
	 *
	 * @param {String} name The name of the SubStore (This matches the name how the
	 * data for this subStore is send through Json).
	 * @param {Type} type The Object type which must be used to allocate the subStore
	 */
	setSubStore : function(name, type)
	{
		this.cfg.subStores = Ext.value(this.cfg.subStores, {});
		this.cfg.subStores[name] = type;
	},

	/**
	 * Obtain the key-value array of subStore types which are active for
	 * this {@link Zarafa.core.data.RecordDefinition definition}. This object
	 * is used to {@link Zarafa.core.data.MAPIRecord#setSubStoreTypes set} on
	 * the {@link Zarafa.core.data.MAPIRecord MAPIRecord} which is created.
	 * @return {Object} key-value array of all subStore Types
	 * @private
	 */
	getSubStores : function()
	{
		if (!this.subStores) {
			this.subStores = {};
			if (Ext.isDefined(this.parent)) {
				Ext.apply(this.subStores, this.parent.getSubStores());
			}
			Ext.apply(this.subStores, this.cfg.subStores);
		}

		return Ext.apply({}, this.subStores);
	},

	/**
	 * Add a {@link Ext.data.Field field} to the {@link Zarafa.core.data.RecordDefinition definition}.
	 *
	 * NOTE: If {@link #createRecord} has been called, then changes made by this function will
	 * no longer have effect.
	 *
	 * @param {Ext.data.Field} field The field to add.
	 */
	addField : function(field)
	{
		this.cfg.fields = Ext.value(this.cfg.fields, []);

		if (!Array.isArray(field)) {
			this.cfg.fields.push(field);
		} else {
			this.cfg.fields = this.cfg.fields.concat(field);
		}
	},

	/**
	 * Obtain the list of {@link Ext.data.Field fields} which are active
	 * for this {@link Zarafa.core.data.RecordDefinition definition}.
	 * These fields must be used to create a record, to indicate which
	 * {@link Ext.data.Field fields} are allowed.
	 * This function will recursively call into its parents to obtain
	 * all fields from the parents.
	 *
	 * @return {Ext.data.Field[]} All fields which are active for
	 * this definition.
	 * @private
	 */
	getFields : function()
	{
		if (!this.fields) {
			this.fields = [];

			if (Ext.isDefined(this.parent)) {
				this.fields = this.fields.concat(this.parent.getFields());
			}
			if (this.cfg.fields) {
				this.fields = this.fields.concat(this.cfg.fields);
			}
		}

		return this.fields;
	},

	/**
	 * Add a default value for a {@link Ext.data.Field field} to the
	 * {@link Zarafa.core.data.RecordDefinition definition}.
	 *
	 * NOTE: If {@link #createRecord} has been called, then changes made by this function will
	 * no longer have effect.
	 *
	 * @param {Ext.data.Field} field The field for which the default value applies
	 * @param {Mixed} value The default value for the field
	 */
	addDefaultValue : function(field, value)
	{
		this.cfg.defaults = Ext.value(this.cfg.defaults, {});
		var name = Ext.isString(field) ? field : field.name;
		this.cfg.defaults[name] = value;
	},

	/**
	 * Apply all default values for the {@link Ext.data.Field field}
	 * which have been set for the {@link Zarafa.core.data.RecordDefinition definition}.
	 *
	 * This function will recursively call into its parents to apply
	 * all default values from the parents.
	 * @private
	 */
	getDefaultValues : function()
	{
		if (!this.defaults) {
			this.defaults = {};

			if (Ext.isDefined(this.parent)) {
				Ext.apply(this.defaults, this.parent.getDefaultValues());
			}

			if (this.cfg.defaults) {
				Ext.apply(this.defaults, this.cfg.defaults);
			}
		}

		return this.defaults;
	},

	/**
	 * Apply all default values from the {@link Ext.data.Field field}
	 * definitions. These are applied by the {@link Ext.data.DataReader DataReader}
	 * when reading {@link Ext.data.Record records} from the server, but not for
	 * {@link Ext.data.Record#phantom phantom} records.
	 * @private
	 */
	getFieldDefaultValues : function()
	{
		if (!this.fieldDefaults) {
			var fields = this.getFields();

			this.fieldDefaults = {};
			for (var i = 0, len = fields.length; i < len; i++) {
				var field = fields[i];
				var value = field.defaultValue;
				if (!Ext.isDefined(value)) {
					value = Ext.data.Field.prototype.defaultValue;
				}

				this.fieldDefaults[field.name] = value;
			}
			Ext.apply(this.fieldDefaults, this.cfg.createDefaults);
		}

		return this.fieldDefaults;
	},

	/**
	 * Fires the specified event with the passed parameters (minus the event name).
	 *
	 * This function will recursively call into its parents to fire the event
	 * from the parents.
	 * @param {String} eventName The name of the event to fire.
	 * @param {Object...} args The arguments for the event
	 * @return {Boolean} returns false if any of the handlers return false otherwise it returns true.
	 */
	fireEvent : function()
	{
		if (Ext.isDefined(this.parent)) {
			this.parent.fireEvent.apply(this.parent, arguments);
		}
		Zarafa.core.data.RecordDefinition.superclass.fireEvent.apply(this, arguments);
	}
});
