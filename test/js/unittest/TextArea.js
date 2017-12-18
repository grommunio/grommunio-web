describe('TextArea', function() {
	var textArea;
	const text1 = "Lorem ipsum bacon";
	const text2 = ", egg ham";

	beforeEach(function() {
		textArea = new Zarafa.common.form.TextArea({
			renderTo: Ext.getBody()
		});
	});

	afterEach(function() {
		textArea.destroy();
	});

	it('can insert at cursor', function() {
		textArea.insertAtCursor(text1);
		expect(textArea.getValue()).toEqual(text1);

		textArea.insertAtCursor(text2);
		expect(textArea.getValue()).toEqual(text1 + text2);
	});

	it('can set cursor location', function() {
		textArea.insertAtCursor(text2);
		expect(textArea.getValue()).toEqual(text2);

		textArea.setCursorLocation();

		textArea.insertAtCursor(text1);
		expect(textArea.getValue()).toEqual(text1 + text2);
	});
});
