Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailGridRowActions
 * @extends Zarafa.common.ui.grid.RowActionsPlugin
 * @ptype zarafa.mailgridrowactions
 *
 * Shows the read state, follow up and delete actions over the mail
 * grid row under the mouse.
 */
Zarafa.mail.ui.MailGridRowActions = Ext.extend(Zarafa.common.ui.grid.RowActionsPlugin, {
	/**
	 * @return {Array} The read state toggle, the follow up menu and delete
	 */
	getActions: function()
	{
		return [{
			name: 'read',
			update: function(record, icon, anchor) {
				var read = !Ext.isFunction(record.isRead) || record.isRead();
				icon.removeClass(['icon_mail_read', 'icon_mail_unread']).addClass(read ? 'icon_mail_unread' : 'icon_mail_read');
				anchor.dom.title = read ? _('Mark Unread') : _('Mark Read');
			},
			handler: function(record) {
				Zarafa.common.Actions.markAsRead(record, !record.isRead());
			}
		},{
			name: 'flag',
			iconCls: 'icon_flag_red',
			title: _('Follow up'),
			handler: function(record, e) {
				Zarafa.common.Actions.openFlagsMenu(record, e.getXY());
			}
		},{
			name: 'delete',
			iconCls: 'icon_delete',
			title: _('Delete'),
			handler: function(record) {
				this.hide();
				Zarafa.common.Actions.deleteRecords(record);
			}
		}];
	},

	/**
	 * Conversation headers are not messages.
	 * @param {Zarafa.core.data.IPMRecord} record The hovered record
	 * @return {Boolean} False for conversation header rows
	 */
	supportsRecord: function(record)
	{
		return !(Ext.isFunction(record.isConversationHeaderRecord) && record.isConversationHeaderRecord());
	}
});

Ext.preg('zarafa.mailgridrowactions', Zarafa.mail.ui.MailGridRowActions);
