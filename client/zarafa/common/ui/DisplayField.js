Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.DisplayField
 * @extends Ext.form.DisplayField
 * @xtype zarafa.displayfield
 *
 * Special extension to the default {@link Ext.form.DisplayField}
 * which adds a {@link #renderer} configuration option which can
 * be used to render the apply value correctly.
 */
Zarafa.common.ui.DisplayField = Ext.extend(Ext.form.DisplayField, {
	/**
	 * @cfg {Function} renderer A special renderer functions which
	 * can be used to apply special formatting to the displayed value
	 */
	renderer : function(value) { return value; },

	/**
	 * The raw value which was set to {@link #setRawValue}, this is
	 * the non-{@link #htmlEncode encoded} and non-{@link #rendered}
	 * value.
	 * @property
	 * @type Mixed
	 */
	rawValue : undefined,

	/**
	 * Sets the underlying DOM field's value directly, bypassing validation. To set the value with validation see {@link #setValue}.
	 * This will apply the {@link #renderer} to the applied value.
	 * @param {Mixed} The value to set
	 * @return {Mixed} The field value that is set
	 */
	setRawValue : function(value)
	{
		this.rawValue = value;
		return Zarafa.common.ui.DisplayField.superclass.setRawValue.call(this, this.renderer(value));
	},

	/**
	 * Returns the raw data value which may or may not be a valid, defined value. To return a normalized value see {@link #getValue}.
	 * @return {Mixed} The field value
	 */
	getRawValue : function()
	{
		return this.rawValue;
	}
});

Ext.reg('zarafa.displayfield', Zarafa.common.ui.DisplayField);
