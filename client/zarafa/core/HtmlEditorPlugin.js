Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.HtmlEditorPlugin
 * @extends Zarafa.core.Plugin
 *
 * Class is consider as a interface for all html editor plugins all
 * functions are override by the respective html editor plugins.
 */
Zarafa.core.HtmlEditorPlugin = Ext.extend(Zarafa.core.Plugin, {
	/**
	 * Editor plugins should overwrite this value with the xtype of their editor.
	 * @property
	 */
	editorXType: '',

	/**
	 * Sets the underlying DOM field's value directly, bypassing validation.
	 * To set the value with validation see {@link #setValue}.
	 * @param {Mixed} value The value to set
	 * @return {Ext.form.Field} this
	 */
	setRawValue : Ext.emptyFn,

	/**
	 * Sets a data value into the field and validates it.
	 * To set the value directly without validation see {@link #setRawValue}
	 * @param {Mixed} value The value to set
	 * @return {Ext.form.Field} this
	 */
	setValue : Ext.emptyFn,

	/**
	 * Returns the raw data value which may or may not be a valid, defined value.
	 * To return a normalized value see {@link #getValue}.
	 * @return {Mixed} value The field value
	 */
	getRawValue : Ext.emptyFn,

	/**
	 * Returns the normalized data value (undefined or emptyText will be returned as '').
	 * To return the raw value see {@link #getRawValue}.
	 * @return {Mixed} value The field value
	 */
	getValue : Ext.emptyFn,

	/**
	 * Try to focus this component.
	 * @param {Boolean} selectText (optional) If applicable, true to also select the text in this component
	 * @param {Boolean/Number} delay (optional) Delay the focus this number of milliseconds (true for 10 milliseconds)
	 * @return {Ext.Component} this
	 */
	focus : Ext.emptyFn,

	/**
	 * Resets the current field value to the originally loaded value and clears any validation messages.
	 * See {@link Ext.form.BasicForm}.{@link Ext.form.BasicForm#trackResetOnLoad trackResetOnLoad}
	 */
	reset : Ext.emptyFn,

	/**
	 * Function sets the cursor position to the start of the text
	 */
	setCursorLocation : Ext.emptyFn,

	/**
	 * Function inserts HTML text into the editor field where cursor is positioned.
	 * @param {String} value The text which must be inserted at the cursor position
	 */
	insertAtCursor : Ext.emptyFn,
});