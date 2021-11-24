/*
 * Test SettingsOofWidget.
 */
xdescribe('SettingsOofWidget', function() {
	var widget;
	var settingsModel;
	const fieldSetValue = function(field, value) {
		if(field instanceof Zarafa.common.ui.EditorField) {
			field = field.getLayout().activeItem;
		}
		field.onFocus();
		field.setValue(value);
		if (field.mimicBlur) {
			field.mimicBlur({ target : Ext.getBody().dom });
		} else {
			field.onBlur();
		}
	};

	beforeEach(function() {
		container = new Zarafa.core.Container();
		const settingsModel = container.getSettingsModel();
		settingsModel.initialize({
			'zarafa': {'v1': { 'contexts': { 'mail': { 'outofoffice': {
				'set': false,
				'subject': 'Default subject',
				'message': 'Default message',
			}}}}}
		});
		widget = new Zarafa.mail.settings.SettingsOofWidget({renderTo: Ext.getBody()});
	});

	afterEach(function() {
		widget.destroy();
	});

	describe('Load default time', function() {
		it('loaded the default From value of the Out of Office into the \'from datetime field\'', function() {
			expect(widget.outOfOfficeDateTimeField.enabled).toBeFalsy();
			expect(widget.outOfOfficeDateTimeField.getValue().clearTime()).toEqual(new Date().clearTime());
		});

		it('loaded the default Until value of the Out of Office into the \'until datetime field\'', function() {
			expect(widget.backDateTimeField.enabled).toBeFalsy();
			expect(widget.backDateTimeField.getValue().clearTime()).toEqual(new Date().getNextWorkWeekDay().clearTime());
		});
	});

	describe('Now button', function() {

		beforeEach(function() {
			widget.outOfOfficeRadio.getEl().dom.click();
			// Click the checkbox
			widget.willBeBackCheckBox.setValue(true);
		});

		it('can not display the warning message if Until time is less than From time', function() {
			fieldSetValue(widget.outOfOfficeDateTimeField, new Date());
			fieldSetValue(widget.backDateTimeField, new Date().getNextWorkWeekDay());

			expect(widget.oofWarning.getValue()).toEqual('');
		});

		it('can display the warning message if Until time is greater than From time', function() {
			fieldSetValue(widget.outOfOfficeDateTimeField, new Date().getNextWorkWeekDay());
			fieldSetValue(widget.backDateTimeField, new Date());

			expect(widget.oofWarning.getValue()).toEqual('The time you entered is before the out of office date. Please reschedule.');
		});

		it('can not mark \'Until datetime field\' as invalid if Until time is less than From time', function() {
			fieldSetValue(widget.outOfOfficeDateTimeField, new Date());
			fieldSetValue(widget.backDateTimeField, new Date().getNextWorkWeekDay());

			expect(widget.backDateTimeField.isValid()).toBeTruthy();
		});

		it('can mark \'Until datetime field\' as invalid if Until time is greater than From time', function() {
			fieldSetValue(widget.outOfOfficeDateTimeField, new Date().getNextWorkWeekDay());
			fieldSetValue(widget.backDateTimeField, new Date());

			expect(widget.backDateTimeField.isValid()).toBeFalsy();
		});

		it('can hide the warning message if \'Will be back\' check box is unchecked', function() {
			fieldSetValue(widget.outOfOfficeDateTimeField, new Date().getNextWorkWeekDay());
			fieldSetValue(widget.backDateTimeField, new Date());

			// Click the checkbox to uncheck already checked checkbox
			widget.willBeBackCheckBox.setValue(false);

			expect(widget.oofWarning.getValue()).toEqual('');
		});

	});

	describe('Now button', function() {
		// FIXME move to separate unit test for now button in xtype: 'zarafa.datetimefield',

		beforeEach(function() {
			jasmine.addMatchers(customMatchers);
			// Enable OOF
			widget.outOfOfficeRadio.getEl().dom.click();
		});

		it('can display \'Now\' button in the date picker of \'From datetime field\'', function() {
			var fromDateField = widget.outOfOfficeDateTimeField.dateField;

			// Click the trigger button to display date picker
			fromDateField.onTriggerClick();

			// Obtain the today(in this case "now") button of date picker.
			var nowBtn = fromDateField.menu.picker.todayBtn;
			expect(nowBtn.text).toEqual('Now');
		});

		it('can display \'Now\' button in the date picker of \'Until datetime field\'', function() {
			// Click the checkbox
			widget.willBeBackCheckBox.setValue(true);

			var backDateField = widget.backDateTimeField.dateField;

			// Click the trigger button to display date picker
			backDateField.onTriggerClick();

			// Obtain the today(in this case "now") button of date picker.
			var nowBtn = backDateField.menu.picker.todayBtn;
			expect(nowBtn.text).toEqual('Now');
		});

		it('can fire \'selectnow\' event while clicking on \'Now\' button in the date picker of \'From datetime field\'', function() {
			var fromDateField = widget.outOfOfficeDateTimeField.dateField;
			spyOn(fromDateField, 'fireEvent').and.callThrough();

			// Click the trigger button to display date picker
			fromDateField.onTriggerClick();

			// Obtain the today(in this case "now") button of date picker and simulate the mouse click.
			var nowBtn = fromDateField.menu.picker.todayBtn.getEl();
			nowBtn.dom.click();

			expect(fromDateField.fireEvent).toHaveBeenCalledWithFirstArgument('selectnow');
		});

		it('can fire \'selectnow\' event while clicking on \'Now\' button in the date picker of \'Until datetime field\'', function() {
			// Click the checkbox
			widget.willBeBackCheckBox.setValue(true);

			const backDateField = widget.backDateTimeField.dateField;
			spyOn(backDateField, 'fireEvent').and.callThrough();

			// Click the trigger button to display date picker
			backDateField.onTriggerClick();

			// Obtain the today(in this case "now") button of date picker and simulate the mouse click.
			var nowBtn = backDateField.menu.picker.todayBtn.getEl();
			nowBtn.dom.click();

			expect(backDateField.fireEvent).toHaveBeenCalledWithFirstArgument('selectnow');
		});

	});
});
