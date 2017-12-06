Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.Enum
 * @extends Object
 * 
 * Base class for Enumerations, which are defined as <String, Number> hash maps. 
 * Provides a set of get methods for getting properties or property names by value.
 */
Zarafa.core.Enum = Ext.extend(Object, {
	
	/**
	 * Get a property by value. 
	 * @param {Number} value
	 * @return the property value (equal to the input) iff a property with the given value exists. Returns undefined otherwise.   
	 */
	get : function(value)
	{
		value = parseInt(value, 10);
		for (var key in this) {
			if (this[key]==value) {
				return this[key];
			}
		}
	},
	
	/**
	 * Gets a property name by value.
	 * @param {Number} value
	 * @return the property name iff a property with the given value exists. Returns undefined otherwise.   
	 */
	getName : function(value)
	{
		value = parseInt(value, 10);
		for (var key in this) {
			if (this[key]==value) {
				return key;
			}
		}
	},

	/**
	 * Gets a property value by name.
	 * @param {String} key key of the <String, Number> hashmap
	 * @return {Number} the property value corresponding to string key
	 */
	getValue : function(key)
	{
		var value = this[key];

		if(Ext.isNumber(value)) {
			return value;
		}
	},

	/**
	 * Adds a new property and assigns it a unique value. If the property already exists it does not
	 * add the new property and returns the value of the existing one.
	 * @param {String} key key of the <String, Number> hashmap
	 * @return {Number} the property value corresponding to string key
	 */
	addProperty: function(propKey)
	{
		// Look for the highest value
		var highestValue = 0;
		for (var key in this) {
			if (typeof this[key] == 'number'){
				// Return the value if the property already exists
				if(key == propKey) {
					return this[key];
				}

				if(highestValue < this[key]){
					highestValue = this[key];
				}
			}
		}

		// Take the highest value, increase it by one and set it as value for the new property 
		highestValue++;
		this[propKey] = highestValue;

		return highestValue;
		
	}
});

// Convenience method
Zarafa.core.Enum.create = function(object)
{
	var ExtendedObject = Ext.extend(Zarafa.core.Enum, object);
	return new ExtendedObject();
};
