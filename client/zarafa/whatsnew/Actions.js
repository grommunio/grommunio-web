Ext.namespace('Zarafa.whatsnew');

/**
 * @class Zarafa.whatsnew.Actions
 * Common actions for the "What's New" dialog.
 * @singleton
 */
Zarafa.whatsnew.Actions = {
	/**
	 * Opens the "What's New" dialog when information on new features is available
	 * and the user has not chosen to not show the dialog again.
	 */
	openWhatsNewDialog : function()
	{
		// Don't show new features if the user once checked the "Don't show me new features again." checkbox
		var sm = container.getSettingsModel();
		if ( sm.get('zarafa/v1/main/new_features_dialog/show') === false ){
			return;
		}

		var newFeatures = this.getNewWebAppFeatures();
		newFeatures = newFeatures.concat(this.getNewPluginsFeatures());

		// Don't show the dialog if we don't have any new features to show
		if ( Ext.isEmpty(newFeatures) ){
			return;
		}

		var win = new Zarafa.whatsnew.ui.WhatsNewWindow({features: newFeatures});
		win.show();
	},

	/**
	 * Returns an array with objects that describe the new features of the WebApp. The objects consist of the
	 * following properties:<br>
	 * <ul>
	 * <li>title</li>
	 * <li>description</li>
	 * <li>image_url</li>
	 * <li>icon_url (optional)</li>
	 * </ul>
	 *
	 * @return {Array} An array of objects that describe the new features
	 * @private
	 */
	getNewWebAppFeatures : function()
	{
		var sm = container.getSettingsModel();

		// Check if we have new features in this version of WebApp
		var webAppVersion = container.getVersion().getWebApp();

		if ( !this.validateWhatsNewData('webapp-core', webAppVersion) ){
			return [];
		}

		// Update the version of the WebApp for which we we showed new features
		sm.set('zarafa/v1/main/new_features_dialog/last_version/webapp', webAppVersion);

		return Zarafa.whatsnew.Features.features;
	},

	/**
	 * Returns an array with objects that describe the new features of the enabled plugins. The objects consist of the
	 * following properties:<br>
	 * <ul>
	 * <li>title</li>
	 * <li>description</li>
	 * <li>image_url</li>
	 * <li>icon_url (optional)</li>
	 * </ul>
	 *
	 * @return {Array} An array of objects that describe the new features
	 * @private
	 */
	getNewPluginsFeatures : function()
	{
		var featuresByPlugin = [];
		var sm = container.getSettingsModel();

		// Loop through the plugins and check if they have descriptions for new features of the version of
		// the plugin that is installed
		Ext.each(container.getPlugins(), function(plugin){
			var pluginVersion = container.getServerConfig().getPluginsVersion()[plugin.getName()] || '0';

			if ( !this.validateWhatsNewData(plugin.getName(), pluginVersion) ){
				return;
			}

			// rewrite the urls
			Ext.each(plugin.whatsNew.features, function(f){
				var baseUrl = container.getServerConfig().getBaseUrl() + 'plugins/' + plugin.getName() + '/';
				if ( !Ext.isEmpty(f.image_url) ){
					f.image_url = baseUrl + f.image_url;
				}
				if ( !Ext.isEmpty(f.icon_url) ){
					f.icon_url = baseUrl + f.icon_url;
				}
			});

			featuresByPlugin.push({
				name: plugin.getName(),
				features: plugin.whatsNew.features
			});

			// Update the version of the plugin for which we we will show new features
			sm.set('zarafa/v1/main/new_features_dialog/last_version/plugins/'+plugin.getName(), pluginVersion);
		}, this);

		return this.sortPluginFeatures(featuresByPlugin);
	},

	/**
	 * Checks if the WhatsNew data of the WebApp core or a plugin is valid.
	 * @param {String} unit Either 'webapp-core' or a plugin name.
	 * @param {String} unitVersion The current version of the unit.
	 *
	 * @return {Boolean} False if the WhatsNew data is not valid, true otherwise
	 * @private
	 */
	validateWhatsNewData : function(unit, unitVersion) {
		if ( !this.whatsNewSettings ){
			this.whatsNewSettings = container.getSettingsModel().get('zarafa/v1/main/new_features_dialog', true);
		}

		var whatsNewData;
		var lastShownUnitVersion;

		if ( unit === 'webapp-core' ){
			whatsNewData = Zarafa.whatsnew.Features;
			unitVersion = container.getVersion().getWebApp();
			lastShownUnitVersion = this.whatsNewSettings.last_version.webapp;
		} else {
			whatsNewData = container.getPluginByName(unit).whatsNew;
			unitVersion = container.getServerConfig().getPluginsVersion()[unit];
			if ( this.whatsNewSettings.last_version.plugins ){
				lastShownUnitVersion = this.whatsNewSettings.last_version.plugins[unit];
			}
		}

		// Check if the plugin has new features
		if ( !Ext.isDefined(whatsNewData) ){
			return false;
		}

		// Check if the new features are actually for the current version
		if ( container.getVersion().versionCompare(whatsNewData.version, unitVersion) !== 0 ){
			return false;
		}

		// Check if the new features of this version have not already been shown to the user
		if ( container.getVersion().versionCompare(lastShownUnitVersion || '0', unitVersion) >= 0 ){
			return false;
		}

		// Check if the new features are defined as an array
		if ( !Array.isArray(whatsNewData.features) ){
			return false;
		}

		return true;
	},

	/**
	 * Sorts the new features of plugins. Will make sure we first show new features of
	 * the webmeetings plugin, then files, then smime, and then of other plugins
	 * @param {Array} featuresByPlugin An array of objects that hold of the plugin to
	 * which the features apply, and an array that contains the feature descriptions of
	 * that plugin.
	 *
	 * @return {Array} An array of objects that describe a feature. (without any reference
	 * to the plugin)
	 * @private
	 */
	sortPluginFeatures : function(featuresByPlugin)
	{
		var sortedFeatures = [];

		// We first want to show the new features of the spreedwebrtc plugin,
		// then files, then smime, and then the other plugins
		var pluginOrder = ['spreedwebrtc', 'files', 'smime'];

		featuresByPlugin = featuresByPlugin.sort(function(a, b){
			var posA = pluginOrder.indexOf(a.name);
			var posB = pluginOrder.indexOf(b.name);
			if ( (posA==-1 && posB>-1) || (posA>-1 && posB==1) ){
				return posB - posA;
			}
			return posA - posB;
		});

		Ext.each(featuresByPlugin, function(f, index){
			sortedFeatures = sortedFeatures.concat(f.features);
		});

		return sortedFeatures;
	}
};
