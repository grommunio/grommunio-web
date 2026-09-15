Ext.namespace('Grommunio.plugins.smime.dialogs');

/**
 * @class Grommunio.plugins.smime.dialogs.PassphraseContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 *
 * The content panel for changing a users passphrase.
 * @xtype smime.passphrasecontentpanel
 */
Grommunio.plugins.smime.dialogs.PassphraseContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		config = Ext.applyIf(config, {
			xtype: 'smime.passphrasecontentpanel',
			cls : 'grommunio-smime-passphrasewindow',
			modal: true,
			layout: 'fit',
			title : _('S/MIME Passphrase'),
			width: 350,
			height: 100,
			stateful: false,
			items: [{
				xtype: 'smime.passphrasewindow',
				ref: 'passphrasePanel',
				record: config.record
			}]
		});

		Grommunio.plugins.smime.dialogs.PassphraseContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('smime.passphrasecontentpanel', Grommunio.plugins.smime.dialogs.PassphraseContentPanel);
