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
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

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
			handler: function() {
				Zarafa.task.Actions.openTaskContent(this.records);
			},
			scope: this
		},{
			//Print button, hide this as this functionality is still not implemented, so hide this button
			hidden: true,
			xtype: 'zarafa.conditionalitem',
			text : _('Print'),
			iconCls : 'icon_print',
			handler: function() {
				Zarafa.common.Actions.openPrintDialog(this.records);
			},
			scope: this
		}];
	},


	/**
	 * Create the Option context menu items
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of Option context menu items
	 * @private
	 */
	createContextOptionsItems : function()
	{
		return [{
			xtype: 'zarafa.conditionalitem',
			text : _('Categories'),
			iconCls : 'icon_categories',
			handler : function() {
				Zarafa.common.Actions.openCategoriesContent(this.records);
			},
			scope: this
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
	 * Event handler which is called when the user selects the 'delete'
	 * item in the context menu. This will delete all selected records.
	 * @private
	 */
	onContextItemDelete : function()
	{
		var store;

		Ext.each(this.records, function(record) {
			store = record.store;
			store.remove(record);
		}, this);

		store.save(this.records);
	},

	/**
	 * Event handler which determines if the Read Flag button must be shown.
	 * There are two kind of read flag buttons which can both make use of this
	 * function (Mark as Read and Mark as Unread buttons).
	 *
	 * This function will loop through all given {@link Zarafa.core.data.IPMRecord records}
	 * and will determine if this button can be applied to any of the records.
	 * For example, if 10 records are selected and one or more are marked as read,
	 * the Mark as Unread button will be enabled. If no records are marked as read,
	 * the button will not be enabled.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Zarafa.core.data.IPMRecord[]} records The records which must be checked
	 * to see if the item must be enabled or disabled.
	 * @param {Boolean} read The required Read state value for one or more Records before
	 * this item is enabled.
	 * @private
	 */
	onReadFlagItemBeforeShow : function(item, records, read)
	{
		var count = 0;

		Ext.each(records, function(record) {
			if (record.isRead() === read) {
				count++;
			}
		}, this);

		item.setDisabled(count === 0);
	}
});

Ext.reg('zarafa.taskcontextmenu', Zarafa.task.ui.TaskContextMenu);
