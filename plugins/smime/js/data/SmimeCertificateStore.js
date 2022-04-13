Ext.namespace('Zarafa.plugins.smime.data');

/**
 * @class Zarafa.plugins.smime.data.SmimeCertificateStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype smime.certificatestore
 * Store specific for S/MIME Plugin which creates {@link Zarafa.plugins.smime.SmimeCertificateRecord record}.
 */
Zarafa.plugins.smime.data.SmimeCertificateStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			autoLoad : true,
			remoteSort: false,
			reader : new Zarafa.plugins.smime.data.JsonCertificateReader(),
			writer : new Zarafa.core.data.JsonWriter(),
			proxy  : new Zarafa.core.data.IPMProxy({
				listModuleName: 'pluginsmimemodule',
				itemModuleName: 'pluginsmimemodule'
			})
		});

		Zarafa.plugins.smime.data.SmimeCertificateStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('smime.certificatestore', Zarafa.plugins.smime.data.SmimeCertificateStore);
