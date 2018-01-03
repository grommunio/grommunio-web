describe('DurationField', function() {
	var durationField;

	beforeEach(function() {
		durationField = new Zarafa.common.ui.DurationField({
			renderTo: Ext.getBody()
		});
	});

	afterEach(function() {
		durationField.destroy();
	});

	it('can setValue', function() {
		durationField.setValue("something amazing");
		expect(durationField.getValue()).toEqual("");

		durationField.setValue(-10);
		expect(durationField.getValue()).toEqual(-10);

		durationField.setValue(10);
		expect(durationField.getValue()).toEqual(10);
	});

	it('can processValue', function() {
		expect(durationField.processValue("henk")).toEqual("");
		expect(durationField.processValue("10")).toEqual("10");
		expect(durationField.processValue("10")).toEqual("10");
		expect(durationField.processValue("10.0")).toEqual("100");
	});
});
