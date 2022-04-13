Ext.namespace('Zarafa.plugins.smime.dialogs');

/**
 * @class Zarafa.plugins.smime.dialogs.ChangePassphraseContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 *
 * The content panel for changing a users passphrase.
 * @xtype smime.changepassphrasepanel
 */
Zarafa.plugins.smime.dialogs.ChangePassphraseContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		config = Ext.applyIf(config, {
			layout: 'fit',
			title: _('Change passphrase', 'plugin_smime'),
			width: 300,
			height: 250,
			stateful: false,
			xtype: 'smime.changepassphrasecontentpanel',
			items: [{
				xtype: 'smime.changepassphrasepanel',
				buttonAlign: 'center',
				buttons: [{
					text: _('Change passphrase', 'plugin_smime'),
					handler: this.onChangePassphrase,
					scope: this
				},{
					text: _('Cancel', 'plugin_smime'),
					handler: this.close,
					scope: this
				}]
			}]
		});

		Zarafa.plugins.smime.dialogs.ChangePassphraseContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Change passphrase function, if the two new passphrases are equal they
	 * new passphrase is sent to the server.
	 */
	onChangePassphrase: function()
	{
		var form = this.get(0);

		if (form.validatePassphrase()) {
			form.changePassphrasePanel();
		}
	}
});

Ext.reg('smime.changepassphrasecontentpanel', Zarafa.plugins.smime.dialogs.ChangePassphraseContentPanel);
