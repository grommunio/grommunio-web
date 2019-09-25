Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.HierarchyState
 * @extends Zarafa.core.data.StatefulObservable
 *
 * A special State class which can be used to obtain the current
 * state for the {@link Zarafa.hierarchy.data.HierarchyStore Hierarchy}
 * or its {@link Zarafa.hierarchy.data.MAPIFolderRecord folders}.
 *
 * This must be used in conjunction with {@link Zarafa.common.ui.grid.GridPanel}
 * which is writing directly into the namespace using the {@link Zarafa.core.data.SettingsStateProvider}. 
 */
Zarafa.hierarchy.data.HierarchyState = Ext.extend(Zarafa.core.data.StatefulObservable, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			stateful : true,
			statefulName : 'folders'
		});

		Zarafa.hierarchy.data.HierarchyState.superclass.constructor.call(this, config);
	},

	/**
	 * Obtain the path in which the {@link #getState state} must be saved.
	 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
	 * used in the {@link Ext.state.Manager}.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the statename is requested
	 * @param {String} type The category for the folder for which the statename is requested (e.g. 'list' or 'tree').
	 * @return {String} The unique name for this component by which the {@link #getState state} must be saved. 
	 */	
	getStateNameForFolder : function(folder, type)
	{
		if (folder) {
			return 'folders/' + folder.get('entryid') + '/' + type;
		} else {
			return 'folders/none/' + type;
		}
	},

	/**
	 * Apply the given state to this object activating the properties which were previously
	 * saved in {@link Ext.state.Manager}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the state is provided
	 * @param {String} type The category for the folder for which the state is provided (e.g. 'list' or 'tree').
	 * @param {Object} state The state object
	 */
	applyStateForFolder : function(folder, type, state)
	{
		this.statefulName = this.getStateNameForFolder(folder, type);

		var id = this.getStateId();
		if (id) {
			Ext.state.Manager.set(id, state);
		}
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * This calls {@link Zarafa.hierarchy.data.HierarchyState#getStateForFolder getStateForFolder} on the {@link #state}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the state is requested
	 * @param {String} type The category for the folder for which the state is requested (e.g. 'list' or 'tree').
	 * @return {Object} The state object
	 */
	getStateForFolder : function(folder, type)
	{
		this.statefulName = this.getStateNameForFolder(folder, type);

		var id = this.getStateId();
		if (id) {
			return Ext.apply({}, Ext.state.Manager.get(id));
		}
	}
});
