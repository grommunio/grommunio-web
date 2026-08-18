Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.contact.ui.ContactGridRowActions
 * @extends Zarafa.common.ui.grid.RowActionsPlugin
 * @ptype zarafa.contactgridrowactions
 *
 * Shows a new email to the contact and delete over the contact row under
 * the mouse.
 */
Zarafa.contact.ui.ContactGridRowActions = Ext.extend(Zarafa.common.ui.grid.RowActionsPlugin, {
	/**
	 * @return {Array} New email and delete
	 */
	getActions: function()
	{
		return [{
			name: 'email',
			iconCls: 'icon_new_email',
			title: _('Email'),
			supports: function(record) {
				return !Ext.isEmpty(record.get('email_address_1')) ||
					(Ext.isFunction(record.isMessageClass) && record.isMessageClass('IPM.DistList', true));
			},
			handler: function(record) {
				var context = container.getContextByName('mail');
				if (context) {
					Zarafa.mail.Actions.openCreateMailContentForContacts(context.getModel(), record);
				}
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
	}
});

Ext.preg('zarafa.contactgridrowactions', Zarafa.contact.ui.ContactGridRowActions);
