/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	Ext.menu.Separator.prototype.onRender = Ext.menu.Separator.prototype.onRender.createSequence(function() {
		if (this.el) {
			this.el.set({ 'role': 'separator' });
		}
	});
})();
