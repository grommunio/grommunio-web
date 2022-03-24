Ext.namespace('Zarafa.plugins.files.settings.ui');

/**
 * @class Zarafa.plugins.files.settings.ui.FeatureVersionInfoContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.featureversioninfocontentpanel
 */
Zarafa.plugins.files.settings.ui.FeatureVersionInfoContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'filesplugin.featureversioninfocontentpanel',
			stateful : false,
			title     : dgettext('plugin_files', 'Version Information'),
			width      : 300,
			height     : 100,
			items     : [{
				xtype: 'filesplugin.featureversioninfopanel',
				item : config.item
			}]
		});

		Zarafa.plugins.files.settings.ui.FeatureVersionInfoContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.featureversioninfocontentpanel', Zarafa.plugins.files.settings.ui.FeatureVersionInfoContentPanel);
