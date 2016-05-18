Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailPreviewPanel
 * @extends Zarafa.core.ui.PreviewPanel
 * @xtype zarafa.mailpreviewpanel
 */
Zarafa.mail.ui.MailPreviewPanel = Ext.extend(Zarafa.core.ui.PreviewPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		Ext.applyIf(config, {
			xtype: 'zarafa.mailpreviewpanel',
			cls: 'zarafa-previewpanel zarafa-context-mainpanel',
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				// Defer loading mail immediately, because the user
				// might be quickly clicking through the list of mails.
				enableOpenLoadTask : true,
				autoOpenLoadTaskDefer : 250
			}),
			width: 600,
			height: 400,
			tbar : {
				items : [
					this.createReplyButton(),
					this.createReplyAllButton(),
					this.createForwardButton(),
					this.createEditAsNewButton()
				]
			}
		});

		Zarafa.mail.ui.MailPreviewPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		Zarafa.mail.ui.MailPreviewPanel.superclass.update.apply(this, arguments);

		if(record) {
			var isFaultyMessage = record.isFaultyMessage();
			var toolbar = this.getTopToolbar();

			toolbar.replyBtn.setVisible(!isFaultyMessage);
			toolbar.replyAllBtn.setVisible(!isFaultyMessage);
			toolbar.forwardBtn.setVisible(!isFaultyMessage);
			
			// Only show the "Edit as New Message" button in the toolbar when the item is in the Sent folder
			var defaultFolder = this.model.getDefaultFolder();
			toolbar.editAsNewBtn.setVisible(defaultFolder.getDefaultFolderKey()==='sent' && !isFaultyMessage);
		}
	},

	/**
	 * Function returns config for the reply button in previewpanel's toolbar
	 *
	 * @return {Object} Configuration object of reply button for the panel toolbar
	 * @private
	 */
	createReplyButton : function()
	{
		return {
			xtype: 'button',
			tooltip: _('Reply') + ' (Ctrl + R)',
			overflowText: _('Reply'),
			iconCls: 'icon_replyEmail',
			ref: 'replyBtn',
			responseMode: Zarafa.mail.data.ActionTypes.REPLY,
			handler: this.onResponse,
			scope : this
		};
	},
	
	/**
	 * Function returns config for the replyall button in previewpanel's toolbar
	 *
	 * @return {Object} Configuration object of replyall button for the panel toolbar
	 * @private
	 */
	createReplyAllButton : function()
	{
		return {
			xtype: 'button',
			tooltip: _('Reply All') + ' (Ctrl + Alt + R)',
			overflowText: _('Reply All'),
			iconCls: 'icon_replyAllEmail',
			ref: 'replyAllBtn',
			responseMode: Zarafa.mail.data.ActionTypes.REPLYALL,
			handler: this.onResponse,
			scope : this
		};
	},
	
	/**
	 * Function returns config for the forward button in previewpanel's toolbar
	 *
	 * @return {Object} Configuration object of forward button for the panel toolbar
	 * @private
	 */
	createForwardButton : function()
	{
		return {
			xtype: 'button',
			tooltip: _('Forward') + ' (Ctrl + F)',
			overflowText: _('Forward'),
			iconCls: 'icon_forwardEmail',
			ref: 'forwardBtn',
			responseMode: Zarafa.mail.data.ActionTypes.FORWARD,
			handler: this.onResponse,
			scope : this
		};
	},

	/**
	 * Function returns config for the "Edit as New Message" button in preview panel's toolbar
	 *
	 * @return {Object} Configuration object of "Edit as New Message" button for the panel toolbar
	 * @private
	 */
	createEditAsNewButton : function()
	{
		return {
			xtype: 'button',
			tooltip: _('Edit as New Message') + ' (Ctrl + E)',
			overflowText: _('Edit as New Message'),
			iconCls: 'icon_editAsNewEmail',
			ref: 'editAsNewBtn',
			responseMode: Zarafa.mail.data.ActionTypes.EDIT_AS_NEW,
			handler: this.onResponse,
			scope : this
		};
	},

	/**
	 * Called when one of the "Reply"/"Reply All"/"Forward"/"Edit as New Message" menuitems are clicked.
	 * @param {Ext.Button} button The button which was clicked
	 * @private
	 */
	onResponse : function(button)
	{
		Zarafa.mail.Actions.openCreateMailResponseContent(this.record, this.model, button.responseMode);
	}
});

Ext.reg('zarafa.mailpreviewpanel', Zarafa.mail.ui.MailPreviewPanel);

