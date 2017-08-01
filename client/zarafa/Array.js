/**
 * @class Array
 * #core
 */
Ext.apply(Array.prototype, {
	/**
	 * Creates a shallow clone of the array. 
	 * @return {Array} a clone of the array.
	 */
	clone : function()
	{
		return this.slice(0);
	},

	/**
	 * Equality comparison for the Array. Only when both
	 * arrays contain the exact same elements the Arrays
	 * are equal.
	 */
	equals : function(arr)
	{
		// We are comparing the exact same references.
		if (this === arr) {
			return true;
		}

		// If the lengths are not equal, then the arrays
		// cannot be equal.
		if (this.length !== arr.length) {
			return false;
		}

		// Compare each element for equality.
		return this.every(function(element, index) {
			return element === arr[index];
		});
	}
});
