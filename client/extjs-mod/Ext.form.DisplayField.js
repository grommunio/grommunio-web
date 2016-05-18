(function() {
	/*
	 * Override Ext.form.DisplayField to guarentee the availability
	 * of the 'x-form-item' CSS class.
	 * This is normally only applied when the component is being
	 * rendered using the FormLayout, but this doesn't really make
	 * sense for styling.
	 */
	Ext.override(Ext.form.DisplayField, {
		cls: 'x-form-item'
	});
})();
