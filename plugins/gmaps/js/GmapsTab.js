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
	 * The google map instance on which we can place the {@link #markers}
	 * @property
	 * @type google.maps.Map
	 */
	gmap : undefined,

	/**
	 * Array of Google Marker instances which are positioned on the {@link #gmap}.
	 * @property
	 * @type google.maps.Marker[]
	 */
	markers : undefined,

	/**
	 * Latitude for gmaps
	 * center display and directions rendering
	 * taken from settings.
	 * @property
	 * @type number
	 */
	latitude:null,

	/**
	 * Longitude for gmaps
	 * center display and directions rendering
	 * taken from settings.
	 * @property
	 * @type number
	 */
	longitude:null,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};
		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.apply(config, {
			xtype     : 'gmaps.contactgmapstab',
			// #TRANSLATORS: The map of earth
			title     : _('Map'),
			//proper body style for rendering gmaps
			bodyStyle : 'width: 100%; height: 500px',
			listeners : {
				resize: this.resizeMap,
				scope: this
			}
		});

		Zarafa.plugins.gmaps.GmapsTab.superclass.constructor.call(this, config);
	},

	/**
	 * Called during rendering of the tab. This will initialize the {@link #gmap} using
	 * {@link #createGmap} and {@link #markers}.
	 * @private
	 */
	onRender : function()
	{
		Zarafa.plugins.gmaps.GmapsTab.superclass.onRender.apply(this, arguments);
		this.latitude=container.getSettingsModel().get('zarafa/v1/plugins/gmaps/lat');
		this.longitude=container.getSettingsModel().get('zarafa/v1/plugins/gmaps/lng');
		this.gmap = this.createGmap();
		this.markers = [];
	},

	/**
	 * Initiates Google Maps, creating maps object
	 * @return {Object} map - google maps object.
	 * @private
	 */
	createGmap: function()
	{
		var latlng = new google.maps.LatLng(this.latitude, this.longitude);
		var myOptions = {
			zoom: 14,
			center: latlng,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		return new google.maps.Map(this.body.dom, myOptions);
	},

	/**
	 * Event handler for the resize event of the tab. Will make sure the map is also resized correctly.
	 */
	resizeMap : function()
	{
		if ( this.gmap ){
			google.maps.event.trigger(this.gmap, "resize");
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
		this.checkHash();
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

	/** Here to optimize the number of requests to gmaps we
	 * check the md5 hash of default settings address
	 * and if it is either empty or changed
	 * we find the new one and re-geocode it.
	 * @private
	*/
	checkHash:function()
	{
		//current settings default address
		var defaultAddress=container.getSettingsModel().get('zarafa/v1/plugins/gmaps/default_address');
		//md5 hash which is obtained from settings
		var defaultAddressMD5Hash = Ext.ux.MDHash(defaultAddress);
		//current settings md5 value
		var settingsMD5=container.getSettingsModel().get('zarafa/v1/plugins/gmaps/md5');

		if ((Ext.isEmpty(settingsMD5) || settingsMD5!=defaultAddressMD5Hash))
		{
			//setting new md5 value to settings
			container.getSettingsModel().set('zarafa/v1/plugins/gmaps/md5', defaultAddressMD5Hash);
			//new geocode coordinates
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({ 'address': defaultAddress}, this.callbackGeocodeForSettings.createDelegate(this));
		}
	},

	/**
	 * The callback callback function for google
	 * geocoder to obtain geographical coordinates from the
	 * given address.
	 * @param {google.maps.GeocoderResult} results - results of google
	 * geocoder work
	 * @param {google.maps.GeocoderStatus} status - the status
	 * of geocoder work
	 * @param {String} address - the address to render route
	 * @param {String} title - the title for gmaps marker
	 * @private
	 */
	callbackGeocodeResult:function(results, status, address ,title)
	{
		if (status == google.maps.GeocoderStatus.OK)
		{
			var latLng= results[0].geometry.location;
			//setting up markers
			this.callbackSetMarkers(title, latLng);
			//rendering directions
			if (container.getSettingsModel().get('zarafa/v1/plugins/gmaps/show_routes'))
			{
				this.renderRoutes(address, latLng);
			}
		}
	},

	/**
	 * The callback callback function for google
	 * geocoder to obtain geographical coordinates from the
	 * given address and set to settings.
	 * @param {google.maps.GeocoderResult} results - results of google
	 * geocoder work
	 * @param {google.maps.GeocoderStatus} status - the status
	 * of geocoder work
	 * @private
	 */
	callbackGeocodeForSettings:function(results, status)
	{
		if (status == google.maps.GeocoderStatus.OK)
		{

			var settingsLat= results[0].geometry.location.lat();
			var settingsLng=results[0].geometry.location.lng();

			container.getSettingsModel().beginEdit();
			container.getSettingsModel().set('zarafa/v1/plugins/gmaps/lat', settingsLat);
			container.getSettingsModel().set('zarafa/v1/plugins/gmaps/lng', settingsLng);
			container.getSettingsModel().endEdit();
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
	showOnMap : function(address, title)
	{
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({ 'address': address}, this.callbackGeocodeResult.createDelegate(this,[address, title], true));
	},

	/**
	 * The function for rendering gmaps route
	 * from the default address from the settings to the first given address.
	 * @param address - the first filled in address of the user to
	 * render route to.
	 * @param {google.maps.LatLng} latlng - the coordinates of destiantion address
	 * @private
	 */
	renderRoutes:function(address, latlng)
	{
		var directionsService = new google.maps.DirectionsService();

		var dirRequest={
			//get route from the default address to contact address
			origin: container.getSettingsModel().get('zarafa/v1/plugins/gmaps/default_address'),
			destination: latlng,
			travelMode: google.maps.TravelMode.DRIVING
		};

		//only if we have the first address filled in
		if (this.markers.length==1)
		{
			dirRequest.destination=address;
			//rendering gmaps directions
			directionsService.route(dirRequest, this.callbackSetDirections.createDelegate(this));
		}
	},


	/**
	 * The callback function for renderring google
	 * maps markers.
	 * @param {string} title - the title for this gmaps marker
	 * @param {google.maps.LatLng} latlng - the coordinates for rendering markers
	 */
	callbackSetMarkers:function(title, latlng)
	{
		this.gmap.setCenter(latlng);
		this.markers.push(new google.maps.Marker({
			map: this.gmap,
			position:  latlng,
			title : title
		}));
	},

	/**
	 * The callback function for google
	 * directions service.
	 * @param {google.maps.GeocoderResult} results - results of google
	 * geocoder work
	 * @param {google.maps.GeocoderStatus} status - the status
	 * of geocoder work
	 * @private
	 */
	callbackSetDirections:function(result, status)
	{
		var directionsDisplay = new google.maps.DirectionsRenderer({draggable: true});
		directionsDisplay.setMap(this.gmap);
		if (status == google.maps.DirectionsStatus.OK)
		{
			directionsDisplay.setDirections(result);
		}
	},

	/**
	 * Resets the {@link #markers}, removing the given markers from the {@link #gmap}.
	 * @private
	 */
	resetMarkers : function()
	{
		for (var i = 0; i < this.markers.length; i++) {
			// Calling setMap without arguments, removes the marker.
			this.markers[i].setMap();
		}
		this.markers = [];
	}
});

//registration
Ext.reg('gmaps.contactgmapstab', Zarafa.plugins.gmaps.GmapsTab);
