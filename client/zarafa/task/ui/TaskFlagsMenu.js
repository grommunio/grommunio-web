Ext.namespace('Zarafa.common.flags.ui');

/**
 * @class Zarafa.task.ui.TaskFlagsMenu
 * @extends Zarafa.common.flags.ui.FlagsMenu
 * @xtype zarafa.taskflagsmenu
 *
 * The TaskFlagsMenu is the menu that is shown for flags.
 */
Zarafa.task.ui.TaskFlagsMenu = Ext.extend(Zarafa.common.flags.ui.FlagsMenu, {
	/**
	 * @cfg {Boolean} saveOnSetFlag True to save record just
	 * after set flags properties in selected record else
	 * don't save record.
	 */
	saveOnSetFlag : true,

	/**
	 * Action should perform on selected record(s).
	 * default is undefined
	 * @property
	 * @type String
	 */
	action : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = Ext.applyIf(config || {}, {
			xtype: 'zarafa.taskflagsmenu'
		});

		Zarafa.task.ui.TaskFlagsMenu.superclass.constructor.call(this, config);
	},
	/**
	 * Event handler for the click event of the items in the flag menu. Will set the required properties
	 * on the selected records.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} menuItem The menu item that was clicked
	 */
	setFlag : function(menuItem)
	{
		this.action = menuItem.action;
		Zarafa.task.ui.TaskFlagsMenu.superclass.setFlag.apply(this, arguments);
	},

	/**
	 * Set necessary flag related properties into given record(s).
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record(s) for which configured flag needs to be set.
	 * @param {Object} flagProperties Necessary flag properties
	 */
	setFlagProperties : function (records, flagProperties)
	{
		records.forEach(function(record){
			record.beginEdit();
			for ( var property in flagProperties ){
				if(property === 'startdate' || property === 'duedate' || property === 'reminder_time') {
					continue;
				}
				record.set(property, flagProperties[property]);
			}
			// - If action is 'complete' then mark all selected records
			// to complete.
			// - If action is other then complete and
			// from selected records some record are completed then
			// make only those records to incomplete.
			if (this.action === 'complete') {
				record.set('percent_complete', 1);
				record.set('status', Zarafa.core.mapi.TaskStatus.COMPLETE);
			} else if (record.get('complete')) {
				record.set('complete', false);
				record.set('percent_complete', 0);
				record.set('status', Zarafa.core.mapi.TaskStatus.NOT_STARTED);
			}

			var startDate = flagProperties['startdate'];
			var dueDate = flagProperties['duedate'];
			// Condition gets false only when action type no_date
			if (Ext.isDate(startDate) && Ext.isDate(dueDate)) {
				startDate = startDate.clearTime();
				dueDate = dueDate.clearTime();
				record.set('startdate', startDate.fromUTC());
				record.set('commonstart', startDate.clone());
				record.set('duedate', dueDate.fromUTC());
				record.set('commonend', dueDate.clone());
			} else if (this.action !== 'complete') {
				record.set('startdate', startDate);
				record.set('commonstart', startDate);
				record.set('duedate', dueDate);
				record.set('commonend', dueDate);
			}
			record.endEdit();
			if (this.saveOnSetFlag) {
				// Task is assigned task then send an update
				// to assigner when it's updated. Flag menu visible
				// only for received/assignee task copy.
				if (record.isMessageClass('IPM.Task') && !record.isNormalTask()) {
					record.respondToTaskRequest(Zarafa.core.mapi.TaskMode.UPDATE);
				} else {
					record.save();
				}
			}
		}, this);
	}
});

Ext.reg('zarafa.taskflagsmenu', Zarafa.task.ui.TaskFlagsMenu);
