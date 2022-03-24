Ext.namespace('Zarafa.plugins.files.settings.ui');

/**
 * @class Zarafa.plugins.files.settings.ui.FeatureQuotaInfoContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.featurequotainfocontentpanel
 */
Zarafa.plugins.files.settings.ui.FeatureQuotaInfoContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param {Object} config configuration object with the account.
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {

			xtype: 'filesplugin.featurequotainfocontentpanel',
			title     : dgettext('plugin_files', 'Quota Information'),
			statefull : false,
			width     : 200,
			autoHeight: true,
			items     : [{
				xtype: 'filesplugin.featurequotainfopanel',
				item : config.item
			}]
		});

		Zarafa.plugins.files.settings.ui.FeatureQuotaInfoContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.featurequotainfocontentpanel', Zarafa.plugins.files.settings.ui.FeatureQuotaInfoContentPanel);
