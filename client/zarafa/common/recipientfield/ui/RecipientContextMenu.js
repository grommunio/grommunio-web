Ext.namespace('Zarafa.common.recipientfield.ui');

/**
 * @class Zarafa.common.recipientfield.ui.RecipientContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.recipientcontextmenu
 */
Zarafa.common.recipientfield.ui.RecipientContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.common.recipientfield.contextmenu.actions
	 * @param {Zarafa.common.recipientfield.ui.RecipientContextMenu} contextmenu This contextmenu
	 */

	/**
	 * @cfg {Boolean} editable
	 * False to prevent any menu item to edit the record on which this menu is shown.
	 */
	editable : true,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
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
				xtype: 'zarafa.conditionalitem',
				text: _('Edit Recipient'),
				iconCls : 'icon_edit_recipient',
				hidden : !editable || resolved,
				handler: this.editRecipient,
				scope: this
			},{
				xtype: 'zarafa.conditionalitem',
				text: _('Show Details'),
				iconCls : 'icon_contact',
				hidden : !resolved,
				handler: this.openDetailsContent,
				scope: this
			},{
				xtype: 'zarafa.conditionalitem',
				text: _('Send e-mail'),
				iconCls : 'icon_send_email_to_recipient',
				handler: this.emailRecipient,
				scope: this
			},
				container.populateInsertionPoint('context.common.recipientfield.contextmenu.actions', this),
			{
				xtype: 'menuseparator'
			}]
		});

		Zarafa.common.recipientfield.ui.RecipientContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Handler for the "Edit Recipient" option. This will open the edit contentpanel.
	 *
	 * @private
	 */
	editRecipient : function()
	{
		Zarafa.core.data.UIFactory.openCreateRecord(this.records, {
			manager : Ext.WindowMgr
		});
	},

	/**
	 * Handler for the "Show Details" option. This will convert
	 * the {@link Zarafa.core.dat.IPMRecipientRecord recipient}
	 * into a {@link Zarafa.core.data.MAPIRecord addressbook record}
	 * which can be opened in the Addressbook details content panel.
	 *
	 * @private
	 */
	openDetailsContent : function()
	{
		Zarafa.common.Actions.openViewRecipientContent(this.records);
	},

	/**
	 * Handler for the "E-mail Recipient" option. This will create
	 * a new {@link Zarafa.core.data.MAPIRecord mail record}
	 * and generate new phantom recipient for new mail. Then
	 * it will open a new MailCreate ContentPanel for the new mail
	 *
	 * @private
	 */
	emailRecipient : function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('drafts');
		var context = container.getContextByFolder(folder);
		var model = context.getModel();

		var record = model.createRecord(folder);

		var recipientStore = record.getRecipientStore();
		var recipientRecord = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, this.records.data);

		// Make sure the recipient is of type MAPI_TO, the original recipient might have
		// been a CC or BCC. But now we want to directly email him.
		recipientRecord.set('recipient_type', Zarafa.core.mapi.RecipientType.MAPI_TO);

		recipientStore.add(recipientRecord);

		Zarafa.core.data.UIFactory.openCreateRecord(record);
	}
});

Ext.reg('zarafa.recipientcontextmenu', Zarafa.common.recipientfield.ui.RecipientContextMenu);
