Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.RecordCustomObjectType
 * @extends Zarafa.core.Enum
 *
 * Extension to the MAPI definitions for the
 * {@link Zarafa.core.data.ObjectType}. This can be used
 * by plugins to register new Object Types which can be
 * handled by the {@link Zarafa.core.data.RecordFactory}.
 *
 * New types should be registered using {@link #addProperty}
 * to register their new type, after which the value can be
 * used with the {@link Zarafa.core.data.RecordFactory} to
 * configure the {@link Zarafa.core.data.RecordFactory#addFieldToCustomType fields}
 * for example.
 *
 * @singleton
 */
Zarafa.core.data.RecordCustomObjectType = Zarafa.core.Enum.create({
	/**
	 * Denotes the BASE value from where to start counting
	 * new Custom Type. Because the Custom Types will be used
	 * by the {@link Zarafa.core.data.RecordFactory RecordFactory}
	 * together with {@link Zarafa.core.mapi.ObjectType ObjectType}
	 * the values in this enumeration should be higher then the
	 * highest value of the ObjectType enumeration.
	 * @property
	 * @type Number
	 */
	BASE_TYPE : 1000
});
