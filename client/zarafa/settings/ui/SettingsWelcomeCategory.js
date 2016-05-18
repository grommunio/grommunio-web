Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsWelcomeCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingswelcomecategory
 *
 * The category which will be shown the user user who is logging in for the
 * first time, and is presented with the {@link Zarafa.core.ui.WelcomeViewport Welcome page}.
 */
Zarafa.settings.ui.SettingsWelcomeCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.welcome
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.settings.ui.SettingsWelcomeCategory Welcome Category}.
	 * @param {Zarafa.settings.ui.SettingsWelcomeCategory} category The welcome
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			categoryIndex : 0,
			iconCls : 'zarafa-settings-category-welcome',
			defaults : {
				cls : 'zarafa-settings-widget-welcome'
			},
			items : [{
				xtype : 'zarafa.settingsaccountwidget'
			},{
				xtype : 'zarafa.settingscalendarwidget'
			},
			container.populateInsertionPoint('context.settings.category.welcome', this)
			]
		});

		Zarafa.settings.ui.SettingsWelcomeCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Called during rendering of the component.
	 * This will hide the {@link Ext.form.Field Field} which corresponds
	 * to the 'zarafa/v1/contexts/calendar/datepicker_show_busy' setting.
	 * @protected
	 */
	onRender : function()
	{
		Zarafa.settings.ui.SettingsWelcomeCategory.superclass.onRender.apply(this, arguments);

		// We want don't want allow the configuration of the "Show Busy Dates" setting.
		var item = this.find('name', 'zarafa/v1/contexts/calendar/datepicker_show_busy');
		if (!Ext.isEmpty(item)) {
			item[0].hide();
		}
	}
});

Ext.reg('zarafa.settingswelcomecategory', Zarafa.settings.ui.SettingsWelcomeCategory);
