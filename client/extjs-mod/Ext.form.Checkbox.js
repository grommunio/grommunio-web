(function() {
	/*
	 * Override Ext.form.Checkbox to add the proper CSS class to the wrap
	 * element of the checkbox. This fixes the behavioral difference between:
	 *
	 *  {
	 *      xtype: 'textfield',
	 *      fieldLabel: 'test'
	 *  }
	 *
	 * and
	 *
	 *  {
	 *      xtype: 'checkbox',
	 *      boxLabel: 'test'
	 *  }
	 *
	 *  In the first example the HTML looks like:
	 *
	 *  <div class="... x-form-item ...">
	 *    <label>test</test>
	 *    ...
	 *  </div>
	 *
	 *  While for the second example the HTML looks like:
	 *
	 *  <div class="... x-box-item ...">
	 *    <label>test</test>
	 *  </div>
	 *
	 *  In the first example, the CSS class x-form-item is applied,
	 *  which causes the label to be rendered differently then when
	 *  the CSS class is not applied.
	 *
	 *  However since both are Ext.form.Field subclasses, they should
	 *  behave the same when considering CSS classes and rendering of
	 *  labels.
	 */
	var orig_onRender = Ext.form.Checkbox.prototype.onRender;
	Ext.override(Ext.form.Checkbox, {

		onRender : function(ct, position)
		{
			orig_onRender.apply(this, arguments);

			// Add x-form-item CSS class to the wrap element
			this.wrap.addClass('x-form-item');

			// Make the text in the label unselectable
			if(this.boxLabel && this.el){
				var lbl = Ext.query('.x-form-cb-label', this.el.parent().dom)[0];
				if (lbl) {
					Ext.get(lbl).unselectable();
				}
			}
		}
	});
})();
