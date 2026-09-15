/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.recipientfield.ui');

/**
 * @class Grommunio.common.recipientfield.ui.RecipientContextMenu
 * @extends Grommunio.core.ui.menu.ConditionalMenu
 * @xtype grommunio.recipientcontextmenu
 */
Grommunio.common.recipientfield.ui.RecipientContextMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.common.recipientfield.contextmenu.actions
	 * @param {Grommunio.common.recipientfield.ui.RecipientContextMenu} contextmenu This contextmenu
	 */

	/**
	 * @cfg {Boolean} editable
	 * False to prevent any menu item to edit the record on which this menu is shown.
	 */
	editable: true,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var editable = Ext.isDefined(config.editable) ? config.editable : this.editable;
		var resolved = false;
		if (config.records) {
			if (Array.isArray(config.records)) {
				config.records = config.records[0];
			}

			resolved = config.records.isResolved();
		}

		Ext.applyIf(config, {
			items: [{
				xtype: 'grommunio.conditionalitem',
				text: _('Edit Recipient'),
				iconCls: 'icon_edit_recipient',
				hidden: !editable || resolved,
				handler: this.editRecipient,
				scope: this
			},{
				xtype: 'grommunio.conditionalitem',
				text: _('Show Details'),
				iconCls: 'icon_contact',
				hidden: !resolved,
				handler: this.openDetailsContent,
				scope: this
			},{
				xtype: 'grommunio.conditionalitem',
				text: _('Copy email address'),
				iconCls: 'icon_copy',
				hidden: !resolved,
				handler: this.copyEmail,
				scope: this
			},{
				xtype: 'grommunio.conditionalitem',
				text: _('Copy email addresses'),
				iconCls: 'icon_copy_all',
				beforeShow: this.onMenuItemBeforeShow,
				name: 'copyEmailAddresses',
				handler: this.copyEmail,
				scope: this
			},{
				xtype: 'grommunio.conditionalitem',
				text: _('Send email'),
				iconCls: 'icon_new_email',
				handler: this.onEmailRecipient,
				scope: this
			},
				container.populateInsertionPoint('context.common.recipientfield.contextmenu.actions', this),
			{
				xtype: 'menuseparator'
			}]
		});

		Grommunio.common.recipientfield.ui.RecipientContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Handler for the "Edit Recipient" option. This will open the edit contentpanel.
	 *
	 * @private
	 */
	editRecipient: function()
	{
		Grommunio.core.data.UIFactory.openCreateRecord(this.records, {
			manager: Ext.WindowMgr
		});
	},

	/**
	 * Handler for the "Show Details" option. This will convert
	 * the {@link Grommunio.core.dat.IPMRecipientRecord recipient}
	 * into a {@link Grommunio.core.data.MAPIRecord addressbook record}
	 * which can be opened in the Addressbook details content panel.
	 *
	 * @private
	 */
	openDetailsContent: function()
	{
		Grommunio.common.Actions.openViewRecipientContent(this.records);
	},

	/**
	 * Event handler which determines if menu items should be visible or not.
	 * It will hide the menu item if only one recipient on selected filed (To, Cc, BCc).
	 *
	 * @param {Grommunio.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @private
	 */
	onMenuItemBeforeShow: function(item)
	{
		var record = this.records;
		// Hide the context menu if selected recipient is not resolved.
		if (!record.isResolved()) {
			item.setVisible(false);
			return;
		}

		var recipients = Grommunio.common.Actions.getRecipientsByType(record.store, record.get('recipient_type'));
		item.setVisible(recipients.length !== 1);
	},

	/**
	 * Handler for the "Copy email address" and 'Copy email addresses' option. This will
	 * copy email address(es) of the resolved recipient(s).
	 * @param {Grommunio.core.ui.menu.ConditionalItem} item The item which was clicked.
	 */
	copyEmail: function (item)
	{
		var copyAll = item.name === 'copyEmailAddresses';
		Grommunio.common.Actions.copyEmailAddress(this.records, this.records.store, copyAll);
	},

	/**
	 * Handler for the "Email Recipient" option. This will create
	 * a new {@link Grommunio.core.data.MAPIRecord mail record}
	 * and generate new phantom recipient for new mail. Then
	 * it will open a new MailCreate ContentPanel for the new mail
	 *
	 * @private
	 */
	onEmailRecipient: function()
	{
		Grommunio.common.Actions.onEmailRecipient(this.records);
	}
});

Ext.reg('grommunio.recipientcontextmenu', Grommunio.common.recipientfield.ui.RecipientContextMenu);
