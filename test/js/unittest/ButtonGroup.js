/*
 * Test the Zarafa.core.ui.ButtonGroup class.
 */
describe("ButtonGroup", function() {
	var buttonGroup;

	beforeEach(function() {
		buttonGroup = new Zarafa.core.ui.ButtonGroup();
	});

	afterEach(function() {
		buttonGroup.destroy();
	});

	/*
	 * Test visibility of buttongroup that it is not show
	 * when it is empty and it is shown when it has atleast
	 * one button to show.
	 */
	describe('Visibility', function() {
		beforeEach(function() {
			buttonGroup.removeAll();
		});

		it('Empty ButtonGroup should be invisible', function() {
			expect(buttonGroup.hasVisibleButtons()).toBeFalsy();
		});

		it('ButtonGroup with hidden buttons should be invisible', function() {
			buttonGroup.add({text:'Button 1', hidden: true});
			buttonGroup.add({text:'Button 2', hidden: true});
			buttonGroup.add({text:'Button 3', hidden: true});
			buttonGroup.add({text:'Button 4', hidden: true});
			expect(buttonGroup.hasVisibleButtons()).toBeFalsy();
		});

		it('ButtonGroup with un hidden buttons should be visible', function() {
			buttonGroup.add({text:'Button 1', hidden: false});
			buttonGroup.add({text:'Button 2', hidden: true});
			buttonGroup.add({text:'Button 3', hidden: true});
			buttonGroup.add({text:'Button 4', hidden: true});
			expect(buttonGroup.hasVisibleButtons()).toBeTruthy();
		});

	});
});
