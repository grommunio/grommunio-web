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
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'mail.showmailtoolbar',
			insertionPointBase: 'context.mail.showmailcontentpanel',

			actionItems: this.createActionButtons(),
			optionItems: this.createOptionButtons()
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
	createActionButtons : function()
	{
		return [{
			xtype: 'button',
			rowspan: 2,
			text: _('Reply'),
			tooltip: _('Reply') + ' (Ctrl + R)',
			overflowText: _('Reply'),
			cls: 'zarafa-action',
			iconCls: 'icon_replyEmail',
			ref: 'replyBtn',
			actionType: Zarafa.mail.data.ActionTypes.REPLY,
			handler: this.onMailResponseButton,
			scope: this
		},{
			xtype: 'button',
			text: _('Reply All'),
			tooltip: _('Reply All') + ' (Ctrl + Alt + R)',
			overflowText: _('Reply All'),
			iconCls: 'icon_replyAllEmail',
			ref: 'replyAllBtn',
			actionType: Zarafa.mail.data.ActionTypes.REPLYALL,
			handler: this.onMailResponseButton,
			scope: this
		},{
			xtype: 'button',
			text: _('Forward'),
			tooltip: _('Forward') + ' (Ctrl + F)',
			overflowText: _('Forward'),
			iconCls: 'icon_forwardEmail',
			ref: 'forwardBtn',
			actionType: Zarafa.mail.data.ActionTypes.FORWARD,
			handler: this.onMailResponseButton,
			scope: this
		},{
			xtype: 'button',
			ref: 'deleteBtn',
			overflowText: _('Delete this item.'),
			tooltip: {
				title : _('Delete mail'),
				text : _('Delete this mail.')
			},
			iconCls: 'icon_delete',
			handler: this.onDeleteButton,
			scope: this
		}];
	},

	/**
	 * Create all buttons which should be added by default the the `Options` buttons.
	 * This contains the buttons flag the message according to a particular color.
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
				title: _('Options'),
				text: _('Open options dialog')
			},
			iconCls : 'icon_openMessageOptions',
			handler : this.onMailOptionsButton,
			scope: this
		},{
			xtype: 'button',
			ref: 'flagsBtn',
			overflowText: _('Set flag'),
			tooltip: {
				title: _('Set flag'),
				text: _('Set flag on this email')
			},
			iconCls: 'icon_flag_red',
			handler: this.onSetFlagButton,
			scope: this
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
		this.optionsBtn.setVisible(!isSubMessage && !isFaultyMessage);
		this.flagsBtn.setVisible(!isSubMessage && !isFaultyMessage);

		this.replyBtn.setVisible(!isFaultyMessage);
		this.replyAllBtn.setVisible(!isFaultyMessage);
		this.forwardBtn.setVisible(!isFaultyMessage);
	},

	/**
	 * The menu items of the more button.
	 *
	 * @param {Zarafa.mail.dialogs.ShowMailToolbar} scope The scope for the menu items
	 * @return {Ext.menu.Menu} the dropdown menu for the more button
	 */
	moreMenuButtons : function(scope)
	{
		return {
			xtype: 'menu',
			items: [{
				tooltip: _('Print this email'),
				text: _('Print'),
				iconCls: 'icon_print',
				handler: this.onPrintButton,
				scope: this
			},{
				tooltip: _('Edit as New Message') + ' (Ctrl + E)',
				text: _('Edit as New Message'),
				iconCls: 'icon_editAsNewEmail',
				actionType: Zarafa.mail.data.ActionTypes.EDIT_AS_NEW,
				handler: this.onMailResponseButton,
				scope: scope
			}]
		};
	},

	/**
	 * Event handler when the "Set Flag" button has been pressed.
	 * This will call the {@link Zarafa.mail.Actions#openMailFlagsContent}.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onSetFlagButton : function(button)
	{
		Zarafa.mail.Actions.openMailFlagsContent(this.record, {
			autoSave : true
		});
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
	 * Event handler when the "Reply/ Reply All/ Forward/ Edit as New Message" button has been pressed.
	 * This will call the {@link Zarafa.mail.Actions#openCreateMailResponseContent}.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onMailResponseButton : function(button)
	{
		var model = this.dialog.getContextModel();

		Zarafa.mail.Actions.openCreateMailResponseContent(this.record, model, button.actionType);
		if (container.getSettingsModel().get('zarafa/v1/contexts/mail/close_on_respond') === true) {
			this.dialog.close();
		}
	}
});
Ext.reg('zarafa.showmailtoolbar', Zarafa.mail.dialogs.ShowMailToolbar);
