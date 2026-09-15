/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	Ext.ToolTip.prototype.onRender = Ext.ToolTip.prototype.onRender.createSequence(function() {
		if (this.el) {
			this.el.set({ 'role': 'tooltip' });
		}
	});
})();
