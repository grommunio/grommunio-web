Ext.namespace('Zarafa.plugins.files.settings.ui');

/**
 * @class Zarafa.plugins.files.settings.ui.AccountEditContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.accounteditcontentpanel
 */
Zarafa.plugins.files.settings.ui.AccountEditContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {

			xtype: 'filesplugin.accounteditcontentpanel',

			layout: 'fit',
			modal: true,
			width: 400,
			height: 250,
			stateful: false,
			title: dgettext('plugin_files', 'Edit Account'),
			items: [{
				xtype: 'filesplugin.accounteditpanel',
				item: config.item,
				backendStore : config.backendStore
			}]
		});

		Zarafa.plugins.files.settings.ui.AccountEditContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.accounteditcontentpanel', Zarafa.plugins.files.settings.ui.AccountEditContentPanel);