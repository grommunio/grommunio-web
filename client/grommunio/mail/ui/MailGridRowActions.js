Ext.namespace('Grommunio.mail.ui');

/**
 * @class Grommunio.mail.ui.MailGridRowActions
 * @extends Grommunio.common.ui.grid.RowActionsPlugin
 * @ptype grommunio.mailgridrowactions
 *
 * Shows the read state, follow up and delete actions over the mail
 * grid row under the mouse.
 */
Grommunio.mail.ui.MailGridRowActions = Ext.extend(Grommunio.common.ui.grid.RowActionsPlugin, {
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
				Grommunio.common.Actions.markAsRead(record, !record.isRead());
			}
		},{
			name: 'flag',
			iconCls: 'icon_flag_red',
			title: _('Follow up'),
			handler: function(record, e) {
				Grommunio.common.Actions.openFlagsMenu(record, e.getXY());
			}
		},{
			name: 'delete',
			iconCls: 'icon_delete',
			title: _('Delete'),
			handler: function(record) {
				this.hide();
				Grommunio.common.Actions.deleteRecords(record);
			}
		}];
	},

	/**
	 * Conversation headers are not messages.
	 * @param {Grommunio.core.data.IPMRecord} record The hovered record
	 * @return {Boolean} False for conversation header rows
	 */
	supportsRecord: function(record)
	{
		return !(Ext.isFunction(record.isConversationHeaderRecord) && record.isConversationHeaderRecord());
	}
});

Ext.preg('grommunio.mailgridrowactions', Grommunio.mail.ui.MailGridRowActions);
