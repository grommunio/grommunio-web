/*
 * Test SettingsSendAsWidget.
 */
describe('SettingsSendAsWidget', function() {
	var widget;
	var settingsModel;

	const user1 ={
		"rowid": 1,
		"display_name": "John Doe",
		"email_address": "john",
		"smtp_address": "john@kopano.local",
		"address_type": "ZARAFA",
		"object_type": 6,
		"display_type": 0,
		"display_type_ex": 0,
		"entryid": "00000000812B1FA4BEA310199D6E00DD010F5402000000804a006f0068006e00200044006f00650000005a004100520041004600410000006a006f0068006e0040007a00610072006100660061002e006c006f00630061006c000000"
	}
	const user2 ={
		"rowid": 1,
		"display_name": "Jane Doe",
		"email_address": "jane",
		"smtp_address": "jane@kopano.local",
		"address_type": "ZARAFA",
		"object_type": 6,
		"display_type": 0,
		"display_type_ex": 0,
		"entryid": "00000000812B1FA4BEA310199D6E00DD010F5402000000804a0061006e006500200044006f00650000005a004100520041004600410000006a0061006e00650040007a00610072006100660061002e006c006f00630061006c000000"
	};

	beforeEach(function() {
		container = new Zarafa.core.Container();
		settingsModel = container.getSettingsModel();
		settingsModel.initialize({});
		widget = new Zarafa.mail.settings.SettingsOofWidget({renderTo: Ext.getBody()});
	});

	afterEach(function() {
		widget.destroy();
	});

	/*
	 * Test if the settings could be correctly loaded into the widget
	 */
	describe('Load settings', function() {
		const initWidget = function() {
			widget.update(settingsModel);
		};

		it('can load send as widget for normal recipient records ', function() {
			/*
			* send as settings should be configured in settings model before
			* switching to settings context to make sure that send as grid is
			* populated using send as settings
			*/
			settingsModel.set('zarafa/v1/contexts/mail/sendas', [user1, user2]);
			expect(initWidget).not.toThrow();
		});

		it('can load send as widget for empty recipient records', function() {
			settingsModel.set('zarafa/v1/contexts/mail/sendas', [{}, {}]);
			expect(initWidget).not.toThrow();
		});

		it('can load send as widget for HTML injected recipient records', function() {
			for (let key in user1) {
				if (typeof user1[key] === 'string') {
					user1[key] = '<div class="test-code-injection">' + user1[key] + "</div>";
				}
			}
			for (let key in user2) {
				if (typeof user2[key] === 'string') {
					user2[key] = '<div class="test-code-injection">' + user2[key] + "</div>";
				}
			}
			settingsModel.set('zarafa/v1/contexts/mail/sendas', [user1, user2]);

			expect(initWidget).not.toThrow();
			expect(Ext.isEmpty(Ext.DomQuery.select('div.test-code-injection'))).toBeTruthy();
		});		
		
		xit('can load send as widget for no recipient records', function() {
			widget.update(settingsModel);
			expect(Ext.isEmpty(Ext.DomQuery.select('.emptytext'))).toBeFalsy();
		});
	});
});
