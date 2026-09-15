/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.smime.data');

/**
 * @class Grommunio.plugins.smime.data.SmimeCertificateStore
 * @extends Grommunio.core.data.ListModuleStore
 * @xtype smime.certificatestore
 * Store specific for S/MIME Plugin which creates {@link Grommunio.plugins.smime.SmimeCertificateRecord record}.
 */
Grommunio.plugins.smime.data.SmimeCertificateStore = Ext.extend(Grommunio.core.data.ListModuleStore, {
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
			reader : new Grommunio.plugins.smime.data.JsonCertificateReader(),
			writer : new Grommunio.core.data.JsonWriter(),
			proxy  : new Grommunio.core.data.IPMProxy({
				listModuleName: 'pluginsmimemodule',
				itemModuleName: 'pluginsmimemodule'
			})
		});

		Grommunio.plugins.smime.data.SmimeCertificateStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('smime.certificatestore', Grommunio.plugins.smime.data.SmimeCertificateStore);
