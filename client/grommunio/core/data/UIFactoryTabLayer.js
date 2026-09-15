/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.UIFactoryTabLayer
 * @extends Grommunio.core.data.UIFactoryLayer
 *
 * This layer supports placing {@link Grommunio.core.ui.ContentPanel Content Panels}
 * to be placed inside a {@link Ext.TabPanel} instance.
 */
Grommunio.core.data.UIFactoryTabLayer = Ext.extend(Grommunio.core.data.UIFactoryLayer, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			type: 'tabs',
			index: 1,
			allowModal: false,
			plugins: [ 'grommunio.contenttablayerplugin' ]
		});

		Grommunio.core.data.UIFactoryTabLayer.superclass.constructor.call(this, config);
	},

	/**
	 * The create function which is invoked when a component needs to be added to the Container using
	 * this Layer.
	 * @param {Function} Constructor The constructor of the component which has to be created in the container layer.
	 * @param {Object} config The configuration object which must be
	 * passed to the constructor when creating the component
	 * @protected
	 */
	create: function(component, config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.enablefocusplugin');

		var tabContainer = new component(config);
		container.getTabPanel().add(tabContainer);
	}
});

Grommunio.core.data.UIFactory.registerLayer(new Grommunio.core.data.UIFactoryTabLayer());
