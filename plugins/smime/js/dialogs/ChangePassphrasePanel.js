Ext.namespace('Zarafa.plugins.smime.dialogs');

/**
 * @class Zarafa.plugins.smime.dialogs.ChangePassphrasePanel
 * @extends Ext.Panel
 *
 * The panel containing the form for changing a users passphrase.
 * @xtype smime.changepassphrasepanel
 */
Zarafa.plugins.smime.dialogs.ChangePassphrasePanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'smime.changepassphrasepanel',
			layout: 'form',
			border: false,
			header: false,
			items: [{
				hideLabel: true,
				xtype: 'displayfield',
				value: _('Old passphrase', 'plugin_smime')
			},{
				hideLabel: true,
				xtype : 'textfield',
				inputType: 'password',
				anchor: '100%',
				ref : 'old_passphrase',
				listeners : {
					'change': this.resetVerification,
					scope: this
				}
			},{
				hideLabel: true,
				hidden: true,
				hideMode: 'visibility',
				xtype: 'displayfield',
				ref: 'wrong_passphrase',
				cls: 'zarafa-smime-invalid-text',
				value: _('Wrong passphrase. Please try again', 'plugin_smime')
			},{
				hideLabel: true,
				xtype: 'displayfield',
				value: _('New passphrase', 'plugin_smime')
			},{
				hideLabel: true,
				xtype : 'textfield',
				inputType: 'password',
				anchor: '100%',
				listeners : {
					'change': this.resetVerification,
					scope: this
				},
				ref : 'new_passphrase'
			},{
				hideLabel: true,
				xtype: 'displayfield',
				value: _('Confirm new passphrase', 'plugin_smime')
			},{
				hideLabel: true,
				xtype : 'textfield',
				inputType: 'password',
				anchor: '100%',
				listeners : {
					'change': this.resetVerification,
					scope: this
				},
				ref : 'confirm_new_passphrase'
			},{
				hideLabel: true,
				hidden: true,
				xtype: 'displayfield',
				ref: 'wrong_verification',
				cls: 'zarafa-smime-invalid-text',
				value: _("The passphrases don't match. Please try again", 'plugin_smime')
			}]
		});

		Zarafa.plugins.smime.dialogs.ChangePassphrasePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Verifies the new passphrase and hides or shows the error message.
	 * @return {Boolean} returns false when new passphrase and confirmation passphrase
	 * don't match otherwise it returns true.
	 */
	validatePassphrase: function()
	{
		if (this.new_passphrase.getValue() !== this.confirm_new_passphrase.getValue()) {
			this.wrong_verification.show();
			return false;
		} else if (!this.wrong_verification.hidden) {
			this.wrong_verification.hide();
		}

		return true;
	},

	/**
	 * Reset verification fields when a user changes one of the password fields.
	 */
	resetVerification: function()
	{
		this.wrong_verification.hide();
		this.wrong_passphrase.hide();
	},

	/**
	 * Sends passphrase change request to the backend
	 */
	changePassphrasePanel: function()
	{
			container.getRequest().singleRequest(
				'pluginsmimemodule',
				'changepassphrase',
				{
					'passphrase': this.old_passphrase.getValue(),
					'new_passphrase': this.new_passphrase.getValue()
				},
				new Zarafa.plugins.smime.data.SmimeResponseHandler({
					successCallback : this.onChangePassphraseRequest.createDelegate(this)
				})
			);
	},

	/**
	 * Handler for successCallback of the change passphrase change request.
	 */
	onChangePassphraseRequest: function(response) {
		if (response.code === Zarafa.plugins.smime.CHANGE_CERTIFICATE_SUCCESS) {
			container.getNotifier().notify('info.saved', _('S/MIME Message', 'plugin_smime'), _('Passphrase changed succesfully', 'plugin_smime'));
			this.dialog.close();
		} else {
			this.wrong_passphrase.show();
		}
	}
});

Ext.reg('smime.changepassphrasepanel', Zarafa.plugins.smime.dialogs.ChangePassphrasePanel);
