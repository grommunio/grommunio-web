/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.maps');

/**
* @class Grommunio.plugins.maps.MapsPlugin
* @extends Grommunio.core.Plugin
*
* Maps plugin for showing contact addresses locations on openstreetmap.
*/
Grommunio.plugins.maps.MapsPlugin = Ext.extend(Grommunio.core.Plugin, {

	/**
	 * Initialize the plugin by calling {@link #registerInsertionPoint}.
	 * @protected
	 */
	initPlugin: function()
	{
		Grommunio.plugins.maps.MapsPlugin.superclass.initPlugin.apply(this, arguments);

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

Grommunio.onReady(function() {
	container.registerPlugin(new Grommunio.core.PluginMetaData({
		name: 'maps',
		displayName: _('Openstreetmap'),
		pluginConstructor: Grommunio.plugins.maps.MapsPlugin
	}));
});
