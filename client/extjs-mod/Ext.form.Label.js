(function() {
	/*
	 * Override Ext.form.Label, there is a bahavioral difference
	 * between with using:
	 *      {
	 *          xtype: 'component',
	 *          fieldLabel: 'test'
	 *      }
	 * and
	 *      {
	 *          xtype: 'label',
	 *          text: 'test'
	 *      }
	 *
	 *  Altough both would render a label with the contents 'test',
	 *  the CSS classes are applied incorrectly. When using the
	 *  fieldLabel option, the generated HTML is:
	 *
	 *      <div class="x-form-item">
	 *          <label class="x-form-item-label">test</label>
	 *      </div>
	 *
	 * while using xtype: 'label' generates the HTML:
	 *
	 *      <label>test</test>
	 *
	 * Due to the missing CSS classes the Font size and padding are
	 * not applied correctly. However, adding the 'cls' statement
	 * to the configuration for adding the CSS classes 'x-form-item'
	 * or 'x-form-item-label' will not result in the same behavior
	 * either. The CSS definitions from Extjs really require the
	 * <label> element to be wrapped by a <div class="x-form-item">
	 * element.
	 */
	var orig_onRender = Ext.form.Label.prototype.onRender;
	Ext.override(Ext.form.Label, {
		cls: 'x-form-item-label',

		onRender : function(ct, position)
		{
			orig_onRender.apply(this, arguments);

			// Wrap the main element in a div element with class x-form-item. By naming it positionEl,
			// ExtJs will correctly position the div and its  contents on the correct location.
			this.positionEl = this.el.wrap({cls: 'x-form-item'});

			// Make the element unselectable by default.
			this.el.unselectable();
		}
	});
})();
