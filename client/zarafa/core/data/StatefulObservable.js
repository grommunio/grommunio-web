Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.StatefulObservable
 * @extends Ext.util.Observable
 *
 * Extends the {@link Ext.util.Observable} and add {@link #stateful}
 * properties to the object allowing similar features as the
 * {@link Ext.Component}#{@link Ext.Component#stateful}.
 */
Zarafa.core.data.StatefulObservable = Ext.extend(Ext.util.Observable, {
	/**
	 * @cfg {Boolean} stateful A flag which causes the Component to attempt to restore the state of internal properties
	 * from a saved state on startup. The component must have a {@link #stateId}  for state to be managed.
	 */
	stateful : false,

	/**
	 * @cfg {String} stateId The unique id for this component to use for state management purposes
	 * See {@link #stateful} for an explanation of saving and restoring Component state.
	 */
	stateId : undefined,

	/**
	 * @cfg {Array} stateEvents An array of events that, when fired, should trigger this component to save its state
	 * (defaults to {@link #datamodechange}). stateEvents may be any type of event supported by this component.
	 * See {@link #stateful} for an explanation of saving and restoring Component state.
	 */
	stateEvents : undefined,

	/**
	 * @cfg {String} statefulName The unique name for this component by which the {@link #getState state}
	 * must be saved into the {@link Zarafa.settings.SettingsModel settings}.
	 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
	 * used in the {@link Ext.state.Manager}.
	 */
	statefulName : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);

		Zarafa.core.data.StatefulObservable.superclass.constructor.call(this, config);

		// If stateful, generate a stateId if not provided manually,
		// and register the object to the Ext.state.Manager.
		if (this.stateful !== false) {
			if (!this.stateId) {
				this.stateId = Ext.id(null, 'state-');
			}

			Ext.state.Manager.register(this);
			this.initStateEvents();
		}
	},

	/**
	 * Obtain the path in which the {@link #getState state} must be saved.
	 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
	 * used in the {@link Ext.state.Manager}. This returns {@link #statefulName} if provided, or else generates
	 * a custom name.
	 * @return {String} The unique name for this component by which the {@link #getState state} must be saved. 
	 */
	getStateName : function()
	{
		return this.statefulName;
	},

	/**
	 * Obtain the {@link #stateId} from the component
	 * @return {String} The state ID
	 * @private
	 */
	getStateId : function()
	{
		return this.stateId || this.id;
	},

	/**
	 * Register the {@link #stateEvents state events} to the {@link #saveState} callback function.
	 * @protected
	 */
	initStateEvents : function()
	{
		if (this.stateEvents) {
			for (var i = 0, e; e = this.stateEvents[i]; i++) {
				this.on(e, this.saveState, this, {delay:100});
			}
		}
	},

	/**
	 * Intialialize the component with {@link #applyState} using the state which has
	 * been {@link Ext.state.Manager#get obtained} from the {@link Ext.state.Manager State Manager}.
	 * @private
	 */
	initState : function()
	{
		if (Ext.state.Manager) {
			var id = this.getStateId();
			if (id) {
				var state = Ext.state.Manager.get(id);
				if (state) {
					if (this.fireEvent('beforestaterestore', this, state) !== false) {
						this.applyState(Ext.apply({}, state));
						this.fireEvent('staterestore', this, state);
					}
				}
			}
		}
	},

	/**
	 * Apply the given state to this object activating the properties which were previously
	 * saved in {@link Ext.state.Manager}.
	 * @param {Object} state The state object
	 * @protected
	 */
	applyState : function(state)
	{
		if (state) {
			Ext.apply(this, state);
		}
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState : function()
	{
		return null;
	},

	/**
	 * Obtain the {@link #getState current state} and {@link Ext.state.Manager#set save} it
	 * to the {@link Ext.state.Manager State Manager}.
	 * @private
	 */
	saveState : function()
	{
		if (Ext.state.Manager && this.stateful !== false) {
			var id = this.getStateId();
			if (id) {
				var state = this.getState();
				if (this.fireEvent('beforestatesave', this, state) !== false) {
					Ext.state.Manager.set(id, state);
					this.fireEvent('statesave', this, state);
				}
			}
		}
	}
});
