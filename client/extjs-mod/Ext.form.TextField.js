(function() {
	/*
	 * Override Ext.form.TextField to add the spellcheck attribute to inputs
	 */
	Ext.override(Ext.form.TextField, {
	    /**
	     * @cfg {String/Object} autoCreate <p>A {@link Ext.DomHelper DomHelper} element spec, or true for a default
	     * element spec. Used to create the {@link Ext.Component#getEl Element} which will encapsulate this Component.
	     * See <tt>{@link Ext.Component#autoEl autoEl}</tt> for details.  Defaults to:</p>
	     * <pre><code>{tag: 'input', type: 'text', size: '20', autocomplete: 'off', spellcheck: 'true'}</code></pre>
	     */
    	defaultAutoCreate : {tag: 'input', type: 'text', size: '20', autocomplete: 'off', spellcheck: 'true'}
	});
})();
