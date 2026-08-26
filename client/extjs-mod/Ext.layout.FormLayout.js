(function() {
	var orig = Ext.layout.FormLayout.prototype.renderItem;

	/**
	 * @class Ext.layout.FormLayout
	 * Overridden so a label only points to a form control. Groups and display
	 * fields render a div under the field id, and browsers flag a label whose
	 * "for" names an element that cannot be labelled.
	 */
	Ext.override(Ext.layout.FormLayout, {
		renderItem: function(c)
		{
			orig.apply(this, arguments);

			var label = c && c.label ? c.label.dom : null;
			if (!label || !label.hasAttribute('for')) {
				return;
			}

			var target = document.getElementById(label.getAttribute('for'));
			if (target && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(target.tagName)) {
				return;
			}

			var input = c.el && c.el.dom && c.el.dom.querySelector ? c.el.dom.querySelector('input, select, textarea') : null;
			if (input && input.id) {
				label.setAttribute('for', input.id);
				return;
			}

			// nothing to label: a plain caption instead of a label element
			var caption = document.createElement('span');
			caption.className = label.className;
			if (label.getAttribute('style')) {
				caption.setAttribute('style', label.getAttribute('style'));
			}
			caption.innerHTML = label.innerHTML;
			label.parentNode.replaceChild(caption, label);
			c.label = Ext.get(caption);
		}
	});
})();
