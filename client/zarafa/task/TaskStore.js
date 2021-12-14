Ext.namespace('Zarafa.task');

/**
 * @class Zarafa.task.TaskStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.taskstore
 *
 * this will contain all records fetched from the server side code
 */
Zarafa.task.TaskStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor: function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass: 'IPM.Task',
			defaultSortInfo: {
				field: 'duedate',
				direction: 'desc'
			}
		});

		Zarafa.task.TaskStore.superclass.constructor.call(this, config);
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Zarafa.core.data.Notifications#objectCreated objectCreated}
	 * notification has been received.
	 *
	 * Because it is unknown if the added record must be visible, or where
	 * in the Store the record must be shown, we simply reload the entire
	 * store to get all updates if current selected folder is To-Do list
	 * folder
	 *
	 * @param {Zarafa.core.data.Notifications} action The notification action
	 * @param {Array} records The {@link Zarafa.core.data.IPFStore folder}record(s)
	 * which have been affected by the notification.
	 * @private
	 */
	onNotifyObjectcreated: function(action, records)
	{
		var model = container.getCurrentContext().getModel();
		// Reload task grid only when selected folder is
		// To-Do list folder.
		if (model.getDefaultFolder().isTodoListFolder()) {
			this.reload({folder: records});
		} else {
			Zarafa.task.TaskStore.superclass.onNotifyObjectcreated.apply(this, arguments);
		}
	},

	/**
	 * Function is use to prepare data restriction which is used to check value of properties using logical operators
	 *
	 * @param {String} property whose value should be checked.
	 * @param {Number} operator relational operator that will be used for comparison.
	 * @param {Mixed} value that should be used for checking.
	 * @returns {Array} restriction.
   */
	prepareRestriction: function (property,operator,value)
	{
		return Zarafa.core.data.RestrictionFactory.dataResProperty(property, Zarafa.core.mapi.Restrictions[operator], value);
	},

	/**
	 * Function which provides the restriction based on the given {@link Zarafa.task.data.DataModes datemode}
	 *
	 * @param {Zarafa.task.data.DataModes} datamode The datamode based on which restriction is prepared.
	 * @return {Array|false} returns restriction according to filter else false.
	 */

	getFilterRestriction: function(datamode)
	{
		var restriction = [];
		switch (datamode) {
			case Zarafa.task.data.DataModes.SEARCH:
				this.clearFilter();
				break;
			case Zarafa.task.data.DataModes.ALL:
				this.clearFilter();
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
		return restriction;
	}
});

Ext.reg('zarafa.taskstore', Zarafa.task.TaskStore);
