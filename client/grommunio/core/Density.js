/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core');

/**
 * @class Grommunio.core.Density
 * @singleton
 *
 * Applies the list spacing from the settings as a class on the body,
 * which the stylesheet turns into tighter grid rows.
 */
Grommunio.core.Density = {
	/**
	 * @property {String} setting The settings path of the density.
	 */
	setting: 'grommunio/v1/main/density',

	/**
	 * Applies the saved density and follows later changes of the setting.
	 */
	init: function()
	{
		var model = container.getSettingsModel();
		this.apply(model.get(this.setting));
		model.on('set', this.onSettingsSet, this);
	},

	/**
	 * @param {Grommunio.settings.SettingsModel} model The settings model
	 * @param {Object/Array} settings The changed settings
	 * @private
	 */
	onSettingsSet: function(model, settings)
	{
		settings = Ext.isArray(settings) ? settings : [ settings ];
		for (var i = 0; i < settings.length; i++) {
			if (settings[i] && settings[i].path === this.setting) {
				this.apply(model.get(this.setting));
				return;
			}
		}
	},

	/**
	 * @param {String} density 'comfortable' or 'compact'
	 */
	apply: function(density)
	{
		document.body.classList.toggle('k-density-compact', density === 'compact');
	}
};
