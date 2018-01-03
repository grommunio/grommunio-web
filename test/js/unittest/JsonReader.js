/*
 * Test the Zarafa.core.data.JsonReader and deserialization of complex properties like
 * recipients, attachments etc.
*/

const hierarchyJSON = {
    "item": [
        {
            "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
            "props": {
                "display_name": "Inbox - John Doe",
                "subtree_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                "mdb_provider": "ca3d253c27d23c4494fe425fab958c19",
                "foldertype": "all",
                "mailbox_owner_name": "Test User",
                "object_type": 1,
                "store_support_mask": 344061,
                "common_view_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000001325534895B4CA5AC93F06388C00000000",
                "finder_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000001425534895B4CA5AC93F06388C00000000",
                "default_folder_inbox": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000425534895B4CA5AC93F06388C00000000",
                "default_folder_outbox": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000525534895B4CA5AC93F06388C00000000",
                "default_folder_sent": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000625534895B4CA5AC93F06388C00000000",
                "default_folder_wastebasket": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000725534895B4CA5AC93F06388C00000000",
                "default_folder_favorites": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000825534895B4CA5AC93F06388C00000000",
                "default_folder_calendar": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000325534895B4CA5AC93F06388C00000000",
                "default_folder_contact": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000925534895B4CA5AC93F06388C00000000",
                "default_folder_drafts": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000a25534895B4CA5AC93F06388C00000000",
                "default_folder_note": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000c25534895B4CA5AC93F06388C00000000",
                "default_folder_task": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000d25534895B4CA5AC93F06388C00000000",
                "default_folder_junk": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000e25534895B4CA5AC93F06388C00000000",
            },
            "folders": {
                "item": [
                    {
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000225534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "IPM_SUBTREE",
                            "object_type": 3,
                            "has_subfolder": true,
                            "container_class": "IPF.Note",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000325534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "Calendar",
                            "object_type": 3,
                            "has_subfolder": true,
                            "container_class": "IPF.Appointment",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000925534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "Contacts",
                            "object_type": 3,
                            "has_subfolder": true,
                            "container_class": "IPF.Contact",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000725534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "Deleted Items",
                            "object_type": 3,
                            "has_subfolder": true,
                            "container_class": "IPF.Note",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000425534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "Inbox",
                            "object_type": 3,
                            "has_subfolder": false,
                            "container_class": "IPF.Note",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000a25534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "Drafts",
                            "object_type": 3,
                            "has_subfolder": false,
                            "container_class": "IPF.Note",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000e25534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "Junk E-mail",
                            "object_type": 3,
                            "has_subfolder": false,
                            "container_class": "IPF.Note",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000c25534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "Notes",
                            "object_type": 3,
                            "has_subfolder": false,
                            "container_class": "IPF.StickyNote",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000d25534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "Tasks",
                            "object_type": 3,
                            "has_subfolder": false,
                            "container_class": "IPF.Task",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000525534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "Outbox",
                            "object_type": 3,
                            "has_subfolder": false,
                            "container_class": "IPF.Note",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000625534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "Sent Items",
                            "object_type": 3,
                            "has_subfolder": false,
                            "container_class": "IPF.Note",
                            "access": 63,
                            "rights": 1531
                        }
                    },{
                        "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000001325534895B4CA5AC93F06388C00000000",
                        "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000225534895B4CA5AC93F06388C00000000",
                        "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
                        "props": {
                            "display_name": "IPM_COMMON_VIEWS",
                            "object_type": 3,
                            "has_subfolder": false,
                            "container_class": "IPF.Note",
                            "access": 63,
                            "rights": 1531,
                        }
                    }
                ]
            },
            "favorites": {
                "item": []
            }
        }
    ]
};

describe('JsonReader', function() {

	/*
	 * Test if JsonReader can deserialize IPM.StickyNote data which has no sub stores.
	 */
	describe('No SubStores', function() {
		// use delegates data because it doesn't support substores
		const jsonData = {
      'item' : [{
        'entryid': '00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000001EID',
        'props': {
          'display_name' : 'John Doe',
          'can_see_private' : false,
          'has_meeting_rule' : false,
          'rights_calendar' : Zarafa.core.mapi.Rights.RIGHTS_NONE,
          'rights_tasks' : Zarafa.core.mapi.Rights.RIGHTS_NONE,
          'rights_inbox' : Zarafa.core.mapi.Rights.RIGHTS_SECRETARY,
          'rights_contacts' : Zarafa.core.mapi.Rights.RIGHTS_SECRETARY,
          'rights_notes' : Zarafa.core.mapi.Rights.RIGHTS_NONE,
          'rights_journal' : Zarafa.core.mapi.Rights.RIGHTS_NONE
        }
      },{
        'entryid': '00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000002EID',
        'props': {
          'display_name' : 'Jane Doe',
          'can_see_private' : true,
          'has_meeting_rule' : true,
          'rights_calendar' : Zarafa.core.mapi.Rights.RIGHTS_SECRETARY,
          'rights_tasks' : Zarafa.core.mapi.Rights.RIGHTS_READONLY,
          'rights_inbox' : Zarafa.core.mapi.Rights.RIGHTS_FULL_CONTROL,
          'rights_contacts' : Zarafa.core.mapi.Rights.RIGHTS_OWNER,
          'rights_notes' : Zarafa.core.mapi.Rights.RIGHTS_NO_RIGHTS,
          'rights_journal' : Zarafa.core.mapi.Rights.RIGHTS_NONE
        }
      }]
    };
		var jsonReader;

		beforeEach(function() {
			jsonReader = new Zarafa.core.data.JsonReader();
		});

		it('can deserialize data', function() {
			const deserializeDataFn = function() {
				jsonReader.readRecords(jsonData);
			};

			expect(deserializeDataFn).not.toThrow();
		});

		it('creates the correct amount of records when deserializing data', function() {
			const response = jsonReader.readRecords(jsonData);
			expect(response.totalRecords).toEqual(2);
			expect(response.records.length).toEqual(2);
		});

		it('can return \'undefined\' when record doesn\'t have attachments/recipients store', function() {
			const record = jsonReader.readRecords(jsonData).records[0];
			expect(record.getSubStore('recipients')).toBeUndefined();
			expect(record.getSubStore('attachments')).toBeUndefined();
		});

		it('can return \'undefined\' when accessing complex data using record.get', function() {
			const record = jsonReader.readRecords(jsonData).records[0];
			expect(record.get('recipients')).toBeUndefined();
			expect(record.get('attachments')).toBeUndefined();
			expect(record.get('members')).toBeUndefined();
		});
	});

	/*
	 * Test if JsonReader can deserialize IPM data which has recipient and attachment sub stores.
	 */
	describe('SubStores', function() {
		var jsonReader;
		const jsonData = {
		    "item": [
			{
			    "entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000006425534895B4CA5AC93F06388C00000000",
			    "parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000006525534895B4CA5AC93F06388C00000000",
			    "store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000006653914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
			    "props": {
				"message_class": "IPM",
				"subject": "a",
				"normalized_subject": "a",
				"body": "b",
				"sent_representing_entryid": "00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000001EID",
				"sent_representing_name": "jane",
				"sent_representing_email_address": "jane@kopano.local",
				"sent_representing_address_type": "ZARAFA",
				"isHTML": false
			    },
			    "recipients": {
				"item": [
				    {
					"rowid": 0,
					"props": {
					    "display_name": "John Doe",
					    "email_address": "john",
					    "smtp_address": "john@kopano.local",
					    "address_type": "ZARAFA",
					    "object_type": 6,
					    "recipient_type": 1,
					    "entryid": "00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000003EID",
					    "proposednewtime": false,
					    "recipient_trackstatus": 0,
					    "recipient_trackstatus_time": 1503665369.299
					}
				    },
				    {
					"rowid": 1,
					"props": {
					    "display_name": "Jane Doe",
					    "email_address": "jane",
					    "smtp_address": "jane@kopano.local",
					    "address_type": "ZARAFA",
					    "object_type": 6,
					    "recipient_type": 2,
					    "entryid": "00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000004EID",
					    "proposednewtime": false,
					    "recipient_trackstatus": 0,
					    "recipient_trackstatus_time": 1503665369.299
					}
				    }
				]
			    },
			    "attachments": {
				"item": [
				    {
					"attach_num": 0,
					"props": {
					    "attach_method": 1,
					    "size": 2470288,
					    "filetype": "application/pdf",
					    "hidden": false,
					    "name": "ECMA-262.pdf"
					}
				    }
				]
			    }
			}
		    ]
		};

		beforeEach(function() {
			jsonReader = new Zarafa.core.data.JsonReader();
		});

		it('can deserialize data', function() {
			const deserializeDataFn = function() {
				jsonReader.readRecords(jsonData);
			};

			expect(deserializeDataFn).not.toThrow();
		});

		it('creates the correct amount of records when deserializing data', function() {
			const response = jsonReader.readRecords(jsonData);
			expect(response.totalRecords).toEqual(1);
			expect(response.records.length).toEqual(1);
		});

		it('can return sub stores for attachment/recipient', function() {
			const record = jsonReader.readRecords(jsonData).records[0];
			expect(record.getSubStore('recipients')).toEqual(jasmine.any(Zarafa.core.data.IPMRecipientStore));
			expect(record.getSubStore('attachments')).toEqual(jasmine.any(Zarafa.core.data.IPMAttachmentStore));
		});

		it('can return \'undefined\' when accessing complex data using record.get', function() {
			const record = jsonReader.readRecords(jsonData).records[0];
			expect(record.get('recipients')).toBeUndefined();
			expect(record.get('attachments')).toBeUndefined();
			expect(record.get('members')).toBeUndefined();
		});

		it('can load data properly in sub stores', function() {
			const record = jsonReader.readRecords(jsonData).records[0];
			expect(record.getSubStore('recipients').getCount()).toEqual(2);
			expect(record.getSubStore('attachments').getCount()).toEqual(1);
		});

		it('can apply default values to attachment properties', function() {
			const record = jsonReader.readRecords(jsonData).records[0];
			expect(record.getSubStore('attachments').getAt(0).get('hidden')).toBeFalsy();
		});
	});

	/*
	 * Test if JsonReader can deserialize hierarchy data properly.
	 */
	describe('Hierarchy', function() {
		var jsonReader;

		beforeEach(function() {
			jsonReader = new Zarafa.core.data.JsonReader({
				id : 'store_entryid',
				idProperty : 'store_entryid'
			});
		});

		it('can deserialize data', function() {
			const deserializeDataFn = function() {
				jsonReader.readRecords(hierarchyJSON);
			};

			expect(deserializeDataFn).not.toThrow();
		});

		it('creates the correct amount of records when deserializing data', function() {
			const response = jsonReader.readRecords(hierarchyJSON);
			expect(response.totalRecords).toEqual(1);
			expect(response.records.length).toEqual(1);
		});

		it('can return sub stores for folder', function() {
			const record = jsonReader.readRecords(hierarchyJSON).records[0];
			expect(record.getFolderStore()).toEqual(jasmine.any(Zarafa.hierarchy.data.IPFSubStore));
		});

		it('can return \'undefined\' when accessing complex data using record.get', function() {
			const record = jsonReader.readRecords(hierarchyJSON).records[0];
			expect(record.get('folders')).toBeUndefined();
		});

		it('can load data properly in sub stores', function() {
			const expectedCount = hierarchyJSON.item[0].folders.item.length;
			const record = jsonReader.readRecords(hierarchyJSON).records[0];
			expect(record.getFolderStore().getCount()).toEqual(expectedCount);
		});
	});

	/*
	 * Test if the Types inside the Data is preserved or correctly converted from Json
	 * (timestamps become Dates, Numbers become Numbers, etc...).
	 */
	describe('Types', function() {
		var jsonReader;
		const jsonData = {
			'item' : [{
				'entryid': '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000',
				'parent_entryid': '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000',
				'store_entryid': '0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000',
				'props': {
					'message_class': 'IPM.StickyNote',
					'icon_index': '5',
					'subject': 'aaaaa',
					'body': 'bbbbb',
					'creation_time' : new Date().getTime() / 1000
				}
			}]
		};

		beforeEach(function() {
			jsonReader = new Zarafa.core.data.JsonReader();
		});

		it('can convert a timestamp into a Data object during deserialization', function() {
			const record = jsonReader.readRecords(jsonData).records[0];
			expect(record.get('creation_time')).toEqual(jasmine.any(Date));
		});

		it('can convert a number string into Number during deserialization', function() {
			const record = jsonReader.readRecords(jsonData).records[0];
			expect(record.get('icon_index')).toEqual(5);
		});

		it('can apply default values from the Record Field definitions if the data was not provided from the server', function() {
			const record = jsonReader.readRecords(jsonData).records[0];
			expect(record.get('message_flags')).toEqual(Zarafa.core.mapi.MessageFlags.MSGFLAG_READ | Zarafa.core.mapi.MessageFlags.MSGFLAG_UNSENT);
		});
	});
});
