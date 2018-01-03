/*
 * Test the Ext.encode and JSON.stringify
 */
describe('JSON', function() {
	Ext.USE_NATIVE_JSON = true;
	
	/*
	 * Test if Ext.encode properly encodes undefined and null values or not
	 */
	describe('Encode', function() {
		it('can encode \'undefined\' keys & values', function() {
			expect(Ext.encode(undefined)).toBeUndefined();
			expect(Ext.encode({ a : undefined })).toEqual("{}");
		});

		it('can encode \'null\' keys & values', function() {
			expect(Ext.encode(null)).toEqual("null");
			expect(Ext.encode({ a : null })).toEqual('{"a":null}');
		});
	});

	/*
	 * Test if Ext.decode properly decodes null values or not
	 */
	describe('Decode', function() {
		it('can decode \'null\' keys & values', function() {
			expect(Ext.decode("null")).toBeNull();
			expect(Ext.decode('{"a":null}')).toEqual({ a : null });
		});
	});
});
