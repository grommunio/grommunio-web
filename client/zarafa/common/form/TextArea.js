Ext.namespace('Zarafa.common.form');

/**
 * @class Zarafa.common.form.TextArea
 * @extends Ext.form.TextArea
 * @xtype zarafa.textarea
 *
 * The Textarea which extends{@link Ext.form.TextArea} and adds extra functionality
 * like inserting text at cursor position.
 */
Zarafa.common.form.TextArea = Ext.extend(Ext.form.TextArea, {

	/**
	 * @cfg {Boolean} enableSystemContextMenu Enable the browser's default contextmenu
	 * to be opened on this {@link #el element}.
	 */
	enableSystemContextMenu: false,

	/**
	 * Called during {@link #render}. If {@link #enableSystemContextMenu} is enabled, this
	 * will apply the 'zarafa-contextmenu-enabled' CSS class on the {@link #el element}.
	 * @param {Ext.Container} ct The container in which the component is being rendered
	 * @param {Number} position The position inside the container where the component is being rendered
	 * @private
	 */
	onRender: function(ct, position)
	{
		Zarafa.common.form.TextArea.superclass.onRender.apply(this, arguments);

		if (this.enableSystemContextMenu) {
			this.el.addClass('zarafa-contextmenu-enabled');
		}

		this.el.on('dragover', this.onFileDragOver, this);
		this.el.on('drop', this.onFileDrop, this);
	},

	/**
	 * Prevent the browser from opening dropped files.
	 * @param {Ext.EventObject} e The drag event
	 * @private
	 */
	onFileDragOver: function(e)
	{
		var dt = e.browserEvent.dataTransfer;
		if (dt && (Array.prototype.indexOf.call(dt.types, 'Files') >= 0 || dt.files.length > 0)) {
			e.preventDefault();
		}
	},

	/**
	 * Block file drops on the plain-text body area. When the user drops a file
	 * that cannot be embedded (which is every file in plain-text mode), offer
	 * to add it as a message attachment instead.
	 * @param {Ext.EventObject} e The drop event
	 * @private
	 */
	onFileDrop: function(e)
	{
		var dt = e.browserEvent.dataTransfer;
		if (!dt || (Array.prototype.indexOf.call(dt.types, 'Files') < 0 && dt.files.length === 0)) {
			return;
		}

		e.preventDefault();

		var files = dt.files;
		if (!files || files.length === 0) {
			return;
		}

		// Build a list of filenames for the confirmation message. Each name is
		// HTML-encoded individually so that the '<br>' separators used to join
		// them remain real line breaks instead of being escaped as literal text.
		var names = [];
		for (var i = 0, len = files.length; i < len; i++) {
			names.push('\u2022 ' + Ext.util.Format.htmlEncode(files[i].name));
		}

		var self = this;
		var filesSnapshot = files; // keep a reference before the event is recycled

		Ext.MessageBox.confirm(
			_('Add as attachment?'),
			_('The following files cannot be embedded in the message body. Add them as attachments instead?') +
				'<br><br>' + names.join('<br>'),
			function(btn) {
				if (btn !== 'yes') {
					return;
				}

				// Walk up to the nearest panel that holds the mail record.
				var panel = self.findParentByType('zarafa.mailcreatepanel') ||
				            self.findParentByType('zarafa.recordcontentpanel');
				if (!panel || !panel.record) {
					return;
				}

				var store = panel.record.getSubStore('attachments');
				// Run the same validation (max attachment count/size limits) that a
				// direct drop on the Attachments field would perform, so the file is
				// added/rejected/notified in exactly the same way either way.
				if (store && store.canUploadFiles(filesSnapshot, { container: panel.getEl() })) {
					store.uploadFiles(filesSnapshot);
				}
			}
		);
	},

	/**
	 * Function adds passed text in textarea at cursor's position.
	 * @param {String} text The text value which you want to add in text area
	 */
	insertAtCursor: function(text) {
		var startPos = this.el.dom.selectionStart;
		var endPos = this.el.dom.selectionEnd;
		this.el.dom.value = this.el.dom.value.substring(0, startPos)
			+ text
			+ this.el.dom.value.substring(endPos, this.el.dom.value.length);

		this.el.focus();
		this.el.dom.setSelectionRange(endPos + text.length, endPos + text.length);
	},

	/**
	 * Function sets the cursor position to the start of the text
	 */
	setCursorLocation: function()
	{
		var textAreaDom = this.getEl().dom;

		// When a user replies to an email and the textarea contains text then by default
		// the cursor is set to the end of the text. The following code sets the cursor position to
		// the start of the text.
		var textLen = textAreaDom.textLength;
		var startPos = textAreaDom.selectionStart;
		var endPos = textAreaDom.selectionEnd;

		if(startPos === textLen && endPos === textLen) {
			textAreaDom.setSelectionRange(0,0);
		}
	},

	/**
	 * Function select the text in editor by given selector.
	 *
	 * @param {String} selector The selector query which used to select the text in editor.
	 * @return {boolean} return true if text is selected in editor else false.
	 */
	selectBySelector: Ext.emptyFn,
});

Ext.reg('zarafa.textarea', Zarafa.common.form.TextArea);
