Ext.namespace('Zarafa.plugins.maps');

/**
* @class Zarafa.plugins.maps.MapsPlugin
* @extends Zarafa.core.Plugin
*
* Maps plugin for showing contact addresses locations on openstreetmap.
*/
Zarafa.plugins.maps.MapsPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Initialize the plugin by calling {@link #registerInsertionPoint}.
	 * @protected
	 */
	initPlugin: function()
	{
		Zarafa.plugins.maps.MapsPlugin.superclass.initPlugin.apply(this, arguments);

		this.registerInsertionPoint('context.contact.contactcontentpanel.tabs',this.showContactLocation, this);
		this.registerInsertionPoint('context.addressbook.abuserdetailcontentpanel.tabs',this.showABUserLocation, this);
	},

	/**
	 * Shows contact's addresses on openstreetmap
	 * @return the panel with div element for rendering the leaflet map
	 */
	showContactLocation:function()
	{
		return {
			xtype:'maps.contactmapstab',
			itemId: 'contact'
		};
	},
	/**
	 * Shows Address Book contact's addresses on openstreetmap.
	 * @return the panel with div element for rendering the leaflet map
	 */
	showABUserLocation:function()
	{
		return {
			xtype:'maps.contactmapstab',
			itemId: 'abuser'
		};
	}
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name: 'maps',
		displayName: _('Openstreetmap'),
		pluginConstructor: Zarafa.plugins.maps.MapsPlugin
	}));
});
