Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.MultiFolderContextModel
 * @extends Zarafa.core.ContextModel
 *
 * Extension to the context model to support maintaining
 * multiple folders which can be grouped together in a sort
 * of tabbed view.
 */
Zarafa.core.MultiFolderContextModel = Ext.extend(Zarafa.core.ContextModel, {
	/**
	 * @cfg {Object[]} colorScheme The color defintion objects which is applied within
	 * the context. Each folder will be assigned with an entry from this array to
	 * define the colors applied to it.
	 */
	colorScheme : undefined,
	
	/**
	 * A flag that denotes if colors are being assigned, thereby letting
	 * the setColor function know that it shouldn't fire the 'colormapchanged'
	 * event.
	 * @property
	 * @type Boolean
	 * @private
	 */
	assigningColors : false,

	/**
	 * @cfg {Boolean} default_merge_state True if the contents of each folder is currently merged into a single view.
	 * This is updated through {@link #setMergeState} and when this field changes,
	 * the {@link #foldermergestatechanged} event will be fired.
	 */
	default_merge_state : false,

	/**
	 * The currently active grouping of all active {@link #folders}.
	 * Each key inside this object refers to another object containting the
	 * 'folders' properties which is the list of all entryids which are
	 * grouped together into a single view. The 'active' property denotes which
	 * folder is currently the active folder.
	 * When this context is {@link #stateful stateful}, this option will be
	 * saved in the settings.
	 * @property
	 * @type Object
	 * @private
	 */
	groupings : undefined,

	/**
	 * Mapping of folder entryids to color schemes
	 * @property
	 * @type Object
	 */
	colorMap : undefined,
	
	/**
	 * The currently active group out of all groupings in this context model
	 * Outlook has a single selected folder at any time, regardless of how folders are grouped
	 * This property is used to index into the active group
	 * When this context is {@link #stateful stateful}, this option will be
	 * saved in the settings.
	 * @property
	 * @type String
	 * @private
	 */
	active_group : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		this.addEvents(
			/**
			 * @event foldermergestatechanged
			 * Fires when the contents of the selected folders must be merged into a single view
			 * @param {Zarafa.core.ContextModel} model this context model.
			 * @param {Boolean} mergeState The merge state, true to merge all folders into
			 * a single view.
			 */
			'foldermergestatechanged',
			/**
			 * @event foldergroupingchanged
			 * Fires when the groupings for the selected folders has been changed.
			 * @param {Zarafa.core.ContextModel} model this context model.
			 * @param {Object} groupings The groupings object
			 * @param {String} active The active group
			 */
			'foldergroupingchanged',
			/**
			 * @event colormapchanged
			 * Fires when a new color schema for a folder has been set.
			 * @param {Zarafa.core.ContextModel} model this context model.
			 * @param {Object} colorMap The new colorMap
			 */
			'colormapchanged'
		);

		// Initialize groupings
		this.groupings = {};
		this.colorMap = {};

		Zarafa.core.MultiFolderContextModel.superclass.constructor.call(this, config);

		var hierarchyStore = container.getHierarchyStore();
		hierarchyStore.on('addFolder', this.onHierarchyAddFolder, this);
	},

	/**
	 * Called during the {@link Zarafa.core.Context#enable enabling} of the {@link Zarafa.core.Context context}.
	 * Secondly it will {@link #setFolders set the} {@link #folders folder} to this object to {@link #load} the {@link #store}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to show.
	 * @param {Boolean} suspended True to enable the ContextModel {@link #suspendLoading suspended}
	 */
	enable : function(folder, suspended)
	{
		Zarafa.core.MultiFolderContextModel.superclass.enable.apply(this, arguments);

		this.setMergeState(this.getCurrentMergeState(), true);
	},

	/**
	 * Set the mergeState to force eiher the UI components to merge or separate
	 * all folders currently in the view. If the lock argument is not given, or
	 * is currently  This will only act upon the currently open folders in the view.
	 * @param {Boolean} mergeState True to merge all folders into a single view
	 * @param {Boolean} init (optional) True when this function is called during initialization
	 * and it should force the change of the data mode.
	 */
	setMergeState : function(mergeState, init)
	{
		if (init === true || this.default_merge_state !== mergeState) {
			this.default_merge_state = mergeState;

			this.fireEvent('foldermergestatechanged', this, this.default_merge_state);
		}
	},

	/**
	 * Get the current merge state of all opened folders
	 * @return {Boolean} The current merge state
	 */
	getCurrentMergeState : function()
	{
		return this.default_merge_state;
	},

	/**
	 * Event handler which is executed right before the {@link #folderchange}
	 * event is fired. This allows subclasses to update the folders.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event.
	 * @param {Array} folders selected folders as an array of {@link Zarafa.hierarchy.data.MAPIFolderRecord Folder} objects.
	 * @private
	 */
	onFolderChange : function(model, folders)
	{
		Zarafa.core.MultiFolderContextModel.superclass.onFolderChange.apply(this, arguments);

		this.sortFolders();
		this.assignColors();
		this.applyGrouping();
	},

	/**
	 * Overriden in order to assign colors to the loaded folders
	 *
 	 * Sets {@link #defaultFolder default folder} for the particular {@link Zarafa.core.Context context}.
	 * This will help while opening new item dialog from other contexts
	 * e.g. Create new Contact from Inbox, at this moment we need {@link #defaultFolder} to create the item.
	 *
	 * When the {@link Zarafa.core.Context context} was opened without any folders,
	 * this also means we can now {@link #addFolder load} the {@link #defaultFolder}.
	 *
	 * @param {Zarafa.core.hierarchyStore} store that holds hierarchy data.
	 * @private
	 * @override
	 */
	onHierarchyLoad : function(hierarchyStore)
	{
		// only continue when hierarchyStore has data
		if (hierarchyStore.getCount() === 0) {
			return;
		}

		Zarafa.core.MultiFolderContextModel.superclass.onHierarchyLoad.apply(this, arguments);

		this.sortFolders();
		this.assignColors();
 	},

 	onHierarchyAddFolder : function(hierarchyStore, storeRecord, folder)
	{
 		this.assignColors();
 	},

	/**
	 * Returns the default {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} which is
	 * used within the current selection of folders. If multiple folders are grouped together then
	 * this function will return the active group folder. If this ContextModel is not enabled then
	 * this will always return default calendar folder from default store.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} The default folder
	 */
	getDefaultFolder : function()
	{
		if(this.enabled) {
			var activeGroup = this.getActiveGroup();

			if(activeGroup && this.groupings[activeGroup]) {
				var folder = this.getFolder(this.groupings[activeGroup].active);
				if(!Ext.isEmpty(folder)) {
					return folder;
				}
			}
		}

		// fallback to parent
		return Zarafa.core.MultiFolderContextModel.superclass.getDefaultFolder.apply(this, arguments);
	},

	/**
	 * Updates a group in the {@link #groupings} to mark it as active.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which is activated
	 * @param {String} groupId The group to which the folder belongs
	 */
	activateFolderInGroup : function(folder, groupId)
	{
		this.active_group = groupId;
		this.groupings[groupId].active = folder.get('entryid');

		this.fireEvent('foldergroupingchanged', this, this.groupings, this.active_group);
	},

	/**
	 * Moves a {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} from an existing
	 * group to a new Group in the {@link #groupings}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to move to the other group
	 * @param {String} newGroup The group to which the folder should be moved
	 * @param {String} oldGroup The group from where the folder is moved
	 * @return {String} The groupID to which the folder was added.
	 */
	mergeFolderToGroup : function(folder, newGroup, oldGroup)
	{
		var entryid = folder.get('entryid');
		if (this.groupings[oldGroup]) {
			this.groupings[oldGroup].folders.remove(entryid);
			if (Ext.isEmpty(this.groupings[oldGroup].folders)) {
				delete this.groupings[oldGroup];
			} else if (this.groupings[oldGroup].active == entryid) {
				this.groupings[oldGroup].active = this.groupings[oldGroup].folders[0];
			}
		}
		this.groupings[newGroup].folders.push(entryid);
		this.groupings[newGroup].active = entryid;
		this.active_group = newGroup;

		this.fireEvent('foldergroupingchanged', this, this.groupings, this.active_group);
		return newGroup;
	},

	/**
	 * Move a {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} out of the current group and
	 * create a new group into which the folder should be moved.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to move to a new group
	 * @param {String} oldGroup The group from wehre the folder is moved
	 * @return {String} The groupID to which the folder was added.
	 */
	separateFolderFromGroup : function(folder, oldGroup)
	{
		var groupId = Ext.id(null, 'group-');
		var entryid = folder.get('entryid');
		if (this.groupings[oldGroup]) {
			this.groupings[oldGroup].folders.remove(entryid);
			if (Ext.isEmpty(this.groupings[oldGroup].folders)) {
				delete this.groupings[oldGroup];
			} else if (this.groupings[oldGroup].active == entryid) {
				this.groupings[oldGroup].active = this.groupings[oldGroup].folders[0];
			}
		}
		this.groupings[groupId] = { folders : [ entryid ], active : entryid };
		this.active_group = groupId;

		this.fireEvent('foldergroupingchanged', this, this.groupings, this.active_group);
		return groupId;
	},

	/**
	 * Remove a {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} out of the current group.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to move to a new group
	 * @param {String} oldGroup The group from wehre the folder is moved
	 */
	removeFolderFromGroup : function(folder, oldGroup)
	{
		var entryid = folder.get('entryid');
		if (this.groupings[oldGroup]) {
			this.groupings[oldGroup].folders.remove(entryid);
			if (Ext.isEmpty(this.groupings[oldGroup].folders)) {
				delete this.groupings[oldGroup];
			} else if (this.groupings[oldGroup].active == entryid) {
				this.groupings[oldGroup].active = this.groupings[oldGroup].folders[0];
			}
		}
		this.fireEvent('foldergroupingchanged', this, this.groupings, this.active_group);
	},

	/**
	 * Add an item to a new Group to the {@link #groupings}
	 * @param {String} entryid The entryid to add to a new group
	 * @private
	 */
	addItemToGroup : function(entryid)
	{
		if (this.default_merge_state) {
			// attempt to merge to an existing group
			var keys = Object.keys(this.groupings);
			if (Ext.isEmpty(keys)) {
				// if no other groups - create a new group and set it in groupings
				this.active_group = Ext.id(null, 'group-');
				this.groupings[this.active_group] = { folders : [ entryid ], active : entryid };
			} else {
				this.active_group = keys[0];
				this.groupings[keys[0]].folders.push(entryid);
			}
		} else {
			// create a new group and add it to groupings
			this.active_group = Ext.id(null, 'group-');
			this.groupings[this.active_group] = { folders : [ entryid ], active : entryid };
		}
	},

	/**
	 * Remove an item from the group (and delete the group if empty) in {@link #groupings}.
	 * @param {String} entryid THe entryid to remove from the group
	 * @private
	 */
	removeItemFromGroup : function(entryid)
	{
		Ext.iterate(this.groupings, function(key, group) {
			if(Ext.isEmpty(group.folders)) {
				// continue loop for other groups
				return true;
			}

			var index = group.folders.indexOf(entryid);

			if (index > -1) {
				group.folders.splice(index, 1);

				if (Ext.isEmpty(group.folders)) {
					delete this.groupings[key];

					// If we are removing the currently active group,
					if (this.active_group == key) {
						var keys = Object.keys(this.groupings);
						// then set the last group available as active,
						// or undefined if there are no groups left
						this.active_group = keys.pop();
					}
				}

				// break looping
				return false;
			}
		}, this);
	},

	/**
	 * Update the {@link #groupings} based by removing the folders in the
	 * {@link #groupings} which are no longer listed in {@link #folders}
	 * and add folders to the {@link #groupings} if they were not yet assigned
	 * to a group.
	 * @private
	 */
	applyGrouping : function()
	{
		var entryids = [];
		for (var i = 0, len = this.folders.length; i < len; i++) {
			entryids.push(this.folders[i].get('entryid'));
		}

		var grouped = [];
		Ext.iterate(this.groupings, function(key, group) {
			grouped = grouped.concat(group.folders);
		}, this);

		for (var i = 0, len = grouped.length; i < len; i++) {
			var entryid = grouped[i];
			var index = entryids.indexOf(entryid);

			if (index < 0) {
				// The grouped entryid was not found in the folderslist,
				// it has been deleted so clean the group.
				this.removeItemFromGroup(entryid);
			} else {
				// The grouped entryid was found in the folderslist,
				// remove it from the entryids list.
				entryids.remove(entryid);
			}
		}

		// All items remaining in the entryids list, are the new
		// folders which haven't been assigned to a group yet.
		for (var i = 0, len = entryids.length; i < len; i++) {
			this.addItemToGroup(entryids[i]);
		}
		this.fireEvent('foldergroupingchanged', this, this.groupings, this.active_group);
	},

	/**
	 * Obtain the currently active {@link #groupings}
	 * @return {Object} The folder groupings.
	 */
	getGroupings : function()
	{
		return this.groupings;
	},

	/**
	 * Sorts the folders in the selected folder list so that they are
	 * in the same order as they appear in the folder hierarchy.
	 * @private
	 */
	sortFolders : function()
	{
		// If one folder is selected, sorting doesn't make sense,
		// so only sort when multiple folders are selected.
		if (this.folders.length > 1) {
			this.folders = container.getHierarchyStore().getSortedFolders(this.hasFolder, this);
		}
	},

	/**
	 * Loop through all folders, assigning a color for each folder,
	 * if we don't have sufficient colors, we have to start again from
	 * the start (This obviously means that some colors will appear twice).
	 * A color scheme is assigned for each folder entry id
	 * Note: This functionality has changed after colors became persistent
	 * Now assigning colors will only be done once for existing users that had
	 * calendars open. And it will assign a color for the default calendar 
	 * folder for every new user.
	 * @private
	 */
	assignColors : function()
	{
		this.assigningColors = true;
		for (var i = 0, len = this.folders.length; i < len; i++) {
			// check if folder is already in mapping and add it if it isn't
			this.getColorScheme(this.folders[i].get('entryid'));
		}
		this.assigningColors = false;
	},

	/**
	 * Obtain color scheme for given folder entryid. Fall back to first scheme if folder not in mapping
	 * @param {String} folderId Entry id of a folder
	 * @return {Object} The color scheme as defined in {@link Zarafa.calendar.ui.ColorSchemes color scheme}
	 * for this folder
	 */
	getColorScheme : function(folderId)
	{
		if(!this.colorMap) {
			return undefined;
		}
		
		var colorSchemeName = this.colorMap[folderId];
		var colorScheme = Zarafa.core.ColorSchemes.getColorScheme(colorSchemeName);
		if ( !Ext.isDefined(colorScheme) ){
			// No scheme defined yet. Let's just use a random color scheme.
			colorScheme = this.colorScheme[Math.floor(Math.random()*this.colorScheme.length)];
			this.setColorScheme(folderId, colorScheme);
		}

		return colorScheme;
	},

	/**
	 * Map a folder to a color scheme
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} Folder object to map
	 * @param {Object} Color scheme to map to
	 */
	setColorScheme : function(folderId, scheme)
	{
		this.colorMap[folderId] = scheme.name;
		
		if ( !this.assigningColors ){
			this.fireEvent('colormapchanged', this, this.colorMap);
		}
	},
	
	/**
	 * Obtain the currently active group out of this.groupings
	 */
	getActiveGroup : function()
	{
		return this.active_group;
	},

	/**
	 * Handler for 'foldergroupinchanged' event, which calls {@link #saveState} only
	 * when the groupings or active group has changed.
	 *
	 * @param {Zarafa.core.ContextModel} contextModel the contextModel which states needs to be saved.
	 * @param {Object} groupings The groupings object
	 * @param {String} active The active group
	 */
	saveFolderGroupinChanged : function(model, groupings, active)
	{
		if (this.groupings != groupings || active != this.active_group) {
			this.saveState();
		}
	},

	/**
	 * Register the {@link #stateEvents state events} to the {@link #saveState} callback function.
	 * @protected
	 */
	initStateEvents : function()
	{
		Zarafa.core.MultiFolderContextModel.superclass.initStateEvents.call(this);
		this.on('foldergroupingchanged', this.saveFolderGroupinChanged, this, { delay : 100 });
		// The colorMap is actually does not change when we switch to the calendar context,
		// therefore checking if it's changed is not required.
		this.on('colormapchanged', this.saveState, this, { delay : 100 });
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState : function()
	{
		var state = Zarafa.core.MultiFolderContextModel.superclass.getState.call(this) || {};

		return Ext.apply(state, {
			groupings : this.groupings,
			active_group : this.active_group,
			colorMap : this.colorMap
		});
	},
	
	/**
	 * Apply the given state to this object activating the properties which were previously
	 * saved in {@link Ext.state.Manager}.
	 * @param {Object} state The state object
	 * @protected
	 */
	applyState : function(state)
	{
		if ( Ext.isDefined(state.groupings) ){
			// Check the active folders in the groups
			for ( var groupId in state.groupings ) {
				if ( state.groupings[groupId].folders.indexOf(state.groupings[groupId].active) < 0 ){
					// If the active folder was not found in the folders of the group, then we will
					// change the active folder to the first folder in the group
					state.groupings[groupId].active = state.groupings[groupId].folders[0];
				}
			}
		}
		
		Zarafa.core.MultiFolderContextModel.superclass.applyState.call(this, state);
	},

	/**
	 * Reset all the grouping information
	 */
	resetGroupings : function()
	{
		this.groupings = {};
	}
});
