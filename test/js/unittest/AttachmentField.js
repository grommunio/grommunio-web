/*
 * Test the Zarafa.common.ui.messagepanel.AttachmentField component.
 */
describe('AttachmentField', function() {
    var field;
    var boxStore;
    var mailRecord;
    const data = {
        'entryid': '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000006425534895B4CA5AC93F06388C00000000',
        'object_type' : Zarafa.core.mapi.ObjectType.MAPI_MESSAGE,
        'message_class': 'IPM.Note',
        'has_attach': true
    };
    // XXX: move to helpers
    const createAttach = function(id, inject) {
        const defaults = [{
            // normal record
            'attach_method': Zarafa.core.mapi.AttachMethod.ATTACH_BY_VALUE,
            'attach_num': 0,
            'size': 2470288,
            'filetype': 'application/pdf',
            'hidden': false,
            'name': 'ECMA-262.pdf'
        }, {
            // embedded attachment
            'attach_method': Zarafa.core.mapi.AttachMethod.ATTACH_EMBEDDED_MSG,
            'attach_num' : 1,
            'size': 2470288,
            'name': 'message',
            'hidden': false,
            'attach_message_class' : 'IPM.Note'
        }, {
            // hidden attachment
            'attach_method': Zarafa.core.mapi.AttachMethod.ATTACH_BY_VALUE,
            'attach_num' : 2,
            'size': 2470288,
            'name': 'inline.txt',
            'hidden': true
        }, {
            // empty
        }];

        const option = defaults[id];
        if (inject) {
            for (const key in option) {
                if (typeof option[key] === "string") {
                    option[key] = '<div class="test-code-injection">' + option[key] + '</div>';
                }
            }
        }

        return Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH, option);
    };

    beforeEach(function() {
       container = new Zarafa.core.Container();
       container.setUser({'fullname': 'henk'});

        // create a store and mail record which will contain all attachments
        mailRecord = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', data);
        boxStore = mailRecord.getSubStore('attachments');

		field = new Zarafa.common.attachment.ui.AttachmentField({
			boxStore : boxStore
		});
    });

    afterEach(function() {
        field.destroy();
    });

	/*
	 * Test if all boxes are rendered correctly for all attachments
	 */
	describe('Render attachments', function() {
		describe('No Data', function() {
			it('should render attachment field without any attachment correctly', function() {
				var doAction = function() {
					field.render(Ext.getBody());
				};

				expect(doAction).not.toThrow();
			});

			it('should render no attachment box when no attachment record is present in store', function() {
				field.render(Ext.getBody());
				expect(field.items.getCount()).toEqual(boxStore.getCount());
			});
		});

		describe('Normal Data', function() {
			var record1;
			var record2;

			beforeEach(function() {
				record1 = createAttach(0);
				record2 = createAttach(1);

				// add attachments having normal data
				boxStore.add(record1);
				boxStore.add(record2);
			});

			it('should render attachment field without any errors', function() {
				var doAction = function() {
					field.render(Ext.getBody());
				};

				expect(doAction).not.toThrow();
			});

			it('should render all attachments as attachment box correctly', function() {
				field.render(Ext.getBody());

				expect(field.items.getCount()).toEqual(boxStore.getCount());
			});

			it('should have attachment box for every attachment record', function() {
				field.render(Ext.getBody());

				expect(field.getBoxForRecord(record1)).toEqual(jasmine.any(Zarafa.common.attachment.ui.AttachmentBox));
				expect(field.getBoxForRecord(record2)).toEqual(jasmine.any(Zarafa.common.attachment.ui.AttachmentBox));
			});

			it('should not render attachment box for hidden attachment', function() {
                boxStore.add(createAttach(2));

				field.render(Ext.getBody());

				expect(field.items.getCount()).toEqual(boxStore.getCount() - 1);
			});
		});

		describe('Empty Data', function() {
			var record;

			beforeEach(function() {
				record = createAttach(0);

				// add attachments having empty data
				boxStore.add(record);
			});

			it('should render attachment field without any errors', function() {
				var doAction = function() {
					field.render(Ext.getBody());
				};

				expect(doAction).not.toThrow();
			});

			it('should render all attachments as attachment box correctly', function() {
				field.render(Ext.getBody());

				expect(field.items.getCount()).toEqual(boxStore.getCount());
			});

			it('should have attachment box for every attachment record', function() {
				field.render(Ext.getBody());
				expect(field.getBoxForRecord(record)).toEqual(jasmine.any(Zarafa.common.attachment.ui.AttachmentBox));
			});
		});

		describe('HTML Injected Data', function() {
			var record1;
			var record2;

			beforeEach(function() {
				record1 = createAttach(0);
				record2 = createAttach(1);

				// add attachments having html injected data
				boxStore.add(record1, true);
				boxStore.add(record2, true);
			});

			it('should render attachment field without any errors', function() {
				var doAction = function() {
					field.render(Ext.getBody());
				};

				expect(doAction).not.toThrow();
			});

			it('should render all attachments as attachment box correctly', function() {
				field.render(Ext.getBody());

				expect(field.items.getCount()).toEqual(boxStore.getCount());
			});

			it('should have attachment box for every attachment record', function() {
				field.render(Ext.getBody());

				expect(field.getBoxForRecord(record1)).toEqual(jasmine.any(Zarafa.common.attachment.ui.AttachmentBox));
				expect(field.getBoxForRecord(record2)).toEqual(jasmine.any(Zarafa.common.attachment.ui.AttachmentBox));
			});

			it('should not render attachment box for hidden attachment', function() {
				var record3 = createAttach(2, true);
				boxStore.add(record3);

				field.render(Ext.getBody());

				expect(field.items.getCount()).toEqual(boxStore.getCount() - 1);
				expect(field.getBoxForRecord(record3)).toBeNull();
			});

			it('should not allow html injection from the attachment record', function() {
				field.render(Ext.getBody());

				expect(Ext.isEmpty(Ext.DomQuery.select('div.test-code-injection'))).toEqual(true);	
			});
		});
	});
});
