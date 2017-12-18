describe('Extra information links', function() {
	var links;
	const faultyData = {
		body: "b",
		entryid: "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000",
		isHTML: false,
		message_class: "IPM",
		object_type: Zarafa.core.mapi.ObjectType.MAPI_MESSAGE
	};
	const normalData = Ext.apply({}, faultyData);
	normalData['message_class'] = 'IPM.Note';

	const clickConfirmationButton = function(dialog, btn) {
		for (var i = 0; i < dialog.buttons.length; i++) {
			var button = dialog.buttons[i];
			if (button.text === btn) {
				button.handler.call(button.scope || button, button);
				return;
			}
		}
	};	
	container = new Zarafa.core.Container();

	beforeEach(function() {
		links = new Zarafa.common.ui.messagepanel.ExtraInfoLinks({renderTo: Ext.getBody()});
	});

	afterEach(function() {
		links.destroy();
	});
	
	describe('Corrupt message warning', function() {
		describe('Faulty record', function() {
			var extraInfoEl;
			const faultyRecord = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass(faultyData.message_class, faultyData, 1);
			// Fake it till we make it.
			faultyRecord.save = function() {};

			beforeEach(function() {
				links.update(faultyRecord);
				extraInfoEl = Ext.query('div.preview-header-extrainfobox-item');
			});

			it('should show information about corrupt record', function() {
				expect(Ext.isEmpty(extraInfoEl)).toBeFalsy();
				expect(extraInfoEl[0].textContent).toEqual('This message is corrupt and will not be displayed correctly, Click here to fix it.');
			});

			it('should open dialog for user confirmation when extra information is clicked', function() {
				extraInfoEl[0].click();
				const msgBox = Ext.MessageBox.getDialog();
				expect(msgBox).toEqual(jasmine.any(Ext.Window));

				const msg = Ext.query('div.ext-mb-content', Ext.getDom(msgBox.body))[0];
				expect(msg.textContent).toEqual('We are going to try to fix a corrupted mail message, do you wish to continue?');
			});

			it('should not call handler function to fix faulty message when extra information is clicked', function(done) {
				spyOn(faultyRecord, 'fixFaultyMessage');
				extraInfoEl[0].click();

				// Get message box dialog
				const msgBox = Ext.MessageBox.getDialog();
				clickConfirmationButton(msgBox, 'No');
				done();
				expect(faultyRecord.fixFaultyMessage).not.toHaveBeenCalled();
			});

			xit('should call handler function to fix faulty message when extra information is clicked', function(done) {
				spyOn(faultyRecord, 'fixFaultyMessage');
				extraInfoEl[0].click();

				// Get message box dialog
				const msgBox = Ext.MessageBox.getDialog();
				clickConfirmationButton(msgBox, 'Yes');
				done();
				expect(faultyRecord.fixFaultyMessage).toHaveBeenCalled();
			});
		});
  });

  describe('Normal record', function() {

    it('should not shown information about corrupt record', function() {
      const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', normalData, 1);
      links.update(record);
      const extraInfoEl = Ext.query('div.preview-header-extrainfobox-item');
      expect(Ext.isEmpty(extraInfoEl)).toBeTruthy();
    });

    it('should show forward information when message is forwarded', function() {
      const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', normalData, 1);
      const date = new Date();
      record.set('last_verb_executed', 104);
      record.set('last_verb_execution_time', date);
      links.update(record);

      const extraInfoEl = Ext.query('div.preview-header-extrainfobox-item');
      expect(Ext.isEmpty(extraInfoEl)).toBeFalsy();
      expect(extraInfoEl[0].textContent).toContain('You forwarded this message on ' + date.format('j-m-Y H:i'));
    });

    it('should show reply information when message is a reply (102)', function() {
      const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', normalData, 1);
      const date = new Date();
      record.set('last_verb_executed', 102);
      record.set('last_verb_execution_time', date);
      links.update(record);

      const extraInfoEl = Ext.query('div.preview-header-extrainfobox-item');
      expect(Ext.isEmpty(extraInfoEl)).toBeFalsy();
      expect(extraInfoEl[0].textContent).toContain('You replied to this message on ' + date.format('j-m-Y H:i'));
    });

    it('should show reply information when message is a reply (103)', function() {
      const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', normalData, 1);
      const date = new Date();
      record.set('last_verb_executed', 103);
      record.set('last_verb_execution_time', date);
      links.update(record);

      const extraInfoEl = Ext.query('div.preview-header-extrainfobox-item');
      expect(Ext.isEmpty(extraInfoEl)).toBeFalsy();
      expect(extraInfoEl[0].textContent).toContain('You replied to this message on ' + date.format('j-m-Y H:i'));
    });

    it('should sensitivity information', function() {
      const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', normalData, 1);
      record.set('sensitivity', Zarafa.core.mapi.Sensitivity.PERSONAL);
      links.update(record);

      const extraInfoEl = Ext.query('div.preview-header-extrainfobox-item');
      expect(Ext.isEmpty(extraInfoEl)).toBeFalsy();
    });

    it('should importance information', function() {
      const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', normalData, 1);
      record.set('importance', Zarafa.core.mapi.Importance.URGENT);
      links.update(record);

      const extraInfoEl = Ext.query('div.preview-header-extrainfobox-item');
      expect(Ext.isEmpty(extraInfoEl)).toBeFalsy();
    });

    it('should shown external content information', function() {
      // Fake data for blocking external content.
      container.setUser({'entryid': ''});
      container.getSettingsModel().initialize({zarafa: {v1: {contexts: {mail: { block_external_content: true}}}}})

      const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', normalData, 1);
      record.set('html_body', '<img alt=text src=http://www.google.com/images/icon.gif width=120 height=500>');
      record.set('isHTML', true);
      links.update(record);

      const extraInfoEl = Ext.query('div.preview-header-extrainfobox-item');
      expect(Ext.isEmpty(extraInfoEl)).toBeFalsy();
      expect(extraInfoEl[0].textContent).toContain('Click here to download pictures. To help protect your privacy, WebApp prevented automatic download of some pictures in this message.');
    });
  });
});
