/**
 * Test the custom Message box functionality 
 */
describe('Custom Message Box', function() {
	var customMessageBox;
	var config = {
		title : 'Custom Message Box',
		msg : 'this is Custom Message Box',
		icon: Ext.MessageBox.QUESTION,
		fn : function() {},
		customButton : [{
			text : 'buttonOne',
			name : 'button_one',
			scope : this,
		}]
	};

	/**
	 * Fuction should open the custom message box.
	 * @param {Object} config The config contains configuration option for custom message box.
	 */
	var openMessageBox = function(config) {
		Zarafa.common.dialogs.MessageBox.addCustomButtons(config);
		customMessageBox = Ext.WindowMgr.getActive();
	};

	afterEach(function() {
		customMessageBox.hide();
	});

	it('can open the custom message box without any errors', function() {
		var action = function() {
			openMessageBox(config);
		};
		expect(action).not.toThrow();
	});

	it('Should visible the custom message box properly', function(){
		openMessageBox(config);
		expect(customMessageBox.isVisible()).toBeTruthy();
	});

	it('Should contains custom buttons.', function() {
		openMessageBox(config);
		var customButton = customMessageBox.getFooterToolbar().find('text', 'buttonOne');
		expect(Ext.isEmpty(customButton)).toEqual(false);
	});

	it('can call it\'s handler properly.', function(){
		spyOn(Ext.MessageBox, 'show').and.callThrough();
		openMessageBox(config);
		expect(Ext.MessageBox.show).toHaveBeenCalled();
	});

	it('Should hide message box after clicking button', function(){
		openMessageBox(config);
		var customButton = customMessageBox.getFooterToolbar().find('text', 'buttonOne')[0];
		document.getElementById(customButton.id).click();
		expect(customMessageBox.isVisible()).toBeFalsy();
	});

	it('Should remove the custom buttons when custom message box gets hide', function(){
		openMessageBox(config);
		var customButton = customMessageBox.getFooterToolbar().find('text', 'buttonOne')[0];
		document.getElementById(customButton.id).click();

		expect(customMessageBox.isVisible()).toBeFalsy();

		// after hiding message box custom buttons must be remove.
		var afterHide = customMessageBox.getFooterToolbar().find('text', 'buttonOne');

		expect(Ext.isEmpty(afterHide)).toEqual(true);
	});
});
