/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	var orig_Instance = Ext.util.TextMetrics.Instance;

	// offsetWidth rounds fractional widths, so boxes sized from it wrapped their last character
	Ext.util.TextMetrics.Instance = function(bindTo, fixedWidth)
	{
		var instance = orig_Instance(bindTo, fixedWidth);
		// the measuring element orig_Instance just appended
		var ml = document.body.lastChild;

		instance.getSize = function(text)
		{
			ml.innerHTML = text;
			var rect = ml.getBoundingClientRect();
			ml.innerHTML = '';
			return {width: Math.ceil(rect.width), height: Math.ceil(rect.height)};
		};
		return instance;
	};
})();
