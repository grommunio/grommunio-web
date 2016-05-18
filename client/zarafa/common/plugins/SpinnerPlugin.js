Ext.ns('Zarafa.common.plugins');

/**
 * @class Zarafa.common.plugins.SpinnerPlugin
 * @extends Ext.ux.Spinner
 *
 * Extension to the {@link Ext.ux.Spinner Spinner} object,
 * to fix any bugs which are inside there. This plugin
 * should not be used directly, instead it should be used
 * as baseclass for any Spinner plugins.
 */
Zarafa.common.plugins.SpinnerPlugin = Ext.extend(Ext.ux.Spinner, {
	/**
	 * Automatically called when the parent {@link Zarafa.common.ui.SpinnerField SpinnerField}
	 * is being rendered. This will apply the default value to the field.
	 * @param {Container} ct The parent container into which the SpinnerField is being rendered.
	 * @param {Number} position The position where the SpinnerField is being rendered
	 * @private
	 */
	doRender: function(ct, position)
	{
		Zarafa.common.plugins.SpinnerPlugin.superclass.doRender.call(this, ct, position);
		this.field.trigger = this.trigger;

		if (!Ext.isDefined(this.field.getTriggerWidth))
			this.field.getTriggerWidth = Ext.form.TriggerField.prototype.getTriggerWidth;
	},

	/**
	 * Handle the click event on {@link Ext.form.TriggerField TriggerField}.
	 * This function is overriden to fix problem when trigger is clicked directly without gaining
	 * focus on the {@link Zarafa.common.ui.SpinnerField SpinnerField} then we should shift the
	 * focus to {@link Zarafa.common.ui.SpinnerField SpinnerField} and then execute this event.
	 * @param {Event} event The event object for this event
	 */
	onTriggerClick: function(event)
	{	   
		if (this.disabled || this.el.dom.readOnly) {
			return;
		}

		var middle = this.getMiddle();
		var ud = (event.getPageY() < middle) ? 'Up' : 'Down';

		// Grab focus on the element, this will ensure that
		// the field which we are editing has the browser focus.
		this.el.focus();

		this['onSpin' + ud]();
	},

	/**
	 * checks if control is allowed to spin
	 * @return {Boolean} True if the spin action is allowed
	 * @private
	 */
	isSpinnable: function()
	{
		if (this.disabled || (this.rendered && this.el.dom.readOnly) || !Ext.isDefined(this.field.getValue())) {
			Ext.EventObject.preventDefault(); //prevent scrolling when disabled/readonly
			return false;
		}
		return true;
	}
});
