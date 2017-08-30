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

if (!Array.prototype.find) {
	/**
	 * Returns the value of the first element in the array that satisfies
	 * the provided testing function. Otherwise undefined is returned.
	 * @param {Function} predicate Function to execute on each value in the array
	 * @return {Mixed} A value in the array if an element passes the test; otherwise, undefined.
	 */
	Object.defineProperty(Array.prototype, 'find', {
		value: function(predicate) {
			// 1. Let O be ? ToObject(this value).
			if (this === null) {
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If IsCallable(predicate) is false, throw a TypeError exception.
			if (typeof predicate !== 'function') {
				throw new TypeError('predicate must be a function');
			}

			// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
			var thisArg = arguments[1];

			// 5. Let k be 0.
			var k = 0;

			// 6. Repeat, while k < len
			while (k < len) {
				// b. Let kValue be ? Get(O, Pk).
				// a. Let Pk be ! ToString(k).
				// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
				// d. If testResult is true, return kValue.
				var kValue = o[k];
				if (predicate.call(thisArg, kValue, k, o)) {
					return kValue;
				}
				// e. Increase k by 1.
				k++;
			}

			// 7. Return undefined.
			return undefined;
		}
	});
}