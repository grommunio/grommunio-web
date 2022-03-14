Ext.namespace('Zarafa.plugins.gmaps');

/**
* @class Zarafa.plugins.gmaps.GmapsTab
* @extends Ext.Panel
* @xtype gmaps.contactgmapstab
*
* This class is used to create layout of gmaps tab
* panel of the contact dialog.
*/
Zarafa.plugins.gmaps.GmapsTab=Ext.extend(Ext.Panel, {

	/**
	 * The leaflet instance on which we can place the
	 */
	map: undefined,

	/**
	 * The openstreetmap query provider
	 */
	provider: null,

	mapTemplate: '<div id="map" style="height: 519px;"></div>',

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};
		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.apply(config, {
			id: 'map',
			xtype   : 'container',
			// #TRANSLATORS: The map of earth
			title   : _('Map'),
			cls: 'map',
			//proper body style for rendering gmaps
			listeners: {
				resize: this.resizeMap,
				scope: this
			},
		});

		Zarafa.plugins.gmaps.GmapsTab.superclass.constructor.call(this, config);
		
	},


	/**
	 * Called during rendering of the tab. This will initialize the {@link #gmap} using
	 * {@link #createGmap} and {@link #markers}.
	 * @private
	 */
	onRender: function(...props)
	{
		Zarafa.plugins.gmaps.GmapsTab.superclass.onRender.apply(this, arguments);
		this.latitude=container.getSettingsModel().get('zarafa/v1/plugins/gmaps/lat');
		this.longitude=container.getSettingsModel().get('zarafa/v1/plugins/gmaps/lng');
		this.markers = [];
		this.map = this.createGmap();
		this.provider = new GeoSearch.OpenStreetMapProvider()
	},

	/**
	 * Initiates Google Maps, creating maps object
	 * @return {Object} map - google maps object.
	 * @private
	 */
	createGmap: function(coords)
	{
		const map = L.map('map').setView([51.505, -0.09], 13);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);
		return map;
	},

	/**
	 * Event handler for the resize event of the tab. Will make sure the map is also resized correctly.
	 */
	resizeMap: function()
	{
		if ( this.map ) {
			this.map.invalidateSize();
		}
	},

	/**
	 * Load record into gmaps panel
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to work with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update:function(record, contentReset)
	{
		// If the record is not opened, we don't care
		if (!record || !record.isOpened()) {
			return;
		}
		switch (this.itemId)
		{
			case 'contact':
				if (contentReset || record.isModifiedSinceLastUpdate('home_address') || record.isModifiedSinceLastUpdate('business_address') || record.isModifiedSinceLastUpdate('other_address')) {
					// Remove all markers
					this.resetMarkers();
					// Reinstantiate the markers

					var homeAddress = record.get('home_address');
					if (!Ext.isEmpty(homeAddress.trim()))
					{
						this.showOnMap(homeAddress, _('Home Address'));
					}

					var businessAddress = record.get('business_address');
					if (!Ext.isEmpty(businessAddress.trim()))
					{
						this.showOnMap(businessAddress, _('Business Address'));
					}

					var otherAddress = record.get('other_address');
					if (!Ext.isEmpty(otherAddress.trim()))
					{
						this.showOnMap(otherAddress, _('Other Address'));
					}

					if (Ext.isEmpty(container.getSettingsModel().get('zarafa/v1/plugins/gmaps/default_address')))
					{
						//setting Kopano headquarters coordinates if nothing found in settings
						this.latitude=51.996417;
						this.longitude=4.3850826000000325;
					}
				}
				break;
			case 'abuser':
				if (contentReset) {
					// Remove all markers
					this.resetMarkers();
					// Reinstantiate the markers
					var abContactAddress = record.get('street_address') + ' ' +
						record.get('state_or_province') + ' ' +
						record.get('locality')+' '+
						record.get('postal_code')+' '+
						record.get('country');
					if (!Ext.isEmpty(abContactAddress.trim()))
					{
						this.showOnMap(abContactAddress);
					}
				}
				break;
		}
	},

	/**
	 * The main address coding function.
	 * Shows google maps and puts markers on the coordinates
	 * where contacts' addresses are.
	 * @param {String} address - the address to convert to coordinates and to put marker
	 * @param {String} title (optional) - The title for the marker
	 * @private
	 */
	showOnMap: async function(address, title)
	{
			if(this.map && this.provider) {
				const results = await this.provider.search({ query: address }) || [];
				if(results.length > 0) {
					const coords = [results[0].y, results[0].x];
					L.marker(coords, {title}).addTo(this.map)
						.bindPopup(title);
					this.map.setView(coords, 6)
				}
			}
	},

});

//registration
Ext.reg('gmaps.contactgmapstab', Zarafa.plugins.gmaps.GmapsTab);
