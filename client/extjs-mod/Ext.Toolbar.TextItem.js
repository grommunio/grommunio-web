/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	/**
	 * Override Ext.Toolbar.TextItem to make the text unselectable.
	 */
	var orig_onRender = Ext.Toolbar.TextItem.prototype.onRender;
	Ext.override(Ext.Toolbar.TextItem, {

		onRender: function(ct, position)
		{
			orig_onRender.apply(this, arguments);

			if (this.el) {
				this.el.unselectable();
			}
		}

	});
})();
