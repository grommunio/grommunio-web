Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.Record
 * @singleton
 */
Zarafa.core.data.Record = {
	/**
	 * Create subclass of a {@link Ext.data.Record record} using the
	 * default list of fields.
	 * @param {Object} fields The fields which must be added to the subclass.
	 * @param {Type} base The base type from which the subclass must be derived.
	 * @return {Object} The type of the subclass.
	 */
	create : function(fields, base)
	{
		var subclass = Ext.extend(base || Ext.data.Record, {});
		var proto = subclass.prototype;

		proto.fields = new Ext.util.MixedCollection(false, function(field) {
			return field.name;
		});

		this.addFields(proto, fields || []);

		subclass.getField = function(name)
		{
			return proto.fields.get(name);
		};

		return subclass;
	},

	/**
	 * Add fields to an object
	 * @param {Object} proto The object to update the fields to
	 * @param {Object} fields The array of fields which must be added
	 * @private
	 */
	addFields : function(proto, fields)
	{
		for(var i = 0, len = fields.length; i < len; i++) {
			if (Ext.isArray(fields[i])) {
				this.addFields(proto, fields[i]);
			} else {
				proto.fields.add(new Ext.data.Field(fields[i]));
			}
		}
	}
};
