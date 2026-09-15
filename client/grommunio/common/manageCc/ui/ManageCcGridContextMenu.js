/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.manageCc.ui');

/**
 * @class Grommunio.common.manageCc.ui.ManageCcGridContextMenu
 * @extends Grommunio.core.ui.menu.ConditionalMenu
 * @xtype grommunio.manageccgridcontextmenu
 *
 * Context menu provides the buttons to enable/disable the Cc recipients in new or reply mails.
 */
Grommunio.common.manageCc.ui.ManageCcGridContextMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: [{
				xtype: 'grommunio.conditionalitem',
				iconCls : 'icon_new_email',
				name : 'new_mail',
				beforeShow: this.onBeforeShowMenuItem,
				handler : this.onClickMenuItem,
				scope: this
			},{
				xtype: 'grommunio.conditionalitem',
				name : 'reply_mail',
				iconCls : 'icon_mail_replied',
				beforeShow: this.onBeforeShowMenuItem,
				handler : this.onClickMenuItem,
				scope: this
			}]
		});

		Grommunio.common.manageCc.ui.ManageCcGridContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which update the text for the menu item if
	 *
	 * @param {Grommunio.core.ui.menu.ConditionalItem} item The menu item text needs to update.
	 * @param {Grommunio.common.manageCc.data.IPMCcRecipientRecord} record The record which is selected.
	 */
	onBeforeShowMenuItem : function(item, record)
	{
		var menuItemText;
		if (item.name === 'new_mail') {
			menuItemText = record.get(item.name) ?  _('Disable for new mail') : _('Enable for new mail');
		} else {
			menuItemText = record.get(item.name) ?  _('Disable for replies') : _('Enable for replies');
		}
		item.setText(menuItemText);
	},

	/**
	 * Event handler triggered when "set/unset for new/reply mail" menu item clicked.
	 *
	 * @param {Grommunio.core.ui.menu.ConditionalItem} item The menu item which is selected.
	 */
	onClickMenuItem : function (item)
	{
		var record = this.records;
		record.set(item.name, !record.get(item.name));
	}
});

Ext.reg('grommunio.manageccgridcontextmenu', Grommunio.common.manageCc.ui.ManageCcGridContextMenu);
