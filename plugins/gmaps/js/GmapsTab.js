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
	map: undefined,

	mapTemplate: '<div id="map" style="height: 519px;"></div>',

	/**
	 * Array of Google Marker instances which are positioned on the {@link #gmap}.
	 * @property
	 * @type google.maps.Marker[]
	 */
	markers: undefined,

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
	constructor: function(config)
	{
		config = config || {};
		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.apply(config, {
			xtype   : 'container',
			// #TRANSLATORS: The map of earth
			title   : _('Map'),
			cls: 'map',
			//proper body style for rendering gmaps
			listeners: {
				resize: this.resizeMap,
				scope: this
			},
			items: [
				this.activeReminderPanel()
			]
		});

		Zarafa.plugins.gmaps.GmapsTab.superclass.constructor.call(this, config);

		if (Ext.isString(this.activeReminderTemplate)) {
			this.activeReminderTemplate = new Ext.XTemplate(this.activeReminderTemplate, {
				compiled: true
			});
		}
	},

	loadRequiredFiles: function () {
		var scripts = ['plugins/gmaps/js/leaflet.js'];
		var styles = ['plugins/gmaps/js/leaflet.css'];
		var filesloaded = 0;
		var filestoload = scripts.length + styles.length;
		for (var i = 0; i < scripts.length; i++) {
				var script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = scripts[i];
				script.onload = function () {
						filesloaded++;
						finishLoad();
				};
				document.head.appendChild(script);
		}
		for (var i = 0; i < styles.length; i++) {
				var style = document.createElement('link');
				style.rel = 'stylesheet';
				style.href = styles[i];
				style.type = 'text/css';
				style.onload = function () {
						filesloaded++;
						finishLoad();
				};
				document.head.appendChild(style);
		}
		function finishLoad() {
				if (filesloaded === filestoload) {
						var map = L.map('map').setView([51.505, -0.09], 13);
						L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
							attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						}).addTo(map);
						return map;
				}
		}
},

	activeReminderPanel: function()
	{
		return {
			xtype: 'panel',
			html: this.mapTemplate
		};
	},

	/**
	 * Called during rendering of the tab. This will initialize the {@link #gmap} using
	 * {@link #createGmap} and {@link #markers}.
	 * @private
	 */
	onRender: function()
	{
		Zarafa.plugins.gmaps.GmapsTab.superclass.onRender.apply(this, arguments);
		this.latitude=container.getSettingsModel().get('zarafa/v1/plugins/gmaps/lat');
		this.longitude=container.getSettingsModel().get('zarafa/v1/plugins/gmaps/lng');
		this.map = this.createGmap();
		this.markers = [];
	},

	/**
	 * Initiates Google Maps, creating maps object
	 * @return {Object} map - google maps object.
	 * @private
	 */
	createGmap: function(coords)
	{
		return this.loadRequiredFiles();
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
		if (status == 'ok')
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
		if (status == 'ok')
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
	showOnMap: function(address, title)
	{
			//var geocoder = new google.maps.Geocoder();
			//geocoder.geocode({ 'address': address}, this.callbackGeocodeResult.createDelegate(this,[address, title], true));
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
			travelMode: false
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
		this.map.setCenter(latlng);
		/*
		this.markers.push(new google.maps.Marker({
			map: this.gmap,
			position:  latlng,
			title: title
		}));
		*/
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
		//var directionsDisplay = new google.maps.DirectionsRenderer({draggable: true});
		//directionsDisplay.setMap(this.gmap);
		//if (status == google.maps.DirectionsStatus.OK)
		//{
		//	directionsDisplay.setDirections(result);
		//}
	},

	/**
	 * Resets the {@link #markers}, removing the given markers from the {@link #gmap}.
	 * @private
	 */
	resetMarkers: function()
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
