/*
 * Test various Zarafa.core.Util functions
 */
describe('Util', function() {
	/*
	 * Test all Array related functions.
	 */
	describe('Array', function() {

		it('can sort (ascending) an array with numbers', function() {
			const numArray = [ 8, 7, 4, 9, 2, 5, 1, 3, 6 ];
			const sorted = Zarafa.core.Util.sortArray(numArray, 'ASC');
			expect(sorted).toEqual([ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);
		});

		it('can sort (descending) an array with numbers', function() {
			const numArray = [ 8, 7, 4, 9, 2, 5, 1, 3, 6 ];
			const sorted = Zarafa.core.Util.sortArray(numArray, 'DESC');
			expect(sorted).toEqual([ 9, 8, 7, 6, 5, 4, 3, 2, 1 ]);
		});

		it('can sort an array of objects by a given key', function() {
			var objArray = [ {key : 8}, {key : 7}, {key: 4}, {key: 9}, {key: 2}, {key :5}, {key :1}, {key :3}, {key :6} ];
			const sorted = Zarafa.core.Util.sortArray(objArray, 'DESC', 'key');
			expect(sorted).toEqual([ {key: 9}, {key: 8}, {key: 7}, {key: 6}, {key :5}, {key :4}, {key :3}, {key: 2}, {key: 1} ]);
		});

		it('can filter duplicate items from an array with numbers' , function() {
			const numArray = [ 8, 8, 4, 2, 7, 8, 2 ];
			const unique = Zarafa.core.Util.uniqueArray(numArray);
			expect(unique).toEqual([ 8, 4, 2, 7 ]);
		});

		it('can filter duplicate items from an array with objects by a given key', function() {
			const objArray = [ {key: 8}, {key: 8}, {key: 4}, {key: 2}, {key: 7}, {key: 8}, {key: 2} ];
			const unique = Zarafa.core.Util.uniqueArray(objArray, 'key');
			expect(unique).toEqual([ {key: 8}, {key: 4}, {key: 2}, {key: 7} ]);
		});
	});

	/*
	 * Test all Objects related functions.
	 */
	describe('Objects', function() {

		/*
		 * Test applying one object to another
		 */
		describe('Apply', function() {
			var origObj;
			var extraObj;
		
			beforeEach(function() {
				origObj = { 
					'zarafa' : {
						'v1' : {
							'main' : {
								'week_start' : 1,
								'dialogs' : {
									'use_html_editor' : true
								}
							}
						},
						'v2' : {
							'main' : {
								'dialogs' : {
									'editor_type' : 1
								}
							}
						}
					}
				};

				extraObj = {
					'zarafa' : {
						'v1' : {
							'main' : {
								'dialogs' : {
									'use_html_editor' : false
								}
							}
						}
					}
				};
			});

			it('can apply an object recursively to another object', function() {
				const applied = Zarafa.core.Util.applyRecursive(origObj, extraObj);
				expect(applied).toEqual({
					'zarafa' : {
						'v1' : {
							'main' : {
								'week_start' : 1,
								'dialogs' : {
									'use_html_editor' : false
								}
							}
						},
						'v2' : {
							'main' : {
								'dialogs' : {
									'editor_type' : 1
								}
							}
						}
					}
				});
			});

			it('will create a copy of objects when applying an object recursively to another object', function() {
				const applied = Zarafa.core.Util.applyRecursive(origObj, extraObj);
				expect(applied.zarafa).not.toBe(extraObj.zarafa);
			});

			it('can conditionally apply an object recursively to another object', function() {
				const applied = Zarafa.core.Util.applyIfRecursive(origObj, extraObj);
				expect(applied).toEqual({
					'zarafa' : {
						'v1' : {
							'main' : {
								'week_start' : 1,
								'dialogs' : {
									'use_html_editor' : true
								}
							}
						},
						'v2' : {
							'main' : {
								'dialogs' : {
									'editor_type' : 1
								}
							}
						}
					}
				});
			});

			it('will create a copy of objects when conditionally applying an object recursively to another object', function() {
				const applied = Zarafa.core.Util.applyIfRecursive(origObj, extraObj);
				expect(applied.zarafa).not.toBe(extraObj.zarafa);
			});

		});

		/*
		 * Test flattening and exploding of objects
		 */
		describe('Flatten', function() {
			const origObj = { 
				'zarafa' : {
					'v1' : {
						'main' : {
							'week_start' : 1,
								'dialogs' : {
									'use_html_editor' : true
								}
						}
					},
					'v2' : {
						'main' : {
							'dialogs' : {
								'editor_type' : 1
							}
						}
					}
				}
			};

			it('can flatten a object hierarchy into a single key-value array', function() {
				const flattened = Zarafa.core.Util.flattenObject(origObj, '/');
				expect(flattened).toEqual({
					'zarafa/v1/main/week_start' : 1,
					'zarafa/v1/main/dialogs/use_html_editor' : true,
					'zarafa/v2/main/dialogs/editor_type' : 1
				});
			});
		});
	});
});
