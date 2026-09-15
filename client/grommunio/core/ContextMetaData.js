/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core');

/**
 * @class Grommunio.core.ContextMetaData
 * @extends Grommunio.core.PluginMetaData
 *
 * The Meta Data object containing the registration details
 * of a {@link Grommunio.core.Context}. An instance of this object
 * must be passed to {@link Grommunio.core.Container#registerContext}.
 */
Grommunio.core.ContextMetaData = Ext.extend(Grommunio.core.PluginMetaData, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// By default Contexts cannot be disabled
			allowUserDisable: false
		});

		Grommunio.core.ContextMetaData.superclass.constructor.call(this, config);
	}
});
