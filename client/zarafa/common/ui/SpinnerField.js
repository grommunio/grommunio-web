Ext.ns('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.SpinnerField
 * @extends Ext.form.TextField
 * @xtype zarafa.spinnerfield
 *
 * Alternative for the {@link Ext.ux.form.SpinnerField SpinnerField}
 * which only supports numbers rather then custom values. Nor does
 * it support setting the plugins array in a flexible way, since it
 * forces the application of {@link Ext.ux.Spinner Spinner} which we
 * don't want either.
 *
 * This class solves all that, by enforcing flexibility, and allowing
 * different values then just numbers into the field.
 *
 * Everything in this class is poorly documented, but everything was copied
 * from {@link Ext.ux.form.SpinnerField SpinnerField} which had no documentation
 * at all. It seems to be setting a lot of ExtJs fields which are available
 * in {@link Ext.form.Field} but are also not documented... So to keep the style
 * as consistent as possible, this class is also not documented...
 */
Zarafa.common.ui.SpinnerField = Ext.extend(Ext.form.TextField, {
	/**
	 * @cfg {String} actionMode
	 */
	actionMode: 'wrap',
	/**
	 * @cfg {Boolean} deferHeight
	 */
	deferHeight: true,
	/**
	 * @cfg {Function} autoSize
	 */
	autoSize: Ext.emptyFn,
	/**
	 * @cfg {Function} onBlur
	 */
	onBlur: function(){
		
		this.beforeBlur();
		if(this.focusClass){
			this.el.removeClass(this.focusClass);
		}
		this.hasFocus = false;
		if(this.validationEvent !== false && (this.validateOnBlur || this.validationEvent == 'blur')){
			// check whether any plugin is added to the field if so validate the value according to plugin
			if(Ext.isDefined(this.plugins)){
				Ext.each(this.plugins, function(comp){
					if (Ext.isFunction(comp.validate)) {
						comp.validate();
					}
				},this);
			}else{
				this.validate();
			}
		}
		var v = this.getValue();
		if(String(v) !== String(this.startValue)){
			this.fireEvent('change', this, v, this.startValue);
		}
		this.fireEvent('blur', this);
		this.postBlur();
	},

	/**
	 * @cfg {Function} adjustSize
	 */
	adjustSize: Ext.BoxComponent.prototype.adjustSize,
	/**
	 * @cfg {Object} defaultValue The default value value which must be used.
	 */
	defaultValue: undefined,
	/**
	 * @cfg {Object} minValue The minimum value which can be used.
	 */
	minValue : undefined,
	/**
	 * @cfg {Object} maxValue The maximum value which can be used.
	 */
	maxValue : undefined,
	/**
	 * @cfg {String} incrementValue The value which must be used to increment
	 * the {@link #incrementField} field with when the normal increment/decrement
	 * option is used.
	 */
	incrementValue: 1,
	/**
	 * @cfg {String} alternateIncrementValue The value which must be used to increment
	 * the {@link #alternateIncrementField} field with when the alternate increment/decrement
	 * option is used.
	 */
	alternateIncrementValue: 10,
	/**
	 * @return {Ext.Element} The resize element
	 * @private
	 */
	getResizeEl: function()
	{
		return this.resizeEl || this.wrap;
	},
	/**
	 * @return {Ext.Element} The positioning element
	 * @private
	 */
	getPositionEl: function()
	{
		return this.positionEl || this.wrap;
	},
	/**
	 * @return {Ext.Element} The align error element
	 * @private
	 */
	alignErrorIcon: function()
	{
		if (this.wrap) {
			this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
		}
	},
	/**
	 * Called during {@link #onBlur}.
	 * @private
	 */
	validateBlur: function()
	{
		return true;
	}
});

Ext.reg('zarafa.spinnerfield', Zarafa.common.ui.SpinnerField);
