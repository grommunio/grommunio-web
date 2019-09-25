Ext.namespace('Zarafa.plugins.intranet');

Zarafa.plugins.intranet.isDeskApp = function(){
	return Ext.isFunction(Zarafa.isDeskApp) ? Zarafa.isDeskApp() : Ext.isDefined(window.nw);
};
/**
 * @class Zarafa.plugins.intranet.Intranet
 * @extends Zarafa.core.Plugin
 *
 * Plugin that makes it possible to change the styling of the WebApp
 */
Zarafa.plugins.intranet.Intranet = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Initializes the plugin.
	 */
	initPlugin : function(){
		var pluginSettings = container.getSettingsModel().get('zarafa/v1/plugins/intranet', true);

		var sites = this.getSiteData(pluginSettings);
		this.prepareStyle(sites);

		Ext.each(sites, function(site, i){
			// The tab in the top tabbar
			this.registerInsertionPoint('main.maintabbar.left', this.createMainTab.createDelegate(this, [site]), this);
		}, this);

		// Register mail specific dialog types
		Zarafa.core.data.SharedComponentType.addProperty('plugins.intranet.panel');

		// Check if we should autostart a site on startup
		var autoStartFound = sites.some(function(site){ return site.autostart; });
		if ( autoStartFound ){
			container.on('webapploaded', function(){
				sites.filter(function(site){return site.autostart}).forEach(function(site){
					// use the openTab function for convenience
					this.openTab(this.createMainTab(site));
				}, this);

				// OpenTab will also switch to the opened tab, but we don't want that, so
				// let's switch back to the main tab.
				var mainContentTabPanel = container.getMainPanel().contentPanel;
				mainContentTabPanel.activate(0);
			}, this);

		}
	},

	/**
	 * Function will retrieve the information from plugin settings
	 * and prepare the array which holds respective site information.
	 *
	 * @param {Object} pluginSettings The settings object containing all settings from the given
	 * key position at the specified path.
	 * @return {Array} The array which contains information about sites and icons which are configured from
	 * server side
	 */
	getSiteData : function(pluginSettings)
	{
		var sites = [{
			buttonText: pluginSettings['button-title'],
			url: pluginSettings['url'],
			autostart: pluginSettings['autostart'],
			iconCls : 'icon_intranet',
			iconPath : pluginSettings['icon'],
			tabOrder: 15
		}];

		var i=1;
		while ( Ext.isDefined(pluginSettings['url-' + i]) ){
			sites.push ({
				buttonText: pluginSettings['button-title-' + i],
				url: pluginSettings['url-' + i],
				autostart: pluginSettings['autostart-' + i],
				iconCls : 'icon_intranet_' + i,
				iconPath : pluginSettings['icon-' + i],
				tabOrder: 15 + i
			});
			i++;
		}

		return sites;
	},

	/**
	 * Function which prepare and append style tag into document header
	 * which contains icon css classes which are used to set in tab header.
	 *
	 * @param {Array} sites The array which contains information about sites
	 * and icons which are configured from server side.
	 */
	prepareStyle : function(sites)
	{
		var css = '';

		Ext.each(sites, function (site) {
			css += '.'+ site.iconCls +' { background-image: url('+ site.iconPath +') !important; } \n';
			css += '.x-tab-strip-text.'+ site.iconCls +' { background-position: 0 10px !important;} \n';

			// No more needed so just removed iconPath from
			// sites object.
			delete site.iconPath;
		});

		// Set style tag in document header.
		Ext.DomHelper.append(Ext.getHead(), {
			tag : 'style',
			id : 'intranet_style',
			type : 'text/css',
			html: css
		});
	},

	/**
	 * Adds a button to the top tab bar for this context.
	 * @return {Object} The button for the top tabbar
	 * @private
	 */
	createMainTab: function(site)
	{
		return {
			text: site.buttonText,
			site: site,
			cls: 'mainmenu-button-intranet',
			handler: this.openTab
		};
	},

	/**
	 * Event handler for the click event of the tabbar buttons. It will
	 * open the tab if it already exists, or create it otherwise.
	 * @param {Zarafa.core.ui.MainTab} btn The button in the
	 * {@link Zarafa.core.ui.MainTabBar main tabbar}
	 */
	openTab: function(btn)
	{
		var tabIndex;
		Ext.each(container.getTabPanel().items.items, function(item, index){
			if (item.url === btn.site.url && item.title === btn.text) {
				tabIndex = index;
			}
		});

		if ( Ext.isDefined(tabIndex) ){
			// open the existing tab
			var mainContentTabPanel = container.getMainPanel().contentPanel;
			mainContentTabPanel.activate(tabIndex);

		} else {
			// Create a new tab
			Zarafa.core.data.UIFactory.openLayerComponent(
				Zarafa.core.data.SharedComponentType['plugins.intranet.panel'],
				null,
				{
					url: btn.site.url,
					title: btn.text,
					iconCls : btn.site.iconCls,
					tabOrder: btn.site.tabOrder
				}
			);
		}
	},

	/**
	 * Bid for the type of shared component
	 * and the given record.
	 * This will bid on a common.dialog.create or common.dialog.view for a
	 * record with a message class set to IPM or IPM.Note.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context
	 * can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent : function(type, record)
	{
			var bid = -1;

			switch (type) {
				case Zarafa.core.data.SharedComponentType['plugins.intranet.panel']:
					bid = 1;
			}

			return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context
	 * can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent : function(type, record)
	{
		var component;
		switch (type)
		{
			case Zarafa.core.data.SharedComponentType['plugins.intranet.panel']:
				return Zarafa.plugins.intranet.ui.ContentPanel;
		}
	}

});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'intranet',
		displayName : _('Intranet'),
		pluginConstructor : Zarafa.plugins.intranet.Intranet
	}));
});
