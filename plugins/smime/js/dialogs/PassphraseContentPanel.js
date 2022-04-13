Ext.namespace('Zarafa.plugins.smime.dialogs');

/**
 * @class Zarafa.plugins.smime.dialogs.PassphraseContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 *
 * The content panel for changing a users passphrase.
 * @xtype smime.passphrasecontentpanel
 */
Zarafa.plugins.smime.dialogs.PassphraseContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		config = Ext.applyIf(config, {
			xtype: 'smime.passphrasecontentpanel',
			cls : 'zarafa-smime-passphrasewindow',
			modal: true,
			layout: 'fit',
			title : _('S/MIME Passphrase', 'plugin_smime'),
			width: 350,
			height: 100,
			stateful: false,
			items: [{
				xtype: 'smime.passphrasewindow',
				ref: 'passphrasePanel',
				record: config.record
			}]
		});

		Zarafa.plugins.smime.dialogs.PassphraseContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('smime.passphrasecontentpanel', Zarafa.plugins.smime.dialogs.PassphraseContentPanel);
