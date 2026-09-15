Ext.namespace('Grommunio.common.recipientfield.data');

/**
 * @class Grommunio.common.recipientfield.data.SuggestionListJsonWriter
 * @extends Ext.data.JsonWriter
 */
Grommunio.common.recipientfield.data.SuggestionListJsonWriter = Ext.extend(Ext.data.JsonWriter, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			writeAllFields: true,
			encode: false
		});

		Grommunio.core.data.JsonWriter.superclass.constructor.call(this, config);
	},

	/**
	 * Use the {@link Ext.data.JsonWriter#toHash toHash} function for creating the hash.
	 *
	 * @param {Ext.data.Record} record
	 * @return {Object}
	 * @override
	 * @private
	 */
	destroyRecord: function(record){
		return this.toHash(record);
	}
});
