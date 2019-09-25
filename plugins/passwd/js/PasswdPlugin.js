Ext.namespace('Zarafa.plugins.passwd');

/**
 * @class Zarafa.plugins.passwd.PasswdPlugin
 * @extends Zarafa.core.Plugin
 *
 * Passwd plugin.
 * Allows users to change password from webapp.
 */
Zarafa.plugins.passwd.PasswdPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Initialize the plugin by registering to the insertion point
	 * to add something to the right end of the main tab bar.
	 * @protected
	 */
	initPlugin : function()
	{
		Zarafa.plugins.passwd.PasswdPlugin.superclass.initPlugin.apply(this, arguments);

		// Register categories for the settings
		this.registerInsertionPoint('context.settings.categories', this.createSettingsCategory, this);
	},

	/**
	 * Create the delegate {@link Zarafa.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Zarafa.settings.SettingsContext}. This will create new
	 * {@link Zarafa.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Zarafa.calendar.ui.SettingsPasswdCategory Password}
	 * in the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Zarafa.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Zarafa.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createSettingsCategory : function(insertionName, settingsMainPanel, settingsContext)
	{
		return {
			xtype : 'zarafa.settingspasswdcategory',
			settingsContext : settingsContext
		};
	}
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'passwd',
		displayName : _('Change Password'),
		about : Zarafa.plugins.passwd.ABOUT,
		pluginConstructor : Zarafa.plugins.passwd.PasswdPlugin
	}));
});
