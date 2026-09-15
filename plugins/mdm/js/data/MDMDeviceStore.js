Ext.namespace('Grommunio.plugins.mdm.data');

/**
 * @class Grommunio.plugins.mdm.data.MDMDeviceStore
 * @extends Grommunio.core.data.ListModuleStore
 * @xtype mdm.devicestore
 * Store specific for MDM Plugin which creates {@link Grommunio.plugins.mdm.MDMDeviceRecord record}.
 */
Grommunio.plugins.mdm.data.MDMDeviceStore = Ext.extend(Grommunio.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			remoteSort: false,
			reader : new Grommunio.plugins.mdm.data.JsonCertificateReader(),
			writer : new Grommunio.core.data.JsonWriter(),
			proxy  : new Grommunio.plugins.mdm.data.MDMDeviceProxy()
		});

		this.addEvents(
			/**
			 * @event beforeloadrecord
			 * Fires before loading records into the store.
			 * @param {Boolean} isAuthenticated false if user is authenticated to grommunio-sync server else true.
			 */
			"beforeloadrecord"
		);

		Grommunio.plugins.mdm.data.MDMDeviceStore.superclass.constructor.call(this, config);
	},

	/**
	 * Function is used as a callback for 'read' action. It is overridden to be able to
	 * add authentication with grommunio-sync server info if available in metadata
	 * and fire {@link #authenticationerror} event.
	 * @param {Object} data data that is returned by the proxy after processing it. will contain
	 * {@link Grommunio.plugins.mdm.data.MDMDeviceRecord record}.
	 * @param {Object} options options that are passed through {@link #load} event.
	 * @param {Boolean} success success status of request.
	 * @param {Object} metaData extra information that is received with response data.
	 */
	loadRecords : function( data, options, success, metaData )
	{
		if (metaData && metaData.authenticationInfo) {
			var isAuthenticated = metaData.authenticationInfo.authentication;
			this.fireEvent("beforeloadrecord", isAuthenticated);
		}

		Grommunio.plugins.mdm.data.MDMDeviceStore.superclass.loadRecords.apply(this, arguments);
	}
});

Ext.reg('mdm.devicestore', Grommunio.plugins.mdm.data.MDMDeviceStore);
