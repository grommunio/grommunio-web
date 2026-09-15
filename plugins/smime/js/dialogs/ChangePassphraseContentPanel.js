/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.smime.dialogs');

/**
 * @class Grommunio.plugins.smime.dialogs.ChangePassphraseContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 *
 * The content panel for changing a users passphrase.
 * @xtype smime.changepassphrasepanel
 */
Grommunio.plugins.smime.dialogs.ChangePassphraseContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		config = Ext.applyIf(config, {
			layout: 'fit',
			title: _('Change passphrase'),
			width: 300,
			height: 250,
			stateful: false,
			xtype: 'smime.changepassphrasecontentpanel',
			items: [{
				xtype: 'smime.changepassphrasepanel',
				buttonAlign: 'center',
				buttons: [{
					text: _('Change passphrase'),
					handler: this.onChangePassphrase,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.close,
					scope: this
				}]
			}]
		});

		Grommunio.plugins.smime.dialogs.ChangePassphraseContentPanel.superclass.constructor.call(this, config);
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

Ext.reg('smime.changepassphrasecontentpanel', Grommunio.plugins.smime.dialogs.ChangePassphraseContentPanel);
