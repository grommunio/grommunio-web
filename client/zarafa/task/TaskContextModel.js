Ext.namespace('Zarafa.task');

/**
 * @class Zarafa.task.TaskContextModel
 * @extends Zarafa.core.ContextModel
 */
Zarafa.task.TaskContextModel = Ext.extend(Zarafa.core.ContextModel, {
	/**
	 * When searching, this property marks the {@link Zarafa.core.ContextModel#getCurrentDataMode datamode}
	 * which was used before {@link #onSearchStart searching started} the datamode was switched to
	 * {@link Zarafa.task.data.DataModes#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldDataMode : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if(!Ext.isDefined(config.store)) {
			config.store = new Zarafa.task.TaskStore();
		}

		Ext.applyIf(config, {
			statefulRecordSelection: true,
			current_data_mode : Zarafa.task.data.DataModes.ALL
		});

		Zarafa.task.TaskContextModel.superclass.constructor.call(this, config);

		this.on({
			'searchstart' : this.onSearchStart,
			'searchstop' : this.onSearchStop,
			scope : this
		});
	},

	/**
	 * Create a new {@link Zarafa.core.data.IPMRecord IPMRecord} which must be used within
	 * this {@link Zarafa.task.dialogs.TaskEditContentPanel TaskEditContentPanel}.
	 * @param {Zarafa.core.IPMFolder} folder (optional) The target folder in which the new record must be
	 * created. If this is not provided the default folder will be used.
	 * @return {Zarafa.core.data.IPMRecord} The new {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 */
	createRecord : function(folder)
	{
		folder = folder || this.getDefaultFolder();

		if (folder.isTodoListFolder()) {
			folder = container.getHierarchyStore().getDefaultFolderFromMessageClass('IPM.Task');
		}

		var defaultStore = folder.getMAPIStore();

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Task', {
			store_entryid : folder.get('store_entryid'),
			parent_entryid : folder.get('entryid'),
			icon_index : Zarafa.core.mapi.IconIndex['task'],
			owner : defaultStore.isPublicStore() ? container.getUser().getFullName() : defaultStore.get('mailbox_owner_name')
		});

		return record;
	},

	/**
	 * Event handler which is executed right before the {@link #datamodechange}
	 * event is fired. This allows subclasses to initialize the {@link #store}.
	 * This will apply filtering to the {@link #store} if needed.
	 *
	 * @param {Zarafa.task.TaskContextModel} model The model which fired the event.
	 * @param {Zarafa.task.data.DataModes} newMode The new selected DataMode.
	 * @param {Zarafa.task.data.DataModes} oldMode The previously selected DataMode.
	 * @private
	 */
	onDataModeChange : function(model, newMode, oldMode)
	{
		Zarafa.task.TaskContextModel.superclass.onDataModeChange.call(this, model, newMode, oldMode);

		if (newMode !== oldMode && oldMode === Zarafa.task.data.DataModes.SEARCH) {
			this.stopSearch();
		}
		var restriction = [];

		// also reload the store
		switch (newMode) {
			case Zarafa.task.data.DataModes.SEARCH:
				this.store.clearFilter();
				break;
			case Zarafa.task.data.DataModes.ALL:
				this.store.clearFilter();
				break;
			case Zarafa.task.data.DataModes.ACTIVE:
				restriction = this.prepareRestriction('complete','RELOP_EQ',false);
				break;
			case Zarafa.task.data.DataModes.NEXT_7_DAYS:
				var currentDay = new Date().clearTime();
				var nextSevenDay = currentDay.clone().add(Date.DAY, 7);
				restriction = Zarafa.core.data.RestrictionFactory.createResAnd([
					this.prepareRestriction('duedate','RELOP_GT',currentDay.getTime() / 1000),
					this.prepareRestriction('duedate','RELOP_LT',nextSevenDay.getTime() / 1000)
				]);
				break;
			case Zarafa.task.data.DataModes.OVERDUE:
				var currentDay = new Date().clearTime();
				restriction = Zarafa.core.data.RestrictionFactory.createResAnd([
					this.prepareRestriction('duedate','RELOP_LT',currentDay.getTime() / 1000),
					this.prepareRestriction('complete','RELOP_EQ',false)
				]);
				break;
			case Zarafa.task.data.DataModes.COMPLETED:
				restriction = this.prepareRestriction('complete','RELOP_EQ',true);
				break;
		}
		this.load({
			params : {
				restriction : {
					task : restriction
				}
			}
		});
	},

	/**
	 * Function is use to prepare data restriction which is used to check value of properties using logical operators
	 *
	 * @param {String} property whose value should be checked.
	 * @param {Number} operator relational operator that will be used for comparison.
	 * @param {Mixed} value that should be used for checking.
	 * @returns {Array} restriction.
     */
	prepareRestriction : function (property,operator,value)
	{
		return  Zarafa.core.data.RestrictionFactory.dataResProperty(property, Zarafa.core.mapi.Restrictions[operator], value);
	},

	/**
	 * Event handler for the {@link #searchstart searchstart} event.
	 * This will {@link #setDataMode change the datamode} to {@link Zarafa.task.data.DataModes#SEARCH search mode}.
	 * The previously active {@link #getCurrentDataMode view} will be stored in the {@link #oldDataMode} and will
	 * be recovered when the {@link #onSearchStop search is stopped}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStart : function(model)
	{
		if(this.getCurrentDataMode() != Zarafa.task.data.DataModes.SEARCH){
			this.oldDataMode = this.getCurrentDataMode();
			this.setDataMode(Zarafa.task.data.DataModes.SEARCH);
		}
	},

	/**
	 * Event handler for the {@link #searchstop searchstop} event.
	 * This will {@link #setDataMode change the datamode} to the {@link #oldDataMode previous datamode}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStop : function(model)
	{
		if (this.getCurrentDataMode() === Zarafa.task.data.DataModes.SEARCH) {
			this.setDataMode(this.oldDataMode);
		}
		delete this.oldDataMode;
	},

	/**
	 * Function will check if last used folders is empty then
	 * Sets todolist folder as an {@link #defaultFolder default folder} for the
	 * {@link Zarafa.task.TaskContext task context}.
	 *
	 * @param {Zarafa.core.hierarchyStore} hierarchyStore that holds hierarchy data.
	 * @private
	 */
	onHierarchyLoad : function(hierarchyStore)
	{
		// only continue when hierarchyStore has data
		if (hierarchyStore.getCount() === 0) {
			return;
		}

		if (Ext.isEmpty(this.last_used_folders)) {
			var folder = hierarchyStore.getDefaultFolder('todolist');
			if(folder) {
				var entryid = folder.get('entryid');
				var storeentryid = folder.get('store_entryid');
				this.last_used_folders = {};
				this.last_used_folders[storeentryid] = [entryid];
			}
		}

		Zarafa.task.TaskContextModel.superclass.onHierarchyLoad.call(this, hierarchyStore);
	}
});
