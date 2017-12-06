Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.RecordFactory
 * The factory class for creating objects of {@link Ext.data.Record record}
 * which are specialized for certain messageclasses (IPM.Note, IPM.Contact, etc).
 * The exact field definition of the different {@link Ext.data.Record records}
 * can be configured by {@link Zarafa.core.Context contexts} and {@link Zarafa.core.Plugin plugins}
 * to add new fields, but also to control the default values for particular fields.
 *
 * For fine-grained control over all classes, the factory also supports
 * {@link Ext.data.Record record} for sub messageclasses like (IPM.Note.NDR),
 * where the sub messageclass depends on its parent (IPM.Note.NDR inherits its fields, and
 * default values from IPM.Note).
 *
 * For plugins with custom types (no official MAPI ObjectType, or Message Class definition),
 * we have the {@link Zarafa.core.data.RecordCustomObjectType Custom Type} definitions to which
 * they can register their custom type, which can then be used to work together with
 * the record factory.
 *
 * @singleton
 */
Zarafa.core.data.RecordFactory = {
	/**
	 * Key-value map of {@link Zarafa.core.data.RecordDefinition} as registered by
	 * {@link #createRecordDefinition}. 
	 *
	 * @property
	 * @type Object
	 */
	definitions : {},

	/**
	 * Obtain the parent messageclass for the given messageclass.
	 * The hierarchy of the messageclass is based on the dot ('.')
	 * character. Each dot indicates a step deeper into the hierarchy.
	 * Thus if the messageclass is IPM.Note, the parent is IPM.
	 *
	 * @param {String} messageClass The messageclass for which
	 * the parent is requested.
	 * @return {String} The parent messageclass (undefined, if
	 * the messageclass has no parent.
	 * @private
	 */
	getMessageClassParent : function(messageClass)
	{
		var lastDot = messageClass.lastIndexOf('.');
		if (lastDot > 0) {
			return messageClass.substr(0, lastDot);
		}
	},

	/**
	 * Obtain the parent {@link Zarafa.core.data.RecordDefinition RecordDefinition}
	 * for this messageclass.
	 * @param {String} The messageclass for the parent is searched for
	 * @return {Zarafa.core.data.RecordDefinition} The parent record definition.
	 * Undefined if the messageclass does not have a parent.
	 */
	getMessageClassParentDefinition : function(messageClass)
	{
		var messageClassParent = this.getMessageClassParent(messageClass);

		if (Ext.isDefined(messageClassParent)) {
			return this.getRecordDefinitionByMessageClass(messageClassParent);
		} 
	},

	/**
	 * Create a new {@link Zarafa.core.data.RecordDefinition RecordDefinition}
	 * for the given key value.
	 *
	 * @param {Mixed} key The key value on how the definition is stored
	 * in the definitions table.
	 * @param {Zarafa.core.data.RecordDefinition} parent The parent record
	 * definition.
	 * @param {Object} defaults The default values which must be applied to
	 * the record definition.
	 * @return {Zarafa.core.data.RecordDefinition} The new record definition.
	 */
	createRecordDefinition : function(key, parent, defaults)
	{
		var definition = new Zarafa.core.data.RecordDefinition({
			base : undefined,
			parent : parent,
			createDefaults : defaults
		});

		this.definitions[key] = definition;
		return definition;
	},

	/**
	 * Obtain the {@link Zarafa.core.data.RecordDefinition RecordDefinition} object
	 * which belongs to the given custom type. If the custom type is previously unknown
	 * and the {@link Zarafa.core.data.RecordDefinition definition} does not exist,
	 * a new {@link Zarafa.core.data.RecordDefinition definition} will be created and
	 * returned.
	 *
	 * @param {Zarafa.core.data.RecordCustomObjectType} customType The custom type for which the definition is requested.
	 * @return {Zarafa.core.data.RecordDefinition} The definition object for the custom type
	 * @private
	 */
	getRecordDefinitionByCustomType : function(customType)
	{
		var definition = this.definitions[customType];
		if (Ext.isDefined(definition)) {
			return definition;
		}

		// Custom types don't have any hierarchy...
		return this.createRecordDefinition(customType, undefined);
	},

	/**
	 * Obtain the {@link Zarafa.core.data.RecordDefinition RecordDefinition} object
	 * which belongs to the given object class. If the object type is previously unknown
	 * and the {@link Zarafa.core.data.RecordDefinition definition} does not exist,
	 * a new {@link Zarafa.core.data.RecordDefinition definition} will be created and
	 * returned.
	 *
	 * @param {Zarafa.core.mapi.ObjectType} objectType The object type for which the definition is requested.
	 * @return {Zarafa.core.data.RecordDefinition} The definition object for the object type
	 * @private
	 */
	getRecordDefinitionByObjectType : function(objectType)
	{
		var definition = this.definitions[objectType];
		if (Ext.isDefined(definition)) {
			return definition;
		}

		// Object types don't have any hierarchy...
		return this.createRecordDefinition(objectType, undefined, {'object_type' : objectType});
	},

	/**
	 * Obtain the {@link Zarafa.core.data.RecordDefinition RecordDefinition} object
	 * which belongs to the given messageclass. If the messageClass is previously unknown
	 * and the {@link Zarafa.core.data.RecordDefinition definition} does not exist,
	 * a new {@link Zarafa.core.data.RecordDefinition definition} will be created and
	 * returned.
	 *
	 * @param {String} messageClass The messageclass for which the definition is requested.
	 * @return {Zarafa.core.data.RecordDefinition} The definition object for the messageclass. 
	 * @private
	 */
	getRecordDefinitionByMessageClass : function(messageClass)
	{
		var keyName = messageClass.toUpperCase();
		var definition = this.definitions[keyName];
		var parent;

		if (Ext.isDefined(definition)) {
			return definition;
		}

		parent = this.getMessageClassParentDefinition(keyName);
		if (!Ext.isDefined(parent)){
			/* - If record contains message_class which has no IPM as prefix or suffix followed by dot(.)
			 * like MEMO, REPORT etc, which are not supported by webapp and no fields are available as well (fields
			  * are not registered by any record in webapp) hence record is treated as faulty message in webapp.
			 *
			 * - Webapp can create such records as Ext.data.Record, without throwing any warning or error,
			 * this particular record not able to use Zarafa.core.data.IPMRecord functions.
			 *
			 * - To Fix this, If webapp found any message_class of record which has no IPM as prefix or
			 * suffix followed by dot(.), then by default we set the IPM record definition as parent of this record
			 * definition, further webapp will treat this message as faulty message.
			 */
			parent = this.definitions["IPM"];
		}
		return this.createRecordDefinition(keyName, parent, {'message_class' : messageClass});
	},

	/**
	 * Create a new {@link Ext.data.Record record} object based on the
	 * definitions given for the custom type.
	 *
	 * @param {Zarafa.core.data.RecordCustomObjectType} customType The custom type for which
	 * the record is created.
	 * @param {Object} data (Optional) An object, the properties of which provide
	 * values for the new Record's fields. If not specified the {@link Ext.data.Field.defaultValue}
	 * for each field will be assigned.
	 * @param {Object} id (Optional) The id of the Record. The id is used by the
	 * {@link Ext.data.Store Store} object which owns the {@link Ext.data.Record}
	 * to index its collection of Records (therefore this id should be unique within
	 * each store). If an id is not specified a phantom Record will be created with an
	 * automatically generated id.
	 * @return {Ext.data.Record} The new record
	 */
	createRecordObjectByCustomType : function(customType, data, id)
	{
		var definition = this.getRecordDefinitionByCustomType(customType);
		return definition.createRecord(data, id);
	},

	/**
	 * Create a new {@link Ext.data.Record record} object based on the
	 * definitions given for the object type.
	 *
	 * @param {Zarafa.core.mapi.ObjectType} objectType The object type for which
	 * the record is created.
	 * @param {Object} data (Optional) An object, the properties of which provide
	 * values for the new Record's fields. If not specified the {@link Ext.data.Field.defaultValue}
	 * for each field will be assigned.
	 * @param {Object} id (Optional) The id of the Record. The id is used by the
	 * {@link Ext.data.Store Store} object which owns the {@link Ext.data.Record}
	 * to index its collection of Records (therefore this id should be unique within
	 * each store). If an id is not specified a phantom Record will be created with an
	 * automatically generated id.
	 * @return {Ext.data.Record} The new record
	 */
	createRecordObjectByObjectType : function(objectType, data, id)
	{
		var definition = this.getRecordDefinitionByObjectType(objectType);
		return definition.createRecord(data, id);
	},

	/**
	 * Create a new {@link Ext.data.Record record} object based on the
	 * definitions given for the messageclass.
	 *
	 * @param {String} messageClass The messageclass for which the record is created.
	 * @param {Object} data (Optional) An object, the properties of which provide
	 * values for the new Record's fields. If not specified the {@link Ext.data.Field.defaultValue}
	 * for each field will be assigned.
	 * @param {Object} id (Optional) The id of the Record. The id is used by the
	 * {@link Ext.data.Store Store} object which owns the {@link Ext.data.Record}
	 * to index its collection of Records (therefore this id should be unique within
	 * each store). If an id is not specified a phantom Record will be created with an
	 * automatically generated id.
	 * @return {Ext.data.Record} The new record
	 */
	createRecordObjectByMessageClass : function(messageClass, data, id)
	{
		var definition = this.getRecordDefinitionByMessageClass(messageClass);
		return definition.createRecord(data, id);
	},

	/**
	 * Create a new {@link Ext.data.Record record} object based on the
	 * definitions from the record data, this will determine if
	 * the messageclass of object type has been provided. If neither has been provided
	 * this function will return undefined.
	 *
	 * @param {Object} recordData The record data from which the record class must be detected
	 * it slaos contains the properties of which provide values for the new Record's fields. 
	 * @param {Object} id (Optional) The id of the Record. The id is used by the
	 * {@link Ext.data.Store Store} object which owns the {@link Ext.data.Record}
	 * to index its collection of Records (therefore this id should be unique within
	 * each store). If an id is not specified a phantom Record will be created with an
	 * automatically generated id.
	 * @return {Class} The record class definition
	 */
	createRecordObjectByRecordData : function(recordData, id)
	{
		if (!Ext.isEmpty(recordData.message_class)) {
			return this.createRecordObjectByMessageClass(recordData.message_class, recordData, id);
		} else if (!Ext.isEmpty(recordData.object_type)) {
			return this.createRecordObjectByObjectType(recordData.object_type, recordData, id);
		}
	},

	/**
	 * Get the record class definition for this custom type
	 * This class definition can be used to construct new {@link Ext.data.Record record}
	 * objects which is completely tuned for the given object type.
	 *
	 * @param {Zarafa.core.data.RecordCustomObjectType} customType The object type for which the
	 * record class is requested
	 * @return {Class} The record class definition
	 */
	getRecordClassByCustomType : function(customType)
	{
		var definition = this.getRecordDefinitionByCustomType(customType);
		return definition.getType();
	},

	/**
	 * Get the record class definition for this object type
	 * This class definition can be used to construct new {@link Ext.data.Record record}
	 * objects which is completely tuned for the given object type.
	 *
	 * @param {Zarafa.core.mapi.ObjectType} objectType The object type for which the
	 * record class is requested
	 * @return {Class} The record class definition
	 */
	getRecordClassByObjectType : function(objectType)
	{
		var definition = this.getRecordDefinitionByObjectType(objectType);
		return definition.getType();
	},

	/**
	 * Get the record class definition for this messageclass
	 * This class definition can be used to construct new {@link Ext.data.Record record}
	 * objects which is completely tuned for the given messageclass.
	 *
	 * @param {String} messageClass The messageclass for which the record class is requested
	 * @return {Class} The record class definition
	 */
	getRecordClassByMessageClass : function(messageClass)
	{
		var definition = this.getRecordDefinitionByMessageClass(messageClass);
		return definition.getType();
	},

	/**
	 * Get the record class definition for this record data, this will determine if
	 * the messageclass of object type has been provided. If neither has been provided
	 * this function will return undefined.
	 * This class definition can be used to construct new {@link Ext.data.Record record}
	 * objects which is completely tuned for the given messageclass.
	 *
	 * @param {Object} recordData The record data from which the record class must be detected
	 * @return {Class} The record class definition
	 */
	getRecordClassByRecordData : function(recordData)
	{
		if (Ext.isDefined(recordData.message_class)) {
			return this.getRecordClassByMessageClass(recordData.message_class);
		} else if (Ext.isDefined(recordData.object_type)) {
			return this.getRecordClassByObjectType(recordData.object_type);
		}
	},

	/**
	 * This will set a new base class on the {@link Zarafa.core.data.RecordDefinition definition}.
	 * The base class is used when creating a new record, by default the ExtJS
	 * {@link Ext.data.Record record} will be used as base.
	 *
	 * @param {Zarafa.core.data.RecordCustomObjectType} customType The custom type for which
	 * the new base class must be set.
	 * @param {Class} baseClass The new base class to use
	 */
	setBaseClassToCustomType : function(customType, baseClass)
	{
		var definition = this.getRecordDefinitionByCustomType(customType);
		definition.setBaseClass(baseClass);
	},

	/**
	 * This will set a new base class on the {@link Zarafa.core.data.RecordDefinition definition}.
	 * The base class is used when creating a new record, by default the ExtJS
	 * {@link Ext.data.Record record} will be used as base.
	 *
	 * @param {Zarafa.core.mapi.ObjectType} objectType The object type for which
	 * the new base class must be set.
	 * @param {Class} baseClass The new base class to use
	 */
	setBaseClassToObjectType : function(objectType, baseClass)
	{
		var definition = this.getRecordDefinitionByObjectType(objectType);
		definition.setBaseClass(baseClass);
	},

	/**
	 * This will set a new base class on the {@link Zarafa.core.data.RecordDefinition definition}.
	 * The base class is used when creating a new record, by default the ExtJS
	 * {@link Ext.data.Record record} will be used as base.
	 *
	 * @param {String} messageClass The messageclass for which
	 * the new base class must be set.
	 * @param {Class} baseClass The new base class to use
	 */
	setBaseClassToMessageClass : function(messageClass, baseClass)
	{
		var definition = this.getRecordDefinitionByMessageClass(messageClass);
		definition.setBaseClass(baseClass);
	},

	/**
	 * This will set the SubStore type for a particular subStore name
	 * in the {@link Zarafa.core.data.RecordDefinition definition}. Inside
	 * a SubStore a Table can be loaded like Attachments, recipients, members, etc.
	 *
	 * @param {Zarafa.core.data.RecordCustomObjectType} customType The custom type for which the
	 * SubStore type must be set
	 * @param {String} name The name of the SubStore table
	 * @param {Constructor} type The SubStore type
	 */
	setSubStoreToCustomType : function(customType, name, type)
	{
		var definition = this.getRecordDefinitionByCustomType(customType);
		definition.setSubStore(name, type);
	},

	/**
	 * This will set the SubStore type for a particular subStore name
	 * in the {@link Zarafa.core.data.RecordDefinition definition}. Inside
	 * a SubStore a Table can be loaded like Attachments, recipients, members, etc.
	 *
	 * @param {Zarafa.core.mapi.ObjectType} objectType The object type for which the
	 * SubStore type must be set
	 * @param {String} name The name of the SubStore table
	 * @param {Constructor} type The SubStore type
	 */
	setSubStoreToObjectType : function(objectType, name, type)
	{
		var definition = this.getRecordDefinitionByObjectType(objectType);
		definition.setSubStore(name, type);
	},

	/**
	 * This will set the SubStore type for a particular subStore name
	 * in the {@link Zarafa.core.data.RecordDefinition definition}. Inside
	 * a SubStore a Table can be loaded like Attachments, recipients, members, etc.
	 *
	 * @param {String} messageClass The messageclass for which
	 * @param {String} name The name of the SubStore table
	 * @param {Constructor} type The SubStore type
	 */
	setSubStoreToMessageClass : function(messageClass, name, type)
	{
		var definition = this.getRecordDefinitionByMessageClass(messageClass);
		definition.setSubStore(name, type);
	},

	/**
	 * This will add a new {@link Ext.data.Field field} to the
	 * {@link Zarafa.core.data.RecordDefinition definition}.
	 *
	 * @param {Zarafa.core.data.RecordCustomObjectType} customType The custom type to which the field
	 * should be added.
	 * @param {String/Ext.data.Field} field The field which must be added.
	 */
	addFieldToCustomType : function(customType, field)
	{
		var definition = this.getRecordDefinitionByCustomType(customType);
		definition.addField(field);
	},

	/**
	 * This will add a new {@link Ext.data.Field field} to the
	 * {@link Zarafa.core.data.RecordDefinition definition}.
	 *
	 * @param {Zarafa.core.mapi.ObjectType} objectType The object type to which the field
	 * should be added.
	 * @param {String/Ext.data.Field} field The field which must be added.
	 */
	addFieldToObjectType : function(objectType, field)
	{
		var definition = this.getRecordDefinitionByObjectType(objectType);
		definition.addField(field);
	},

	/**
	 * This will add a new {@link Ext.data.Field field} to the
	 * {@link Zarafa.core.data.RecordDefinition definition}.
	 *
	 * @param {String} messageClass The messageclass to which the field
	 * should be added.
	 * @param {String/Ext.data.Field} field The field which must be added.
	 */
	addFieldToMessageClass : function(messageClass, field)
	{
		var definition = this.getRecordDefinitionByMessageClass(messageClass);
		definition.addField(field);
	},

	/**
	 * This will add a default value for a {@link Ext.data.Field field}
	 * to the {@link Zarafa.core.data.RecordDefinition definition}. When
	 * creating a new local item
	 * ({@link Zarafa.core.data.RecordFactory.createRecordObjectByCustomType createRecordObjectByCustomType}
	 * with the phantom argument to true) the default values which be applied
	 * to the newly created {@link Ext.data.Record record}.
	 *
	 * @param {Zarafa.core.data.RecordCustomObjectType} customType The custom type to which the field belongs
	 * @param {String/Ext.data.Field} field The field for which the default
	 * value should be applied
	 * @param {Mixed} defaultValue the default value for the given fieldname
	 */
	addDefaultValueToCustomType : function(customType, field, defaultValue)
	{
		var definition = this.getRecordDefinitionByCustomType(customType);
		definition.addDefaultValue(field, defaultValue);
	},

	/**
	 * This will add a default value for a {@link Ext.data.Field field}
	 * to the {@link Zarafa.core.data.RecordDefinition definition}. When
	 * creating a new local item
	 * ({@link Zarafa.core.data.RecordFactory.createRecordObjectByObjectType createRecordObjectByObjectType}
	 * with the phantom argument to true) the default values which be applied
	 * to the newly created {@link Ext.data.Record record}.
	 *
	 * @param {Zarafa.core.mapi.ObjectType} objectType The object type to which the field belongs
	 * @param {String/Ext.data.Field} field The field for which the default
	 * value should be applied
	 * @param {Mixed} defaultValue the default value for the given fieldname
	 */
	addDefaultValueToObjectType : function(objectType, field, defaultValue)
	{
		var definition = this.getRecordDefinitionByObjectType(objectType);
		definition.addDefaultValue(field, defaultValue);
	},

	/**
	 * This will add a default value for a {@link Ext.data.Field field}
	 * to the {@link Zarafa.core.data.RecordDefinition definition}. When
	 * creating a new local item
	 * ({@link Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass createRecordObjectByMessageClass}
	 * with the phantom argument to true) the default values which be applied
	 * to the newly created {@link Ext.data.Record record}.
	 *
	 * @param {String} messageClass The messageclass to which the field belongs
	 * @param {String/Ext.data.Field} field The field for which the default
	 * value should be applied
	 * @param {Mixed} defaultValue the default value for the given fieldname
	 */
	addDefaultValueToMessageClass : function(messageClass, field, defaultValue)
	{
		var definition = this.getRecordDefinitionByMessageClass(messageClass);
		definition.addDefaultValue(field, defaultValue);
	},

	/**
	 * Appends an event handler to the {@link Zarafa.core.data.RecordDefinition RecordDefinition}
	 * for the given CustomType.
	 * @param {Zarafa.core.data.RecordCustomObjectType} customType The custom type to which the event must be added
	 * @param {String} eventName The name of the event to listen for
	 * @param {Function} handler The method the event invokes
	 * @param {Object} scope (optional) The scope (this reference) in which the handler function is executed.
	 * If omitted, defaults to the object which fired the event.
	 * @param {Object} options (optional) An object containing handler configuration properties.
	 */
	addListenerToCustomType : function(customType, eventName, handler, scope, options)
	{
		var definition = this.getRecordDefinitionByCustomType(customType);
		definition.on(eventName, handler, scope, options);
	},

	/**
	 * Appends an event handler to the {@link Zarafa.core.data.RecordDefinition RecordDefinition}
	 * for the given ObjectType.
	 * @param {Zarafa.core.mapi.ObjectType} objectType The object type to which the event must be added
	 * @param {String} eventName The name of the event to listen for
	 * @param {Function} handler The method the event invokes
	 * @param {Object} scope (optional) The scope (this reference) in which the handler function is executed.
	 * If omitted, defaults to the object which fired the event.
	 * @param {Object} options (optional) An object containing handler configuration properties.
	 */
	addListenerToObjectType : function(objectType, eventName, handler, scope, options)
	{
		var definition = this.getRecordDefinitionByObjectType(objectType);
		definition.on(eventName, handler, scope, options);
	},

	/**
	 * Appends an event handler to the {@link Zarafa.core.data.RecordDefinition RecordDefinition}
	 * for the given messageClass.
	 * @param {String} messageClass The messageclass to which the event must be added
	 * @param {String} eventName The name of the event to listen for
	 * @param {Function} handler The method the event invokes
	 * @param {Object} scope (optional) The scope (this reference) in which the handler function is executed.
	 * If omitted, defaults to the object which fired the event.
	 * @param {Object} options (optional) An object containing handler configuration properties.
	 */
	addListenerToMessageClass : function(messageClass, eventName, handler, scope, options)
	{
		var definition = this.getRecordDefinitionByMessageClass(messageClass);
		definition.on(eventName, handler, scope, options);
	}
};
