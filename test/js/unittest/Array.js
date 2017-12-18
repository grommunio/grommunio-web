/**
 * Test Array polyfill
 */
describe('Array', function() {

	describe('Equals', function() {
		const arr = ['123', 'lol'];
		const arr2 = ['123'];

		it('can return true if it equals itself', function() {
			expect(arr.equals(arr)).toEqual(true);
		});

		it('can return false if does not equals itself', function() {
			expect(arr.equals(arr2)).toEqual(false);
		});

		it('can return false when items do not match', function() {
			expect(arr.equals([1,2])).toEqual(false);
		});
		
	});

	describe('Clone', function() {
		const arr = ['123', 'lol'];

		it('is the same if we compare the clone() result', function() {
			expect(arr.clone()).toEqual(arr);
		});
	});
});
