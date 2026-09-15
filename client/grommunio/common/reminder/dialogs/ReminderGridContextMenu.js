/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.reminder.dialogs');

/**
 * @class Grommunio.common.reminder.dialogs.ReminderGridContextMenu
 * @extends Grommunio.core.ui.menu.ConditionalMenu
 * @xtype grommunio.remindergridcontextmenu
 */
Grommunio.common.reminder.dialogs.ReminderGridContextMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.common.reminder.contentpanel.contextmenu.actions
	 * Insertion point for adding actions menu items into the context menu
	 * @param {Grommunio.common.reminder.dialogs.ReminderGridContextMenu} contextmenu This contextmenu
	 */
	/**
	 * @insert context.common.reminder.contentpanel.contextmenu.options
	 * Insertion point for adding options menu items into the context menu
	 * @param {Grommunio.common.reminder.dialogs.ReminderGridContextMenu} contextmenu This contextmenu
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

		Grommunio.common.reminder.dialogs.ReminderGridContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create the Action context menu items.
	 * @return {Grommunio.core.ui.menu.ConditionalItem[]} The list of Action context menu items
	 * @private
	 */
	createContextActionItems : function()
	{
		return [{
			xtype : 'grommunio.conditionalitem',
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
		Grommunio.common.Actions.openReminderRecord(this.records);
	}
});

Ext.reg('grommunio.remindergridcontextmenu', Grommunio.common.reminder.dialogs.ReminderGridContextMenu);
