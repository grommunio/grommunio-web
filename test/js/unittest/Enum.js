describe('Enum', function() {
	const coreEnum = Zarafa.core.Enum.create({
		TWO: 2,
		ONE: 1,
		ZERO: 0,
	});

	it('can get property by value', function() {
		expect(coreEnum.get(0)).toEqual(0);
		expect(coreEnum.get(3)).toBeUndefined();
	});

	it('can get property by name', function() {
		expect(coreEnum.getName(0)).toEqual("ZERO");
		expect(coreEnum.getName(2)).toEqual("TWO");
		expect(coreEnum.getName(3)).toBeUndefined();
	});

	it('can get property by value key', function() {
		expect(coreEnum.getValue("TWO")).toEqual(2);
		expect(coreEnum.getValue(3)).toBeUndefined();
		expect(coreEnum.getValue("THREE")).toBeUndefined();
	});

	it('can add property', function() {
		coreEnum.addProperty("THREE");
		expect(coreEnum.getValue("THREE")).toEqual(3);
		expect(coreEnum.getName(3)).toEqual("THREE");
	});
});
