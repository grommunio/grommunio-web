/**
 * @class Ext.EventObjectImpl
 * #core
 */
Ext.apply(Ext.EventObjectImpl.prototype, {
	/**
	 * Function will return Character code for the key event
	 * Number keys of numpad keys have keycode of 96 to 105, this function will
	 * convert it to proper ASCII character and return it
	 * 
	 * @return {String} The trimmed string
	 */
	getKeyCharCode : function()
	{
		var key = this.getCharCode();
		// Handle numpad keys here
		if (key >= this.NUM_ZERO && key <= this.NUM_NINE) {
			// These are numkeys and it will have different keyCode than number's
			// ASCII value so we are maping these keys to it's original character values.
			key = key - 48;
		}
		return String.fromCharCode(key);
	}
});