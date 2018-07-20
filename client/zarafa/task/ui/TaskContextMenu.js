Ext.namespace('Zarafa.task.ui');

/**
 * @class Zarafa.task.ui.TaskContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.taskcontextmenu
 */
Zarafa.task.ui.TaskContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.task.contextmenu.actions
	 * Insertion point for adding actions menu items into the context menu
	 * @param {Zarafa.task.ui.TaskContextMenu} contextmenu This contextmenu
	 */
	/**
	 * @insert context.task.contextmenu.options
	 * Insertion point for adding options menu items into the context menu
	 * @param {Zarafa.task.ui.TaskContextMenu} contextmenu This contextmenu
	 */

	/**
	 * @cfg {Zarafa.core.data.IPMRecord[]} The records on which this context menu acts
	 */
	records: undefined,

	/**
	 * @cfg {Boolean} actsOnTodoListFolder when this context menu used by To-do list
	 * folder this config will be true. default is false.
	 */
	actsOnTodoListFolder : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (Ext.isDefined(config.records) && !Array.isArray(config.records)) {
			config.records = [ config.records ];
		}

		this.records = config.records;
		Ext.applyIf(config, {
			items : [
				this.createContextActionItems(),
				{ xtype : 'menuseparator' },
				container.populateInsertionPoint('context.task.contextmenu.actions', this),
				{ xtype : 'menuseparator' },
				this.createContextOptionsItems(),
				{ xtype: 'menuseparator' },
				container.populateInsertionPoint('context.task.contextmenu.options', this)
			]
		});

		Zarafa.task.ui.TaskContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create the Action context menu items
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of Action context menu items
	 * @private
	 */
	createContextActionItems : function()
	{
		return [{
			xtype: 'zarafa.conditionalitem',
			text : _('Open'),
			iconCls : 'icon_open',
			singleSelectOnly: true,
			handler: this.onOpenTask,
			scope: this
		},{
			xtype: 'zarafa.conditionalitem',
			text : _('Follow up'),
			iconCls : 'icon_flag_red',
			cls: 'k-unclickable',
			hideOnClick: false,
			beforeShow: this.onBeforeShowFollowUp,
			menu : {
				xtype: 'zarafa.taskflagsmenu',
				records: this.records
			},
			scope: this
		},{
			xtype: 'zarafa.conditionalitem',
			text: _('Mark Complete'),
			iconCls: 'icon_task_complete',
			isMarkComplete: true,
			beforeShow: this.onMarkCompleteItemBeforeShow,
			handler: this.onMarkCompleteItemClick,
			scope: this
		},{
			xtype: 'zarafa.conditionalitem',
			text: _('Mark Incomplete'),
			iconCls: 'icon_task_incomplete',
			isMarkComplete: false,
			beforeShow: this.onMarkCompleteItemBeforeShow,
			handler: this.onMarkCompleteItemClick,
			scope: this
		},{
			text : _('Copy/Move'),
			iconCls : 'icon_copy',
			handler: this.onCopyMove,
			scope: this
		}];
	},

	/**
	 * Create the Option context menu items
	 *
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of Option context menu items
	 * @private
	 */
	createContextOptionsItems : function()
	{
		return [{
			xtype: 'zarafa.conditionalitem',
			text : _('Categories'),
			cls: 'k-unclickable',
			iconCls : 'icon_categories',
			hideOnClick: false,
			menu: {
				xtype: 'zarafa.categoriescontextmenu',
				records: this.records
			}
		},{
			xtype: 'zarafa.conditionalitem',
			text : _('Delete'),
			iconCls : 'icon_delete',
			nonEmptySelectOnly:  true,
			handler: this.onContextItemDelete,
			scope: this
		}];
	},

	/**
	 * Event handler triggers before the item shows. Disable the
	 * item If the selected record(s) has an organizer task copy
	 * or received task which was not yet accepted.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Zarafa.core.data.IPMRecord[]} records The records which must be checked
	 * to see if the item must be enabled or disabled.
	 * @private
	 */
	onBeforeShowFollowUp : function (item,records)
	{
		if(!Array.isArray(records)) {
			records = [records];
		}
		var isDisabled = records.some(function (record) {
			return record.isMessageClass('IPM.Task', true) && (record.isTaskOrganized() || record.isTaskNotResponded());
		});
		item.setDisabled(isDisabled);
	},

	/**
	 * Event handler called when the user clicks the 'open' button
	 * @private
	 */
	onOpenTask : function()
	{
		Zarafa.common.Actions.openMessageContent(this.records);
	},

	/**
	 * Open the {@link Zarafa.common.dialogs.CopyMoveContentPanel CopyMoveContentPanel} for copying
	 * or moving the currently selected tasks/task requests.
	 * @private
	 */
	onCopyMove : function()
	{
		Zarafa.common.Actions.openCopyMoveContent(this.records);
	},

	/**
	 * Event handler which is called when the user selects the 'delete'
	 * item in the context menu. This will delete all selected records.
	 * @private
	 */
	onContextItemDelete : function()
	{
		Zarafa.common.Actions.deleteRecords(this.records);
	},

	/**
	 * Event handler which is called when the user select "Mark Complete / Mark InComplete" item in the context menu.
	 * This will mark the all selected records as "complete/IncComplete".
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to Mark Complete/Mark InComplete
	 * @private
	 */
	onMarkCompleteItemClick: function (item)
	{
		var complete = item.isMarkComplete;
		var showWarning = false;
		Ext.each(this.records, function (record) {
			record.beginEdit();
			record.set('complete', complete);
			record.set('percent_complete', complete);
			record.set('status', complete ? Zarafa.core.mapi.TaskStatus.COMPLETE : Zarafa.core.mapi.TaskStatus.NOT_STARTED);
			record.set('date_completed', complete ? new Date() : null);
			record.set('flag_icon', complete ? Zarafa.core.mapi.FlagIcon.clear : Zarafa.core.mapi.FlagIcon.red);
			record.set('flag_complete_time', complete ? new Date() : null);
			record.set('flag_request', complete ? '' : 'Follow up');
			record.set('flag_status', complete ? Zarafa.core.mapi.FlagStatus.completed : Zarafa.core.mapi.FlagStatus.flagged);
			record.endEdit();

			if (!record.isNormalTask()) {
				if (!record.isTaskOwner() && !record.isTaskRequest()) {
					showWarning = true;
				} else {
					record.addMessageAction('response_type', Zarafa.core.mapi.TaskMode.UPDATE);
				}
			}
		}, this);

		if (showWarning) {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg :_('Please note that assigned task(s) will be overwritten when the assignee makes changes.'),
				icon: Ext.MessageBox.WARNING,
				buttons: Ext.MessageBox.OK
			});
		}
		if (!Ext.isEmpty(this.records) && Ext.isDefined(this.records[0])) {
			this.records[0].getStore().save();
		}
	},

    /**
     * Function will loop through all given {@link Zarafa.core.data.IPMRecord records}
     * and will determine if this button can be applied to any of the records.
     * For example, Selected task is marked completed then 'Mark Incomplete' button enabled,
	 * if selected task is incomplete then 'Mark complete' button enabled.
     *
     * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
     * @param {Zarafa.core.data.IPMRecord[]} records The records which must be checked
     * to see if the item must be enabled or disabled.
     * @private
     */
    onMarkCompleteItemBeforeShow: function (item, records)
	{
		var isDisabled = true;
		if(this.actsOnTodoListFolder !== true) {
			isDisabled = !records.some(function (record) {
				return record.get('complete') !== item.isMarkComplete;
			});
		}
		item.setDisabled(isDisabled);
    }
});

Ext.reg('zarafa.taskcontextmenu', Zarafa.task.ui.TaskContextMenu);
