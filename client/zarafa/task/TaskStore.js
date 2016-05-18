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
	constructor : function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass : 'IPM.Task',
			defaultSortInfo : {
				field : 'duedate',
				direction : 'desc'
			}
		});

		Zarafa.task.TaskStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.taskstore', Zarafa.task.TaskStore);
