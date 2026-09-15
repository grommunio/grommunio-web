/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.ui.notifier');

/**
 * @class Grommunio.core.ui.notifier.LiveScrollSliderPlugin
 * @extends Grommunio.core.ui.notifier.PagingSliderPlugin
 *
 * Special {@link Grommunio.core.ui.notifier.LiveScrollSliderPlugin LiveScrollSliderPlugin} which shows the
 * a nice slider container which contains live scroll loading information into it.
 */
Grommunio.core.ui.notifier.LiveScrollSliderPlugin = Ext.extend(Grommunio.core.ui.notifier.PagingSliderPlugin, {
	/**
	 * @cfg {Boolean} pagingEnabled
	 * The pagingEnabled is true only when pagination is enabled.(Default to false)
	 */
	pagingEnabled: false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Position the container at the bottom-center
			sliderContainerPosition: 'b',
			pagingEnabled: false,
			sliderDuration: 5000
		});

		Grommunio.core.ui.notifier.LiveScrollSliderPlugin.superclass.constructor.call(this, config);
	}
});

Grommunio.onReady(function() {
	container.getNotifier().registerPlugin('livescrollslider', new Grommunio.core.ui.notifier.LiveScrollSliderPlugin());
});
