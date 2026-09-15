Ext.namespace('Grommunio.plugins.files.settings.ui');

/**
 * @class Grommunio.plugins.files.settings.ui.FeatureVersionInfoContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype filesplugin.featureversioninfocontentpanel
 */
Grommunio.plugins.files.settings.ui.FeatureVersionInfoContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'filesplugin.featureversioninfocontentpanel',
			stateful : false,
			title     : _('Version Information'),
			width      : 300,
			autoHeight : true,
			items     : [{
				xtype: 'filesplugin.featureversioninfopanel',
				item : config.item
			}]
		});

		Grommunio.plugins.files.settings.ui.FeatureVersionInfoContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.featureversioninfocontentpanel', Grommunio.plugins.files.settings.ui.FeatureVersionInfoContentPanel);
