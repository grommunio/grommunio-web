(function() {

 	// Convert a string to a Integer
	//
	// Opposite to the Extjs implementation, this won't apply the
	// Ext.data.Types.stripRe regular expression, which means that
	// the protocol will demand that when the field is declared as
	// "Int" it _must_ be an integer and not a string like "$14,00"
	// or "15%".
 	var intConvert = function(v) {
		return v !== undefined && v !== null && v !== '' ?
		       parseInt(v, 10) : (this.useNull ? null : 0);
	};

	Ext.data.Types.INT.convert = intConvert;
	Ext.data.Types.INTEGER.convert = intConvert;

 	// Convert a string to a Float
	//
	// Opposite to the Extjs implementation, this won't apply the
	// Ext.data.Types.stripRe regular expression, which means that
	// the protocol will demand that when the field is declared as
	// "Float" it _must_ be an number and not a string like "$14,00"
	// or "15%".
 	var floatConvert = function(v) {
		return v !== undefined && v !== null && v !== '' ?
		       parseFloat(v, 10) : (this.useNull ? null : 0);
	};

	Ext.data.Types.FLOAT.convert = floatConvert;
	Ext.data.Types.NUMBER.convert = floatConvert;
})();
