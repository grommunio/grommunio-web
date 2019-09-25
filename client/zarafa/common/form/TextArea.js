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
	enableSystemContextMenu : false,

	/**
	 * Called during {@link #render}. If {@link #enableSystemContextMenu} is eanbled, this
	 * will apply the 'zarafa-contextmenu-enabled' CSS class on the {@link #el element}.
	 * @param {Ext.Container} ct The container in which the component is being rendered
	 * @param {Number} position The position inside the container where the component is being rendered
	 * @private
	 */
	onRender : function(ct, position)
	{
		Zarafa.common.form.TextArea.superclass.onRender.apply(this, arguments);

		if (this.enableSystemContextMenu) {
			this.el.addClass('zarafa-contextmenu-enabled');
		}
	},

	/**
	 * Function adds passed text in textarea at cursor's position.
	 * @param {String} text The text value which you want to add in text area
	 */
	insertAtCursor : function(text) {
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
	setCursorLocation : function()
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
	}
});

Ext.reg('zarafa.textarea', Zarafa.common.form.TextArea);
