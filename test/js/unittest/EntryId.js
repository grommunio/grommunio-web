/*
 * Test the Zarafa.core.EntryId
 */
describe('EntryId', function() {
	const fldEntryId1 = '000000001A2BB1DF088E453CB94B73D67E0BAB100100000003000000CB0942D278F2427E92A144FD14A49E9A00000000';	// calendar
	const fldEntryId2 = '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000004FF7D3A825534895B4CA5AC93F06388C00000000';	// contact
	// entryid of favourite folder
	const fldEntryId3 = '00000001434D3D38F4414020A03B93FB33FCB5D20100000003000000B963619E6AC6408CA540FEED858719BC00000000';
	// same folder but from original location
	const fldEntryId4 = '00000000434D3D38F4414020A03B93FB33FCB5D20100000003000000B963619E6AC6408CA540FEED858719BC00000000';
	// entryid of Favorites folder
	const fldEntryId5 = '00000000CC4AB09973954587A150637E0F30515901000000030000000000000000000000000000000000000200000000';
	// entryid of ipm_subtree of public store
	const fldEntryId6 = '00000000CC4AB09973954587A150637E0F30515901000000030000000000000000000000000000000000000100000000';
	// entryid of root folder of public store
	const fldEntryId7 = '00000000CC4AB09973954587A150637E0F30515901000000030000000000000000000000000000000000000300000000';

	// psuedo url as server name
	const strEntryId1 = '0000000038a1bb1005e5101aa1bb08002b2a56c200007a617261666136636c69656e742e646c6c000000000009744defbbcf4305a3e90425083491080100000001000000231e8f3353914e6fbe75a7df49f9a4a870736575646f3a2f2f5a617261666100';
	// socket url as server name
	const strEntryId2 = '0000000038a1bb1005e5101aa1bb08002b2a56c200007a617261666136636c69656e742e646c6c000000000009744defbbcf4305a3e90425083491080100000001000000231e8f3353914e6fbe75a7df49f9a4a866696c653a2f2f2f7661722f72756e2f7a617261666100';
	const strEntryId3 = '0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB100100000001000000A9591000F7CC4438BB66A5C355DD8D5670736575646F3A2F2F5A617261666100';

	const msgEntryId1 = '0000000009744DEFBBCF4305A3E904250834910801000000050000007A483717159548D3A5BA63B743BEED9500000000';
	const msgEntryId2 = '0000000009744defbbcf4305a3e9042508349108010000000500000003cf8977e8cd48529088946e312983d400000000';

	// Addressbook entryid
	const abEntryId1 = '00000000AC21A95040D3EE48B319FBA7533044250100000006000000390400004D6A41334D5449774E7A453D00000000';
	const abEntryId2 = '00000000AC21A95040D3EE48B319FBA7533044250100000006000000C90300004D6A41334D5449774E7A453D00000000';
	const abEntryId3 = '00000000AC21A95040D3EE48B319FBA7533044250100000006000000C90400004D6B41334D5449774E7A453D00000000';
	// Addressbook OneOff entryid
	const abEntryId4 = '00000000812B1FA4BEA310199D6E00DD010F54020000018041006E006400720065006100730020005200F60073006C0065007200000053004D0054005000000061002E0072006F00650073006C006500720040007A00610072006100660061007300650072007600650072002E00640065000000';
	// Addressbook global addressbook container entryid
	const abEntryId6 = '00000000AC21A95040D3EE48B319FBA75330442500000000040000000100000000000000';

	/*
	 * Test that store entryids can be parsed properly
	 */
	describe('Parse Store EntryIds', function() {
		it('can parse store entryid properly', function() {
			expect(function() {Zarafa.core.EntryId.createStoreEntryIdObj(strEntryId1); }).not.toThrow();
			expect(function() {Zarafa.core.EntryId.createStoreEntryIdObj(strEntryId2); }).not.toThrow();
			expect(function() {Zarafa.core.EntryId.createStoreEntryIdObj(strEntryId3); }).not.toThrow();
		});

		it('can create proper structure for different entryid parts', function() {
			const strEntryIdObj = Zarafa.core.EntryId.createStoreEntryIdObj(strEntryId1);

			expect(strEntryIdObj.unWrappedEntryId.name).toEqual('EID');
			expect(strEntryIdObj.unWrappedEntryId.abFlags).toEqual('00000000');
			expect(strEntryIdObj.unWrappedEntryId.guid).toEqual('09744DEFBBCF4305A3E9042508349108');
			expect(strEntryIdObj.unWrappedEntryId.version).toEqual('01000000');
			expect(strEntryIdObj.unWrappedEntryId.type).toEqual('01000000');
			expect(strEntryIdObj.unWrappedEntryId.uniqueId).toEqual('231E8F3353914E6FBE75A7DF49F9A4A8');
			expect(strEntryIdObj.unWrappedEntryId.server).toEqual('70736575646F3A2F2F5A6172616661');
			expect(strEntryIdObj.unWrappedEntryId.padding).toEqual('00');
		});
	});

	/*
	 * Test that store entryids can be compared properly with different server name
	 */
	describe('Compare Store EntryIds', function() {
		it('can compare two store entryids with different server name of same store', function() {
			expect(Zarafa.core.EntryId.compareStoreEntryIds(strEntryId1, strEntryId2)).toBeTruthy();
		});

		it('can compare two store entryids of two different stores', function() {
			expect(Zarafa.core.EntryId.compareStoreEntryIds(strEntryId2, strEntryId3)).toBeFalsy();
			expect(Zarafa.core.EntryId.compareStoreEntryIds(strEntryId1, strEntryId3)).toBeFalsy();
		});
	});

	/*
	 * Test that folder entryids can be parsed properly
	 */
	describe('Parse Folder EntryIds', function() {
		it('can parse folder entryid properly', function() {
			expect(function() {Zarafa.core.EntryId.createEntryIdObj(fldEntryId1); }).not.toThrow();
			expect(function() {Zarafa.core.EntryId.createEntryIdObj(fldEntryId2); }).not.toThrow();
			expect(function() {Zarafa.core.EntryId.createEntryIdObj(fldEntryId3); }).not.toThrow();
			expect(function() {Zarafa.core.EntryId.createEntryIdObj(fldEntryId4); }).not.toThrow();
		});

		it('can create proper structure for different entryid parts for normal folder', function() {
			const fldEntryIdObj = Zarafa.core.EntryId.createEntryIdObj(fldEntryId4);

			expect(fldEntryIdObj.name).toEqual('EID');
			expect(fldEntryIdObj.abFlags).toEqual('00000000');
			expect(fldEntryIdObj.guid).toEqual('434D3D38F4414020A03B93FB33FCB5D2');
			expect(fldEntryIdObj.version).toEqual('01000000');
			expect(fldEntryIdObj.type).toEqual('03000000');
			expect(fldEntryIdObj.uniqueId).toEqual('B963619E6AC6408CA540FEED858719BC');
			expect(fldEntryIdObj.server).toEqual('');
			expect(fldEntryIdObj.padding).toEqual('00000000');
		});

		it('can create proper structure for different entryid parts for favorite folder', function() {
			const fldEntryIdObj = Zarafa.core.EntryId.createEntryIdObj(fldEntryId3);

			expect(fldEntryIdObj.name).toEqual('EID');
			expect(fldEntryIdObj.abFlags).toEqual('00000001');	// abFlags[3] contains 0x01
			expect(fldEntryIdObj.guid).toEqual('434D3D38F4414020A03B93FB33FCB5D2');
			expect(fldEntryIdObj.version).toEqual('01000000');
			expect(fldEntryIdObj.type).toEqual('03000000');
			expect(fldEntryIdObj.uniqueId).toEqual('B963619E6AC6408CA540FEED858719BC');
			expect(fldEntryIdObj.server).toEqual('');
			expect(fldEntryIdObj.padding).toEqual('00000000');
		});
	});

	/*
	 * Test that folder entryids can be compared properly
	 */
	describe('Compare Folder EntryIds', function() {
		it('can compare two folder entryids of same folder', function() {
			expect(Zarafa.core.EntryId.compareEntryIds(fldEntryId1, fldEntryId1)).toBeTruthy();
		});

		it('can compare two folder entryids of two different folders', function() {
			expect(Zarafa.core.EntryId.compareEntryIds(fldEntryId1, fldEntryId2)).toBeFalsy();
		});

		it('can compare two folder entryids of one original folder and one from favorite folder', function() {
			expect(Zarafa.core.EntryId.compareEntryIds(fldEntryId3, fldEntryId4)).toBeFalsy();
		});
	});

	/*
	 * Test that folder entryids can be compared properly
	 */
	describe('Favorite Folder', function() {
		it('can check if the folder is a favorite folder', function() {
			expect(Zarafa.core.EntryId.isFavoriteFolder(fldEntryId3)).toBeTruthy();
		});

		it('can check if the folder is not a favorite folder', function() {
			expect(Zarafa.core.EntryId.isFavoriteFolder(fldEntryId4)).toBeFalsy();
		});
	});

	/*
	 * Test that AddressBook entryids can be parsed properly
	 */
	describe('Parse AddressBook EntryIds', function() {
		it('can parse addressbook entryid properly', function() {
			expect(function() {Zarafa.core.EntryId.createABEntryIdObj(abEntryId1); }).not.toThrow();
			expect(function() {Zarafa.core.EntryId.createABEntryIdObj(abEntryId4); }).not.toThrow();
		});

		it('can create proper structure for different entryid parts for addressbook user', function() {
			const abEntryIdObj = Zarafa.core.EntryId.createABEntryIdObj(abEntryId1);

			expect(abEntryIdObj.name).toEqual('ABEID');
			expect(abEntryIdObj.abFlags).toEqual('00000000');
			expect(abEntryIdObj.guid).toEqual('AC21A95040D3EE48B319FBA753304425');
			expect(abEntryIdObj.version).toEqual('01000000');
			expect(abEntryIdObj.type).toEqual('06000000');
			expect(abEntryIdObj.id).toEqual('39040000');
			expect(abEntryIdObj.extid).toEqual('4D6A41334D5449774E7A453D');
			expect(abEntryIdObj.padding).toEqual('00000000');
		});
	});

	/*
	 * Test that OneOff entryids are correctly recognized
	 */
	describe('OneOff Entryids', function() {
		it('can check if an entryid is an OneOff entryid', function() {
			expect(Zarafa.core.EntryId.isOneOffEntryId(abEntryId4)).toBeTruthy();
		});

		it('can check if an entryid is not an OneOff entryid', function() {
			expect(Zarafa.core.EntryId.isOneOffEntryId(abEntryId1)).toBeFalsy();
		});
	});

	/*
	 * Test that addressbook entryids can be correctly compared
	 */
	describe('AddressBook Entryids', function() {
		it('can compare two equal addressbook entryids', function() {
			expect(Zarafa.core.EntryId.compareABEntryIds(abEntryId1, abEntryId1)).toBeTruthy();
		});

		it('can compare two different addressbook entryids of the same users', function() {
			expect(Zarafa.core.EntryId.compareABEntryIds(abEntryId1, abEntryId2)).toBeTruthy();
		});

		it('can compare two addressbook entryids of two different users', function() {
			expect(Zarafa.core.EntryId.compareABEntryIds(abEntryId1, abEntryId3)).toBeFalsy();
		});

		it('can check if an entryid is of global addressbook', function() {
			expect(Zarafa.core.EntryId.hasAddressBookGUID(abEntryId1)).toBeTruthy();
		});

		it('can check if an entryid is not of global addressbook', function() {
			expect(Zarafa.core.EntryId.hasAddressBookGUID(msgEntryId1)).toBeFalsy();
		});

		it('can check if an entryid is of global addressbook container folder', function() {
			expect(Zarafa.core.EntryId.isGlobalAddressbookContainer(abEntryId6)).toBeTruthy();
		});

		it('can check if an entryid is not of global addressbook container folder', function() {
			expect(Zarafa.core.EntryId.isGlobalAddressbookContainer(abEntryId1)).toBeFalsy();
		});
	});

	/*
	 * Test that public store entryids match with the static guids
	 */
	describe('Public Folders', function() {
		it('can check if the folder is root favorite folder or not', function() {
			expect(Zarafa.core.EntryId.isFavoriteRootFolder(fldEntryId5)).toBeTruthy();
		});

		it('can check if the folder is ipm_subtree of public store', function() {
			expect(Zarafa.core.EntryId.isPublicSubtreeFolder(fldEntryId6)).toBeTruthy();
		});

		it('can check if the folder is root folder of public store', function() {
			expect(Zarafa.core.EntryId.isPublicRootFolder(fldEntryId7)).toBeTruthy();
		});
	});

	/*
	 * Test that message entryids can be parsed properly
	 */
	describe('Parse Message EntryIds', function() {
		it('can parse message entryid properly', function() {
			expect(function() {Zarafa.core.EntryId.createEntryIdObj(msgEntryId1); }).not.toThrow();
			expect(function() {Zarafa.core.EntryId.createEntryIdObj(msgEntryId2); }).not.toThrow();
		});

		it('can create proper structure for different entryid parts for message', function() {
			const msgEntryIdObj = Zarafa.core.EntryId.createEntryIdObj(msgEntryId1);

			expect(msgEntryIdObj.name).toEqual('EID');
			expect(msgEntryIdObj.abFlags).toEqual('00000000');
			expect(msgEntryIdObj.guid).toEqual('09744DEFBBCF4305A3E9042508349108');
			expect(msgEntryIdObj.version).toEqual('01000000');
			expect(msgEntryIdObj.type).toEqual('05000000');
			expect(msgEntryIdObj.uniqueId).toEqual('7A483717159548D3A5BA63B743BEED95');
			expect(msgEntryIdObj.server).toEqual('');
			expect(msgEntryIdObj.padding).toEqual('00000000');
		});
	});

	/*
	 * Test that message entryids can be compared properly
	 */
	describe('Compare Message EntryIds', function() {
		it('can compare two message entryids of same message', function() {
			expect(Zarafa.core.EntryId.compareEntryIds(msgEntryId1, msgEntryId1)).toBeTruthy();
		});

		it('can compare two message entryids of two different messages', function() {
			expect(Zarafa.core.EntryId.compareEntryIds(msgEntryId1, msgEntryId2)).toBeFalsy();
		});
	});
});
