(function() {
	/**
	 * @class Ext.state.Manager
	 * This is the global state manager. By default all components that are "state aware" check this class
	 * for state information if you don't pass them a custom state provider. In order for this class
	 * to be useful, it must be initialized with a provider when your application initializes. Example usage:
	 <pre><code>
	 // in your initialization function
	init : function(){
	    Ext.state.Manager.setProvider(new Ext.state.CookieProvider());
	    var win = new Window(...);
	    win.restoreState();
	}
	 </code></pre>
	 * @singleton
	 */
	Ext.apply(Ext.state.Manager, {

		/**
		 * The list of {@link Ext.Component#stateful stateful} components
		 * This can be used by {@link Ext.state.Provider State providers} to
		 * {@link #getComponent obtain} the {@link Ext.Component} which corresponds
		 * to the given stateId.
		 * @property
		 * @type Ext.util.MixedCollection
		 * @private
		 */
		components : new Ext.util.MixedCollection(false, function(item) {
			return item.getStateId();
		}),

		/**
		 * Register the {@link Ext.Component#stateful stateful} {@link Ext.Component}
		 * to the {@link #components} list.
		 * @param {Ext.Component} component The component to register
		 */
		register : function(component)
		{
			this.components.add(component);
		},

		/**
		 * Unregister a previously {@link #register registered} {@link Ext.Component}
		 * from the {@link #components}.
		 * @param {Ext.Component} component The component to unregister
		 */
		unregister : function(component)
		{
			this.components.remove(component);
		},

		/**
		 * Obtain a previously {@link #register registered} {@link Ext.Component}
		 * by the components {@link Ext.Component#getStateId State Id}.
		 * @param {String} stateId The stateId for the component
		 * @return {Ext.Component} The registered component
		 */
		getComponent : function(stateId)
		{
			return this.components.get(stateId);
		}
	});
})();
