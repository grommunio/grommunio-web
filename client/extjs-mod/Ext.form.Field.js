(function() {
	var orig_markInvalid = Ext.form.Field.prototype.markInvalid;
	var orig_clearInvalid = Ext.form.Field.prototype.clearInvalid;

	Ext.override(Ext.form.Field, {
		/**
		 * Override markInvalid to set aria-invalid attribute for accessibility.
		 * @param {String} msg The validation message
		 */
		markInvalid: function(msg)
		{
			orig_markInvalid.apply(this, arguments);
			if (this.el) {
				this.el.set({ 'aria-invalid': 'true' });
			}
		},

		/**
		 * Override clearInvalid to remove aria-invalid attribute.
		 */
		clearInvalid: function()
		{
			orig_clearInvalid.apply(this, arguments);
			if (this.el) {
				this.el.dom.removeAttribute('aria-invalid');
			}
		},

		/**
		 * Override onRender to add aria-required for required fields
		 * and aria-label for fields with fieldLabel but no associated visible label element.
		 */
		onRender: Ext.form.Field.prototype.onRender.createSequence(function() {
			if (!this.el) {
				return;
			}
			if (this.allowBlank === false) {
				this.el.set({ 'aria-required': 'true' });
			}
			// If the field has a fieldLabel but no visible <label> element is linked to it,
			// set aria-label so screen readers can identify the field.
			if (this.fieldLabel && !this.el.dom.getAttribute('aria-label')) {
				var labelEl = this.el.dom.ownerDocument.querySelector('label[for="' + this.el.id + '"]');
				if (!labelEl || (labelEl.offsetWidth === 0 && labelEl.offsetHeight === 0)) {
					this.el.set({ 'aria-label': this.fieldLabel });
				}
			}
			// Mark read-only fields for screen readers
			if (this.readOnly) {
				this.el.set({ 'aria-readonly': 'true' });
			}
		})
	});
})();
