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
					this.createForwardButton()
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
		if ( this.record && this.record !== record && this.record.store && this.record.store !== record.store ){
			Zarafa.core.PresenceManager.unregisterStore(this.record.store);
		}
		if ( record && record.store ){
			Zarafa.core.PresenceManager.registerStore(record.store, 'sender');
		}

		if ( this.record && this.record.subStores && this.record.subStores.recipients ){
			Zarafa.core.PresenceManager.unregisterStore(this.record.subStores.recipients);
		}
		if ( record && record.subStores && record.subStores.recipients ){
			Zarafa.core.PresenceManager.registerStore(record.subStores.recipients);
		}

		Zarafa.mail.ui.MailPreviewPanel.superclass.update.apply(this, arguments);

		if(record) {
			var isFaultyMessage = record.isFaultyMessage();
			var toolbar = this.getTopToolbar();

			toolbar.replyBtn.setVisible(!isFaultyMessage);
			toolbar.replyAllBtn.setVisible(!isFaultyMessage);
			toolbar.forwardBtn.setVisible(!isFaultyMessage);
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
			iconCls: 'icon_reply',
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
			iconCls: 'icon_reply_all',
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
			iconCls: 'icon_forward',
			ref: 'forwardBtn',
			responseMode: Zarafa.mail.data.ActionTypes.FORWARD,
			handler: this.onResponse,
			scope : this
		};
	},

	/**
	 * Called when one of the "Reply"/"Reply All"/"Forward"/"Edit as New" menuitems are clicked.
	 * @param {Ext.Button} button The button which was clicked
	 * @private
	 */
	onResponse : function(button)
	{
		Zarafa.mail.Actions.openCreateMailResponseContent(this.record, this.model, button.responseMode);
	}
});

Ext.reg('zarafa.mailpreviewpanel', Zarafa.mail.ui.MailPreviewPanel);

