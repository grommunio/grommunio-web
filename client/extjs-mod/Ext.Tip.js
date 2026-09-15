/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
 	var orig_doAutoWidth = Ext.Tip.prototype.doAutoWidth;

	Ext.override(Ext.Tip, {
		/*
		 * Fix an issue where IE9 & IE10 & IE11 breaks words and wraps it to new line
		 * because of wrong calculation of text width
		 * Maybe this is caused when we request an element's dimension via offsetWidth or offsetHeight, getBoundingClientRect, etc.
		 * the browser returns the subpixel width rounded to the nearest pixel.
		 */
		doAutoWidth: function()
		{
			orig_doAutoWidth.call(this, Ext.isIE ? 1 : 0);
		}
	});
})();