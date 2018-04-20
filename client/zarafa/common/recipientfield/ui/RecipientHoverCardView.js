Ext.namespace('Zarafa.common.recipientfield.ui');

/**
 * @class Zarafa.common.recipientfield.ui.RecipientHoverCardView
 * @extends Ext.Window
 * @xtype zarafa.recipienthovercardview
 *
 * It will show/hide card view when recipient field gets mouseenter/mouseleave.
 */
Zarafa.common.recipientfield.ui.RecipientHoverCardView = Ext.extend(Ext.Window, {
	// Insertion points for this class
	/**
	 * @insert context.common.recipientfield.hovercardview.actions
	 * @param {Zarafa.common.recipientfield.ui.RecipientHoverCardView} recipienthovercardview This hover card view
	 */

	/**
	 * @cfg {Boolean} editable
	 * False to prevent any button to edit the record on which this card is shown.
	 */
	editable : true,

	/**
	 * @cfg {Boolean} hasFocus true to recipient card view has focus, false otherwise
	 */
	hasFocus : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
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
		var emailAddress = config.records.get('smtp_address') || config.records.get('email_address');

		config = Ext.applyIf(config, {
			frame: false,
			hidden: false,
			closable: false,
			resizable: false,
			cls :'k-recipient-card-view',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			width: 250,
			height: 100,
			border: false,
			items: [{
				layout: {
					type: 'hbox'
				},
				height: 25,
				border: false,
				items: [{
					xtype: 'displayfield',
					html: this.getDisplayName(config.records)
				}]
			}, {
				layout: {
					type: 'hbox',
					align: 'middle'
				},
				height: 35,
				border: false,
				items: [{
					xtype: 'displayfield',
					value: Ext.util.Format.ellipsis(emailAddress, 30),
					cls: 'k-hover-card-email-text'
				}, {
					xtype: 'zarafa.recipienthovercardbutton',
					iconCls: 'icon_copy',
					hidden: !resolved,
					handler: this.copyEmail,
					tooltip: _('Copy email address'),
					scope: this
				}]
			}],
			buttonAlign: 'left',
			buttons: [{
				xtype: 'zarafa.recipienthovercardbutton',
				text: _('Show Details'),
				iconCls: 'icon_contact',
				hidden: !resolved,
				handler: this.openDetailsContent,
				scope: this
			},
				'->',
				container.populateInsertionPoint('context.common.recipientfield.hovercardview.actions', this),
			{
				xtype: 'zarafa.recipienthovercardbutton',
				iconCls: 'icon_edit_recipient',
				hidden: !editable || resolved,
				handler: this.editRecipient,
				scope: this
			}, {
				xtype: 'zarafa.recipienthovercardbutton',
				iconCls: 'icon_send_email_to_recipient',
				handler: this.emailRecipient,
				scope: this
			}]
		});

		Zarafa.common.recipientfield.ui.RecipientHoverCardView.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the component.
	 * This will register the card view window and window resize event.
	 * @private
	 */
	initComponent: function ()
	{
		Ext.EventManager.onWindowResize(this.hide, this);
		Ext.WindowMgr.register(this);
		Zarafa.common.recipientfield.ui.RecipientHoverCardView.superclass.initComponent.call(this);
	},

	/**
	 * Displays this card at a specific xy position and fires the 'show' event if a
	 * handler for the 'beforeshow' event does not return false cancelling the operation.
	 * @param {Array} xy Contains X & Y [x, y] values for the position at which to show the menu (coordinates are page-based)
	 */
	showAt: function (xy)
	{
		if (this.fireEvent('beforeshow', this) !== false) {
			if (!this.el) {
				this.render(Ext.getBody());
			}
			//constrain to the viewport.
			xy = this.el.adjustForConstraints(xy);
			this.el.setXY(xy);
			this.el.show();
			this.focus();
			this.fireEvent('show', this);
			this.mon(this.el, 'mouseleave', this.onMouseLeave, this);
			this.mon(this.el, 'mouseenter', this.onMouseEnter, this);
		}
	},

	/**
	 * Hide the card view and unregister the card view window.
	 */
	hide: function ()
	{
		this.hasFocus = false;
		Zarafa.common.recipientfield.ui.RecipientHoverCardView.superclass.hide.call(this);
		Ext.WindowMgr.unregister(this);
	},

	/**
	 * Event handler handel mouse leave event it will hide recipient card view
	 */
	onMouseLeave: function ()
	{
		this.hide();
	},

	/**
	 * Event handler handel mouse enter event it will update {@link #hasFocus}.
	 */
	onMouseEnter: function ()
	{
		this.hasFocus = true;
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
	 * the {@link Zarafa.core.data.IPMRecipientRecord recipient}
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
	 * Handler for the "Copy email address" option. This will
	 * copy email address of the resolved recipient.
	 */
	copyEmail : function ()
	{
		Zarafa.common.Actions.copyEmailAddress(this.records);
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
	},

	/**
	 * Function will will return html template that contain display name along with presence status.
	 * @param {Ext.data.Record} record which will show in hover card view.
	 * @returns {string} html string contains display name with presence status.
	 */
	getDisplayName: function (record)
	{
		return '<span class="zarafa-presence-status ' + Zarafa.core.data.PresenceStatus.getCssClass(record.get('presence_status')) + '">' +
			' <span class="zarafa-presence-status-icon"></span>' + Ext.util.Format.ellipsis(record.get('display_name'), 30) + '</span>';
	}
});

Ext.reg('zarafa.recipienthovercardview', Zarafa.common.recipientfield.ui.RecipientHoverCardView);
