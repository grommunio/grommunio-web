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
    	defaultAutoCreate : {tag: "input", type: "text", size: "16", autocomplete: "off", spellcheck: "true"}
	});
})();
