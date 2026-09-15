Ext.namespace('Grommunio.plugins.passwd');

/**
 * @class Grommunio.plugins.passwd.PasswdPlugin
 * @extends Grommunio.core.Plugin
 *
 * Passwd plugin.
 * Allows users to change password from grommunio Web.
 */
Grommunio.plugins.passwd.PasswdPlugin = Ext.extend(Grommunio.core.Plugin, {

	/**
	 * Initialize the plugin by registering to the insertion point
	 * to add something to the right end of the main tab bar.
	 * @protected
	 */
	initPlugin : function()
	{
		Grommunio.plugins.passwd.PasswdPlugin.superclass.initPlugin.apply(this, arguments);

		// Register categories for the settings
		this.registerInsertionPoint('context.settings.categories', this.createSettingsCategory, this);
	},

	/**
	 * Create the delegate {@link Grommunio.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Grommunio.settings.SettingsContext}. This will create new
	 * {@link Grommunio.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Grommunio.calendar.ui.SettingsPasswdCategory Password}
	 * in the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Grommunio.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Grommunio.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createSettingsCategory : function(insertionName, settingsMainPanel, settingsContext)
	{
		return {
			xtype : 'grommunio.settingspasswdcategory',
			settingsContext : settingsContext
		};
	}
});

Grommunio.onReady(function() {
	container.registerPlugin(new Grommunio.core.PluginMetaData({
		name : 'passwd',
		displayName : _('Change Password'),
		about : Grommunio.plugins.passwd.ABOUT,
		pluginConstructor : Grommunio.plugins.passwd.PasswdPlugin
	}));
});
