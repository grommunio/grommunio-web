Ext.namespace('Zarafa.common.reminder.dialogs');

/**
 * @class Zarafa.common.reminder.dialogs.ReminderGridContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.remindergridcontextmenu
 */
Zarafa.common.reminder.dialogs.ReminderGridContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.common.reminder.contentpanel.contextmenu.actions
	 * Insertion point for adding actions menu items into the context menu
	 * @param {Zarafa.common.reminder.dialogs.ReminderGridContextMenu} contextmenu This contextmenu
	 */
	/**
	 * @insert context.common.reminder.contentpanel.contextmenu.options
	 * Insertion point for adding options menu items into the context menu
	 * @param {Zarafa.common.reminder.dialogs.ReminderGridContextMenu} contextmenu This contextmenu
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: [
				this.createContextActionItems(),
				{ xtype: 'menuseparator' },
				container.populateInsertionPoint('context.common.reminder.contentpanel.contextmenu.actions', this),
				{ xtype: 'menuseparator' },
				container.populateInsertionPoint('context.common.reminder.contentpanel.contextmenu.options', this)
			]
		});

		Zarafa.common.reminder.dialogs.ReminderGridContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create the Action context menu items.
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of Action context menu items
	 * @private
	 */
	createContextActionItems : function()
	{
		return [{
			xtype : 'zarafa.conditionalitem',
			text : _('Open'),
			iconCls : 'icon_open',
			singleSelectOnly : true,
			handler : this.onContextItemOpen,
			scope : this
		}];
	},

	/**
	 * Event handler which is called when the user selects the 'Open'
	 * item in the context menu. This will open the item in a new dialog.
	 * @private
	 */
	onContextItemOpen : function()
	{
		Zarafa.common.Actions.openReminderRecord(this.records);
	}
});

Ext.reg('zarafa.remindergridcontextmenu', Zarafa.common.reminder.dialogs.ReminderGridContextMenu);
