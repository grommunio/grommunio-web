Ext.namespace('Zarafa.common.ui.messagepanel');

/**
 * @class Zarafa.common.ui.messagepanel.ExtraInfoContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.extrainfocontextmenu
 */
Zarafa.common.ui.messagepanel.ExtraInfoContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.common.previewpanel.extrainfo.contextmenu.actions
	 * @param {Zarafa.common.ui.messagepanel.ExtraInfoContextMenu} contextmenu This contextmenu
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (config.records) {
			if (Ext.isArray(config.records)) {
				config.records = config.records[0];
			}
		}

		Ext.applyIf(config, {
			items: [{
				xtype: 'zarafa.conditionalitem',
				text: _('Download Pictures'),
				handler: this.showPictures,
				scope: this
			}, {
				xtype: 'menuseparator'
			}, {
				xtype: 'zarafa.conditionalitem',
				text: _('Add Sender to Safe Senders List'),
				handler: this.addSenderToSafeList,
				scope: this
			}, {
				xtype: 'zarafa.conditionalitem',
				text: _('Add Domain to Safe Senders List'),
				handler: this.addDomainToSafeList,
				scope: this
			}]
		});

		Zarafa.common.ui.messagepanel.ExtraInfoContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Function will calculate block_status property value of {@link Zarafa.core.data.MessageRecord MessageRecord}
	 * and set it and will save the record to send changes to server
	 * @private
	 */
	showPictures : function()
	{
		var blockStatusValue = this.records.calculateBlockStatus();

		if (blockStatusValue) {
			this.records.set('block_status', blockStatusValue);
			this.records.save();
		}
	},

	/**
	 * Function will add smtp address of sender of this mail to {@link Zarafa.settings.SettingsModel #safe_senders_list}
	 * so the mails from this user will not be checked for blocking external content.
	 * @private
	 */
	addSenderToSafeList : function()
	{
		var smtpAddress = this.records.get('sent_representing_email_address') || this.records.get('sender_email_address');
		if(Ext.isEmpty(smtpAddress)) {
			return;
		}

		var safeSenders = container.getSettingsModel().get('zarafa/v1/contexts/mail/safe_senders_list', true);
		// settings are in object format so convert it to an array
		safeSenders = Zarafa.core.Util.objToArray(safeSenders);

		if(!Ext.isEmpty(safeSenders)) {
			safeSenders.push(smtpAddress);
		} else {
			safeSenders = [smtpAddress];
		}

		container.getSettingsModel().set('zarafa/v1/contexts/mail/safe_senders_list', safeSenders);

		// @FIXME any good way to update record contents without changing it?
		this.records.afterEdit();
	},

	/**
	 * Function will add domain address of sender of this mail to {@link Zarafa.settings.SettingsModel #safe_senders_list}
	 * so the mails from this domain will not be checked for blocking external content.
	 * @private
	 */
	addDomainToSafeList : function()
	{
		var smtpAddress = this.records.get('sent_representing_email_address') || this.records.get('sender_email_address');
		var domainName = smtpAddress.substr(smtpAddress.indexOf('@') + 1);
		if(Ext.isEmpty(domainName)) {
			return;
		}

		var safeSenders = container.getSettingsModel().get('zarafa/v1/contexts/mail/safe_senders_list', true);
		// settings are in object format so convert it to an array
		safeSenders = Zarafa.core.Util.objToArray(safeSenders);

		if(!Ext.isEmpty(safeSenders)) {
			safeSenders.push(domainName);
		} else {
			safeSenders = [domainName];
		}

		container.getSettingsModel().set('zarafa/v1/contexts/mail/safe_senders_list', safeSenders);

		// @FIXME any good way to update record contents without changing it?
		this.records.afterEdit();
	}
});

Ext.reg('zarafa.extrainfocontextmenu', Zarafa.common.ui.messagepanel.ExtraInfoContextMenu);
