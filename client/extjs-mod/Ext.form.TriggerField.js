/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	/*
	 * Override Ext.form.TriggerField to add the spellcheck attribute to inputs
	 */
	Ext.override(Ext.form.TriggerField, {
	    /**
	     * @cfg {String/Object} autoCreate <p>A {@link Ext.DomHelper DomHelper} element spec, or true for a default
	     * element spec. Used to create the {@link Ext.Component#getEl Element} which will encapsulate this Component.
	     * See <tt>{@link Ext.Component#autoEl autoEl}</tt> for details.  Defaults to:</p>
	     * <pre><code>{tag: "input", type: "text", size: "16", autocomplete: "off"}</code></pre>
	     */
    	defaultAutoCreate: {tag: "input", type: "text", size: "16", autocomplete: "off", spellcheck: "true"},

		// A hidden input measures 0, which shrank the wrap to the trigger in hidden cards
		onResize: function(w, h)
		{
			Ext.form.TriggerField.superclass.onResize.call(this, w, h);
			var tw = this.getTriggerWidth();
			if (Ext.isNumber(w)) {
				this.el.setWidth(w - tw);
				this.wrap.setWidth(w);
			} else {
				this.wrap.setWidth(this.el.getWidth() + tw);
			}
		}
	});
})();
