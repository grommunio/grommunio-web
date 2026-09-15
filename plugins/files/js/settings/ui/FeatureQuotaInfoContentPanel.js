Ext.namespace('Grommunio.plugins.files.settings.ui');

/**
 * @class Grommunio.plugins.files.settings.ui.FeatureQuotaInfoContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype filesplugin.featurequotainfocontentpanel
 */
Grommunio.plugins.files.settings.ui.FeatureQuotaInfoContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param {Object} config configuration object with the account.
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {

			xtype: 'filesplugin.featurequotainfocontentpanel',
			title     : _('Quota Information'),
			stateful  : false,
			width     : 200,
			autoHeight: true,
			items     : [{
				xtype: 'filesplugin.featurequotainfopanel',
				item : config.item
			}]
		});

		Grommunio.plugins.files.settings.ui.FeatureQuotaInfoContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.featurequotainfocontentpanel', Grommunio.plugins.files.settings.ui.FeatureQuotaInfoContentPanel);
