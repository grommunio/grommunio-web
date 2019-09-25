/*
 * Test the Zarafa.common.ui.messagepanel.AttachmentLinks component.
 */
describe('AttachmentLinks', function() {
    var component;
    var store;
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
        store = mailRecord.getSubStore('attachments');

        component = new Zarafa.common.ui.messagepanel.AttachmentLinks();
    });

    afterEach(function() {
        component.destroy();
    });

	/*
	 * Test if all boxes are rendered correctly for all attachments
	 */
	describe('Render attachment links', function() {
		describe('No Data', function() {
			it('should render attachment links without any attachment correctly', function() {
				const doAction = function() {
					component.render(Ext.getBody());
					component.setRecord(mailRecord);
				};

				expect(doAction).not.toThrow();
			});

			it('should render no attachment link when no attachment record is present in store', function() {
				component.render(Ext.getBody());
				component.setRecord(mailRecord);

				expect(Ext.isEmpty(component.getNodes())).toEqual(true);
			});
		});

		describe('Normal Data', function() {
			var record1;
			var record2;

			beforeEach(function() {
				record1 = createAttach(0);
				record2 = createAttach(1);

				// add attachments having normal data
				store.add(record1);
				store.add(record2);
			});

			it('should render attachment links without any errors', function() {
				const doAction = function() {
					component.render(Ext.getBody());
					component.setRecord(mailRecord);
				};

				expect(doAction).not.toThrow();
			});

			it('should render all attachments as attachment links correctly', function() {
				component.render(Ext.getBody());
				component.setRecord(mailRecord);

				expect(component.getNodes().length).toEqual(store.getCount());
			});

			it('should have attachment link for every attachment record', function() {
				component.render(Ext.getBody());
				component.setRecord(mailRecord);

				expect(component.getNode(record1)).toEqual(jasmine.any(HTMLElement));
				expect(component.getNode(record2)).toEqual(jasmine.any(HTMLElement));
			});

			it('should not render attachment link for hidden attachment', function() {
				store.add(createAttach(2));

				component.render(Ext.getBody());
				component.setRecord(mailRecord);

				expect(component.getNodes().length).toEqual(store.getCount() - 1);
			});
		});

		describe('Empty Data', function() {
			var record;

			beforeEach(function() {
				record = createAttach(3);

				// add attachments having empty data
				store.add(record);
			});

			it('should render attachment links without any errors', function() {
				const doAction = function() {
					component.render(Ext.getBody());
					component.setRecord(mailRecord);
				};

				expect(doAction).not.toThrow();
			});

			it('should render all attachments as attachment link correctly', function() {
				component.render(Ext.getBody());
				component.setRecord(mailRecord);

				expect(component.getNodes().length).toEqual(store.getCount());
			});

			it('should have attachment box for every attachment record', function() {
				component.render(Ext.getBody());
				component.setRecord(mailRecord);

				expect(component.getNode(record)).toEqual(jasmine.any(HTMLElement));
			});
		})		
        
        describe('HTML Injected Data', function() {
			var record1;
			var record2;

			beforeEach(function() {
				record1 = createAttach(0, true);
				record2 = createAttach(1, true);

				// add attachments having html injected data
				store.add(record1);
				store.add(record2);
			});

			it('should render attachment links without any errors', function() {
				const doAction = function() {
					component.render(Ext.getBody());
					component.setRecord(mailRecord);
				};

				expect(doAction).not.toThrow();
			});

			it('should render all attachments as attachment link correctly', function() {
				component.render(Ext.getBody());
				component.setRecord(mailRecord);

				expect(component.getNodes().length).toEqual(store.getCount());
			});

			it('should have attachment link for every attachment record', function() {
				component.render(Ext.getBody());
				component.setRecord(mailRecord);

				expect(component.getNode(record1)).toEqual(jasmine.any(HTMLElement));
				expect(component.getNode(record2)).toEqual(jasmine.any(HTMLElement));
			});

			it('should not render attachment link for hidden attachment', function() {
				const record3 = createAttach(2, true);
				store.add(record3);

				component.render(Ext.getBody());
				component.setRecord(mailRecord);

				expect(component.getNodes().length).toEqual(store.getCount() - 1);
				expect(component.getNode(record3)).toBeUndefined();
			});

			it('should not allow html injection from the attachment record', function() {
				component.render(Ext.getBody());
				component.setRecord(mailRecord);

				expect(Ext.isEmpty(Ext.DomQuery.select('div.test-code-injection'))).toEqual(true);
			});
		});
    });
});
