/*
 * test the Search
 */
 describe('Search',function(){

 	/*
 	 * test for active state of search
 	 */
 	describe('activeSearch',function(){
 		it('tests that search is active (passing flags in number)',function(){
 			expect(Zarafa.core.mapi.Search.isSearchActive(1)).toBeTruthy();
 		});
 		
 		it('tests that search is active (passing flags in string)',function(){
 			expect(Zarafa.core.mapi.Search.isSearchActive('1')).toBeTruthy();
 		});
 		
 		it('tests that search is inactive (passing flags in number)',function(){
			expect(Zarafa.core.mapi.Search.isSearchActive(0)).not.toBeTruthy();
 		});
 		
 		it('tests that search is inactive (passing flags in string)',function(){
 			expect(Zarafa.core.mapi.Search.isSearchActive('')).not.toBeTruthy();
 		});
 	});
 	
 	/*
 	 * test for running state of search
 	 */
 	describe('runningSearch',function(){
 		it('tests that search is active (passing flags in number)',function(){
 			expect(Zarafa.core.mapi.Search.isSearchRunning(3)).toBeTruthy();
 		});
 		
 		it('tests that search is active (passing flags in string)',function(){
 			expect(Zarafa.core.mapi.Search.isSearchRunning('3')).toBeTruthy();
 		});
 		
 		it('tests that search is inactive with searchState = 2',function(){
 			expect(Zarafa.core.mapi.Search.isSearchRunning(2)).not.toBeTruthy();
 		});
 		
 		it('tests that search is inactive with searchState = 0',function(){
 			expect(Zarafa.core.mapi.Search.isSearchRunning(0)).not.toBeTruthy();
 		});
 		
 		it('tests that search is inactive with searchState = 1',function(){
 			expect(Zarafa.core.mapi.Search.isSearchRunning(1)).not.toBeTruthy();
 		});
 	});
 });
