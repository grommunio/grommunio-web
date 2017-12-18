describe('SettingsReminderWidget', function() {
	var settingsModel;
	var widget;
	const userComboboxSelect = function(combobox, value) {
		var store = combobox.getStore();
		var index = store.find(combobox.displayField || combobox.valueField, value);
		if (index < 0) {
			return;
		}

		// Select the item from the list
		combobox.onSelect(store.getAt(index), index);
	};

	beforeEach(function() {
		widget = new Zarafa.calendar.settings.SettingsReminderWidget();
		settingsModel = container.getSettingsModel();
	});

	afterEach(function() {
		widget.destroy();
	});

	/*
	 * Test if the settings could be correctly loaded into the widget
	 */
	describe('Load settings', function() {

		beforeEach(function() {
			settingsModel.set('zarafa/v1/contexts/calendar/default_reminder', false);
			settingsModel.set('zarafa/v1/contexts/calendar/default_reminder_time', 30);
			settingsModel.set('zarafa/v1/contexts/calendar/default_allday_reminder_time', 1440);
			widget.update(settingsModel);
		});

		it('loaded the correct enable reminders into the checkbox', function() {
			expect(widget.reminderCheck.getValue()).toBeFalsy();
		});

		it('loaded the correct default reminder time into the combobox', function() {
			expect(widget.timeCombo.enabled).toBeFalsy();
			expect(widget.timeCombo.getValue()).toEqual(30);
		});

		it('loaded the correct default allday reminder time into the combobox', function() {
			expect(widget.alldayTimeCombo.enabled).toBeFalsy();
			expect(widget.alldayTimeCombo.getValue()).toEqual(1440);
		});
	});

	/*
	 * Test if the settings could correctly be saved into the settings
	 */
	describe('Save settings', function() {
		beforeEach(function() {
			widget.update(settingsModel);
		});

		it('can save the enable reminders to the local settings', function() {
			widget.reminderCheck.setValue(true);
			expect(settingsModel.get('zarafa/v1/contexts/calendar/default_reminder')).toBeTruthy();
		});

		it('can save the default reminder time to the local settings', function() {
			userComboboxSelect(widget.timeCombo, '1 hour');
			expect(settingsModel.get('zarafa/v1/contexts/calendar/default_reminder_time')).toEqual(60);
		});

		it('can save the default allday reminder time to the local settings', function() {
			userComboboxSelect(widget.alldayTimeCombo, '1 week');
			expect(settingsModel.get('zarafa/v1/contexts/calendar/default_allday_reminder_time')).toEqual(10080);
		});
	});
});
