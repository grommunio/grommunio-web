Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.ShowMailToolbar
 * @extends Zarafa.core.ui.ContentPanelToolbar
 * @xtype mail.showmailtoolbar
 */
Zarafa.mail.dialogs.ShowMailToolbar = Ext.extend(Zarafa.core.ui.ContentPanelToolbar, {
	// Insertion points for this class
	/**
	 * @insert context.mail.showmailcontentpanel.toolbar.actions
	 * Insertion point for the Actions buttons in the Show Mail Toolbar
	 * @param {Zarafa.mail.dialogs.ShowMailToolbar} toolbar This toolbar
	 */
	/**
	 * @insert context.mail.showmailcontentpanel.toolbar.options
	 * Insertion point for the Options buttons in the Show Mail Toolbar
	 * @param {Zarafa.mail.dialogs.ShowMailToolbar} toolbar This toolbar
	 */
	/**
	 * @insert context.mail.showmailcontentpanel.toolbar.options.right
	 * Insertion point for the Options Right buttons which will show at right last in Mail Toolbar
	 * @param {Zarafa.mail.dialogs.ShowMailToolbar} toolbar This toolbar
	 */

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		var insertionPointBase = 'context.mail.showmailcontentpanel';

		Ext.applyIf(config, {
			xtype: 'mail.showmailtoolbar',
			insertionPointBase: insertionPointBase,

			actionItems: this.createActionButtons(insertionPointBase),
			optionItems: this.createOptionButtons(),
			rightAlignedItems : this.createRightAlignedOptionButtons()
		});

		Zarafa.mail.dialogs.ShowMailToolbar.superclass.constructor.call(this, config);
	},

	/**
	 * Create all buttons which should be added by default the the `Action` buttons
	 * This contains the buttons to reply and forward the message.
	 *
	 * @return {Array} The {@link Ext.Button} elements which should be added in the Action section of the {@link Ext.Toolbar}.
	 * @private
	 */
	createActionButtons : function(insertionPointBase)
	{
		var preActionButtonsInsert = container.populateInsertionPoint(insertionPointBase + '.toolbar.actions.first');

		return preActionButtonsInsert.concat([{
			xtype: 'button',
			rowspan: 2,
			text: _('Reply'),
			tooltip: _('Reply') + ' (Ctrl + R)',
			overflowText: _('Reply'),
			cls: 'zarafa-action',
			iconCls: 'icon_reply',
			ref: 'replyBtn',
			actionType: Zarafa.mail.data.ActionTypes.REPLY,
			handler: this.onMailResponseButton,
			scope: this,
			listeners: {
				beforeshow: this.onBeforeShowReplyButton,
				scope: this
			}
		},{
			xtype: 'button',
			text: _('Reply All'),
			tooltip: _('Reply All') + ' (Ctrl + Alt + R)',
			overflowText: _('Reply All'),
			iconCls: 'icon_reply_all',
			ref: 'replyAllBtn',
			actionType: Zarafa.mail.data.ActionTypes.REPLYALL,
			handler: this.onMailResponseButton,
			scope: this
		},{
			xtype: 'button',
			text: _('Forward'),
			tooltip: _('Forward') + ' (Ctrl + F)',
			overflowText: _('Forward'),
			iconCls: 'icon_forward',
			ref: 'forwardBtn',
			actionType: Zarafa.mail.data.ActionTypes.FORWARD,
			handler: this.onMailResponseButton,
			scope: this
		},{
			xtype: 'button',
			ref: 'deleteBtn',
			overflowText: _('Delete'),
			tooltip: {
				text : _('Delete')
			},
			iconCls: 'icon_delete',
			handler: this.onDeleteButton,
			scope: this
		}]);
	},

	/**
	 * Handler for the onbeforeshow event of the reply button. It will make
	 * sure that it is not an 'action' button when the record is a meeting
	 * request.
	 * @param {Ext.Button} btn The reply button
	 */
	onBeforeShowReplyButton : function(btn)
	{
		var messageClass = this.record.get('message_class');
		if ( messageClass.substring(0, 20) === 'IPM.Schedule.Meeting' ){
			btn.getEl().removeClass('zarafa-action');
		} else {
			btn.getEl().addClass('zarafa-action');
		}
	},

	/**
	 * Create all buttons which should be added by default the the `Options` buttons.
	 *
	 * @return {Array} The {@link Ext.Button} elements which should be added in the Options section of the {@link Ext.Toolbar}.
	 * @private
	 */
	createOptionButtons : function()
	{
		return [{
			xtype: 'button',
			ref: 'optionsBtn',
			overflowText: _('Options'),
			tooltip: {
				text: _('Open options dialog')
			},
			iconCls : 'icon_cogwheel',
			handler : this.onMailOptionsButton,
			scope: this
		},{
			xtype : 'button',
			overflowText: _('Set Category'),
			tooltip : {
				text : _('Open the categories dialog')
			},
			iconCls : 'icon_categories',
			handler : this.onOpenCategories,
			scope : this
		},{
			xtype : 'button',
			ref: 'setFlagBtn',
			overflowText : _('Set flag'),
			tooltip : {
				text : _('Set flag on this email')
			},
			iconCls : 'icon_flag_red',
			handler : this.onSetFlagButton,
			scope : this
		},{
			xtype: 'splitbutton',
			cls: 'zarafa-more-options-btn',
			tooltip: _('More options'),
			splitOnMoreMenu : true,
			overflowText: _('More options'),
			iconCls: 'icon_more',
			menu : this.moreMenuButtons(this),
			handler: function() {
				this.showMenu();
			}
		}];
	},

	/**
	 * Create buttons which needs to be rendered on the right side of the toolbar.
	 * This contains the popout button if main webapp window is active.
	 *
	 * @return {Array} The {@link Ext.Button} elements which should be added in the Right Options section of the {@link Ext.Toolbar}.
     */
	createRightAlignedOptionButtons: function ()
	{
		// Display the popout button only if supported.
		if (Zarafa.supportsPopOut() && Zarafa.core.BrowserWindowMgr.isMainWindowActive()) {
			return [{
				xtype: 'zarafa.toolbarbutton',
				tooltip: _('Open in new browser window'),
				overflowText: _('Pop-Out'),
				iconCls: 'icon_popout',
				ref: 'popOutBtn',
				handler: this.onPopoutButton,
				scope: this
			}];
		}
	},

	/**
	 * Load record into toolbar
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to load
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;

		// disable some buttons for sub messages
		var isSubMessage = false;
		var isFaultyMessage = false;

		if(record) {
			isSubMessage = record.isSubMessage();
			isFaultyMessage = record.isFaultyMessage();
		}

		this.deleteBtn.setVisible(!isSubMessage);
		this.setFlagBtn.setVisible(!isSubMessage);
		this.optionsBtn.setVisible(!isSubMessage && !isFaultyMessage);

		this.replyBtn.setVisible(!isFaultyMessage);
		this.replyAllBtn.setVisible(!isFaultyMessage);
		this.forwardBtn.setVisible(!isFaultyMessage);
	},

	/**
	 * The menu items of the more button.
	 *
	 * @param {Zarafa.mail.dialogs.ShowMailToolbar} scope The scope for the menu items
	 * @return {Zarafa.core.ui.menu.ConditionalMenu} the dropdown menu for the more button
	 */
	moreMenuButtons : function(scope)
	{
		return {
			xtype: 'zarafa.conditionalmenu',
			items: [{
				xtype: 'zarafa.conditionalitem',
				text : _('Mark Read'),
				iconCls : 'icon_mail icon_mail_read',
				hideMode : 'offsets',
				readState: true,
				beforeShow : this.onBeforeShowMoreMenu,
				handler : this.onReadFlagMenuItemClicked,
				scope: scope
			}, {
				xtype: 'zarafa.conditionalitem',
				text : _('Mark Unread'),
				hideMode : 'offsets',
				iconCls : 'icon_mail icon_mail_unread',
				readState: false,
				beforeShow : this.onBeforeShowMoreMenu,
				handler : this.onReadFlagMenuItemClicked,
				scope : scope
			}, {
				text : _('Copy/Move'),
				iconCls : 'icon_copy',
				handler : this.onCopyMove,
				scope : scope
			}, {
				text: _('Print'),
				iconCls: 'icon_print',
				handler: this.onPrintButton,
				scope: this
			}, {
				text: _('Edit as New'),
				iconCls: 'icon_edit_as_new_mail',
				actionType: Zarafa.mail.data.ActionTypes.EDIT_AS_NEW,
				handler: this.onMailResponseButton,
				scope: scope
			}, {
				text: _('Download'),
				iconCls: 'icon_download',
				handler: this.onDownloadMailButton,
				scope: scope
			}]
		};
	},

	/**
	 * Handler for the beforeshow event of the {@link Zarafa.core.ui.menu.ConditionalItem menu item}. Will
	 * show and hide the menu item depends on record read status.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @private
	 */
	onBeforeShowMoreMenu : function (item)
	{
		// show and hide the 'Mark Read' and 'Mark Unread' if record read status is unread or read respectively.
		item.setVisible(this.record.isRead() ? !item.readState : item.readState);
	},

	/**
	 * Event handler which is called when the item has been clicked.
	 * This will mark record as read or unread.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item which has been clicked.
	 * @private
	 */
	onReadFlagMenuItemClicked : function (item)
	{
		Zarafa.common.Actions.markAsRead(this.record, item.readState);
	},

	/**
	 * Event handler when the "Message Options" button has been pressed.
	 * This will call the {@link Zarafa.mail.Actions#openMailOptionsContent}.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onMailOptionsButton : function(button)
	{
		Zarafa.mail.Actions.openMailOptionsContent(this.record, {
			autoSave : true
		});
	},

	/**
	 * Event handler when the "Set Flag" button has been pressed.
	 * This will call the {@link Zarafa.common.Actions#openFlagsMenu}.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @param {Ext.EventObject} eventObject event object
	 * @private
	 */
	onSetFlagButton : function (button, eventObject)
	{
		Zarafa.common.Actions.openFlagsMenu(this.record, eventObject.getXY(), false);
	},

	/**
	 * Event handler when the "Delete" button has been pressed.
	 * This will {@link Zarafa.core.data.RecordContentPanel#deleteRecord delete} the given record.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onDeleteButton : function(button)
	{
		this.dialog.deleteRecord();
	},

	/**
	 * Handler for the Categories toolbar button
	 * This will call {@link Zarafa.common.Actions#openCategoriesContent}.
	 * @private
	 */
	onOpenCategories : function()
	{
		Zarafa.common.Actions.openCategoriesContent(this.record);
	},

	/**
	 * Open the {@link Zarafa.common.dialogs.CopyMoveContent CopyMoveContent} for copying
	 * or moving the given record.
	 * @private
	 */
	onCopyMove : function()
	{
		Zarafa.common.Actions.openCopyMoveContent(this.record);
	},

	/**
	 * Event handler when the "Print" button has been pressed.
	 * This will call the {@link Zarafa.common.Actions#openPrintDialog}.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onPrintButton : function(button)
	{
		Zarafa.common.Actions.openPrintDialog(this.record);
	},

	/**
	 * Event handler called when the "PopOut" button has been pressed.
	 * This will call the {@link Zarafa.mail.Actions#openMailContent}
	 * with record and its containing {@link Zarafa.core.ui.MessageContentPanel dialog}.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onPopoutButton : function(button)
	{
		Zarafa.mail.Actions.popoutMailContent(this.record, this.dialog);
	},

	/**
	 * Event handler when the "Reply/ Reply All/ Forward/ Edit as New" button has been pressed.
	 * This will call the {@link Zarafa.mail.Actions#openCreateMailResponseContent}.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onMailResponseButton : function(button)
	{
		var model = this.dialog.getContextModel();
		var isOwnedByMainWindow = Zarafa.core.BrowserWindowMgr.isOwnedByMainWindow(button);
		var configObject = !isOwnedByMainWindow ? {layerType : 'separateWindows'} : undefined;

		Zarafa.mail.Actions.openCreateMailResponseContent(this.record, model, button.actionType, configObject);
		if (container.getSettingsModel().get('zarafa/v1/contexts/mail/close_on_respond') === true) {
			this.dialog.close();
		}
	},

	/**
	 * Event handler when the "Download" button has been pressed.
	 * This will call the {@link Zarafa.common.Actions#openSaveEmlDialog} function.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onDownloadMailButton : function(button)
	{
		Zarafa.common.Actions.openSaveEmlDialog(this.record);
	}
});
Ext.reg('zarafa.showmailtoolbar', Zarafa.mail.dialogs.ShowMailToolbar);
