Ext.namespace('Zarafa.common.manageCc.ui');

/**
 * @class Zarafa.common.manageCc.ui.ManageCcGridContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.manageccgridcontextmenu
 *
 * Context menu provides the buttons to enable/disable the Cc recipients in new or reply mails.
 */
Zarafa.common.manageCc.ui.ManageCcGridContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: [{
				xtype: 'zarafa.conditionalitem',
				iconCls : 'icon_new_email',
				name : 'new_mail',
				beforeShow: this.onBeforeShowMenuItem,
				handler : this.onClickMenuItem,
				scope: this
			},{
				xtype: 'zarafa.conditionalitem',
				name : 'reply_mail',
				iconCls : 'icon_mail_replied',
				beforeShow: this.onBeforeShowMenuItem,
				handler : this.onClickMenuItem,
				scope: this
			}]
		});

		Zarafa.common.manageCc.ui.ManageCcGridContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which update the text for the menu item if
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The menu item text needs to update.
	 * @param {Zarafa.common.manageCc.data.IPMCcRecipientRecord} record The record which is selected.
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
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The menu item which is selected.
	 */
	onClickMenuItem : function (item)
	{
		var record = this.records;
		record.set(item.name, !record.get(item.name));
	}
});

Ext.reg('zarafa.manageccgridcontextmenu', Zarafa.common.manageCc.ui.ManageCcGridContextMenu);
