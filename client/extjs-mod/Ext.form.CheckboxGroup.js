/*
 * SPDX-FileCopyrightText: Copyright 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	/*
	 * Columns given as a count are laid out as a grid sized to the labels
	 * (see .k-choice-columns), not as equal fractions of a fixed width, so
	 * a longer translation does not push a label under its button.
	 */
	var orig_onRender = Ext.form.CheckboxGroup.prototype.onRender;
	Ext.override(Ext.form.CheckboxGroup, {
		onRender: function(ct, position)
		{
			var columns = this.columns;
			var fit = !this.el && !Ext.isArray(columns) && !(this.items[0] && this.items[0].items);
			var count = Ext.isNumber(columns) ? columns : this.items.length;

			orig_onRender.apply(this, arguments);

			if (fit) {
				this.el.addClass('k-choice-columns');
				this.el.dom.style.setProperty('--k-choice-columns', count);
			}
		}
	});
})();
