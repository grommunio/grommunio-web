describe('DisplayField', function() {
	var displayField;

	beforeEach(function() {
		displayField = new Zarafa.common.ui.DisplayField({
			renderTo: Ext.getBody()
		});
	});

	afterEach(function() {
		displayField.destroy();
	});

	it('can setValue', function() {
		const value = "Something amazing";
		displayField.setValue(value);
		expect(displayField.getValue()).toEqual(value);
	});
});
