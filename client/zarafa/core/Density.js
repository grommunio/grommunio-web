Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.Density
 * @singleton
 *
 * Applies the list spacing from the settings as a class on the body,
 * which the stylesheet turns into tighter grid rows.
 */
Zarafa.core.Density = {
	/**
	 * @property {String} setting The settings path of the density.
	 */
	setting: 'zarafa/v1/main/density',

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
	 * @param {Zarafa.settings.SettingsModel} model The settings model
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
