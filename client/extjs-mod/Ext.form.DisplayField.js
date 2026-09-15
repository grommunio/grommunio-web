/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	/*
	 * Override Ext.form.DisplayField to guarantee the availability
	 * of the 'x-form-item' CSS class.
	 * This is normally only applied when the component is being
	 * rendered using the FormLayout, but this doesn't really make
	 * sense for styling.
	 */
	Ext.override(Ext.form.DisplayField, {
		cls: 'x-form-item'
	});
})();
