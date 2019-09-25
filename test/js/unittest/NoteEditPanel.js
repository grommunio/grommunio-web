Ext.override(Zarafa.common.ui.EditorField, {
	/**
	 * @cfg {String} htmlXtype The Xtype of the component which is used for the Html editor
	 * By default this is {@link Zarafa.common.ui.HtmlEditor zarafa.htmleditor}. But for unittest
	 * system at the moment it is not possible to load tinymce editor so we are overriding it with
	 * plaintext editor {@link Zarafa.common.form.TextArea textarea}.
	 */
	htmlXtype : 'zarafa.textarea',
	useHtml: false
});

describe('NoteEditPanel', function() {
	container = new Zarafa.core.Container();
	container.setServerConfig({})
	var dialog;

	beforeEach(function() {
		const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.StickyNote', {}, 1);
		dialog = new Zarafa.note.dialogs.NoteEditPanel({renderTo: Ext.getBody()});
		dialog.update(record);
	});

	afterEach(function() {
		dialog.destroy();
	});

	it('onTextareaChange', function() {
		const text = 'this is kopano';
		dialog.noteText.setValue(text);
		dialog.onTextareaChange(dialog.noteText);
		expect(dialog.record.get('body')).toEqual(text);
		expect(dialog.record.get('subject')).toEqual(text);
	});

	describe('getTextAreaColor', function() {
		it('default', function() {
			expect(dialog.getTextAreaColor(9999)).toEqual("stickynote_dialog_yellow");
		});

		it('yellow', function() {
			expect(dialog.getTextAreaColor(Zarafa.core.mapi.IconIndex['note_yellow'])).toEqual("stickynote_dialog_yellow");
		});

		it('blue', function() {
			expect(dialog.getTextAreaColor(Zarafa.core.mapi.IconIndex['note_blue'])).toEqual("stickynote_dialog_blue");
		});

		it('green', function() {
			expect(dialog.getTextAreaColor(Zarafa.core.mapi.IconIndex['note_green'])).toEqual("stickynote_dialog_green");
		});

		it('pink', function() {
			expect(dialog.getTextAreaColor(Zarafa.core.mapi.IconIndex['note_pink'])).toEqual("stickynote_dialog_pink");
		});

		it('white', function() {
			expect(dialog.getTextAreaColor(Zarafa.core.mapi.IconIndex['note_white'])).toEqual("stickynote_dialog_white");
		});
	});

	it('updateRecord', function() {
		const text = 'this is kopano';
		dialog.noteText.setValue(text);
		dialog.updateRecord(dialog.record);
		expect(dialog.record.get('body')).toEqual(text);
		expect(dialog.record.get('subject')).toEqual(text);
	});
});
