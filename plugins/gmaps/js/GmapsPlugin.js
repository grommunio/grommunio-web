Ext.namespace('Zarafa.plugins.gmaps');

/**
* @class Zarafa.plugins.gmaps.GmapsPlugin
* @extends Zarafa.core.Plugin
*
* Gmaps plugin for showing contact addresses locations on openstreetmap.
*/
Zarafa.plugins.gmaps.GmapsPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Initialize the plugin by calling {@link #registerInsertionPoint}.
	 * @protected
	 */
	initPlugin: function()
	{
		Zarafa.plugins.gmaps.GmapsPlugin.superclass.initPlugin.apply(this, arguments);

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
			xtype:'gmaps.contactgmapstab',
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
			xtype:'gmaps.contactgmapstab',
			itemId: 'abuser'
		};
	}
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name: 'gmaps',
		displayName: _('Openstreetmap'),
		pluginConstructor: Zarafa.plugins.gmaps.GmapsPlugin
	}));
});
