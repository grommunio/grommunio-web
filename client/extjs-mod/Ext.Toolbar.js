/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	Ext.override(Ext.Toolbar, {
		/**
		 * @cfg {String} ariaLabel The ARIA label for this toolbar.
		 */
		ariaLabel: undefined,

		onRender: Ext.Toolbar.prototype.onRender.createSequence(function() {
			if (this.el) {
				this.el.set({ 'role': 'toolbar' });
				if (this.ariaLabel) {
					this.el.set({ 'aria-label': this.ariaLabel });
				}
			}
		})
	});
})();
