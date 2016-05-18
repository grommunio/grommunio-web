Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.PluginMetaData
 * @extends Object
 *
 * The Meta Data object containing the registration details
 * of a {@link Zarafa.core.Plugin}. An instance of this object
 * must be passed to {@link Zarafa.core.Container#registerPlugin}.
 */
Zarafa.core.PluginMetaData = Ext.extend(Object, {
	/**
	 * @cfg {String} name (required) The unique name for this plugin.
	 * For a user-friendly name for UI components, see {@link #displayName}
	 */
	name : '',

	/**
	 * @cfg {String} displayName The display name for this plugin. This
	 * will be used in places where the plugin is referenced in UI components.
	 * If not provided, {@link #name} will be used.
	 */
	displayName : '',

	/**
	 * @cfg {String} settingsName Alternative name for the plugin as used
	 * in the {@link Zarafa.settings.SettingsModel settings} in which the settings
	 * for this {@link Zarafa.core.Plugin plugin} are being saved. If not provided,
	 * then {@link #name} will be used.
	 */
	settingsName : '',

	/**
	 * @cfg {String} iconCls The icon to be used in places where the plugin is referenced
	 * in UI components.
	 */
	iconCls : '',

	/**
	 * @cfg {String} about The about text. If provided, {@link Zarafa.core.Plugin#registerAboutText}
	 * will be automatically called during {@link Zarafa.core.Plugin#initPlugin initialization}.
	 */
	about : undefined,

	/**
	 * @cfg {Boolean} allowUserDisable True if the user is allowed to enable/disable
	 * the plugin through the settings. To obtain the enabled status, the function
	 * {@link #isEnabled} should always be referenced.
	 */
	allowUserDisable : true,

	/**
	 * @cfg {Boolean} allowUserVisible True if the user is allowed to see the plugin
	 * in the settings. To obtain the visibility status, the function
	 * {@link #isPrivate} should always be referenced.
	 */
	allowUserVisible : true,

	/**
	 * @cfg {Constructor} pluginConstructor (required) The constructor of the
	 * {@link Zarafa.core.Plugin} which is described by this PluginMetaData instance.
	 */
	pluginConstructor : undefined,

	/**
	 * The instance of the {@link Zarafa.core.Plugin} (instantiated using the
	 * {@link #pluginConstructor}). This is obtained using the {@link #getInstance}
	 * function.
	 * @property
	 * @type Zarafa.core.Plugin
	 * @private
	 */
	instance : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.apply(this, config);

		Zarafa.core.PluginMetaData.superclass.constructor.call(this, config);

		// Initialize displayName if not initialized from config
		if (Ext.isEmpty(this.displayName)) {
			this.displayName = this.name;
		}

		// Initialize settingsName if not initialized from config
		if (Ext.isEmpty(this.settingsName)) {
			this.settingsName = this.name;
		}
	},

	/**
	 * Determine if the plugin is enabled.
	 * @return {Boolean} True if the plugin is enabled
	 */
	isEnabled : function()
	{
		return !this.allowUserDisable || container.getSettingsModel().get(this.getSettingsBase() + '/enable') === true;
	},

	/**
	 * Determine if the plugin should be considered private.
	 * @return {Boolean} True if the plugin is private
	 */
	isPrivate : function()
	{
		return this.allowUserVisible === false;
	},

	/**
	 * Obtain the unique name for this plugin
	 * @return {String} The unique name for this plugin
	 */
	getName : function()
	{
		return this.name;
	},

	/**
	 * Obtain the display name for this plugin
	 * @return {String} The display name for this plugin
	 */
	getDisplayName : function()
	{
		return this.displayName;
	},

	/**
	 * Obtain the CSS classname for this plugin
	 * @return {String} The CSS classname for this plugin
	 */
	getIconCls : function()
	{
		return this.iconCls;
	},

	/**
	 * Obtain the About text containing the copyright and other disclaimers.
	 * @return {String} The about text for this plugin
	 */
	getAbout : function()
	{
		return this.about;
	},

	/**
	 * Obtain the base path for the {@link Zarafa.settings.SettingsModel settings} in which the settings
	 * for this plugin can be found. This uses the {@link #settingsName} within the special 'plugins' section
	 * of the settings.
	 * @return {String} The settings path
	 */
	getSettingsBase : function()
	{
		return 'zarafa/v1/plugins/' + this.settingsName;
	},

	/**
	 * Obtain the instance of the {@link Zarafa.core.Plugin} which is instantiated
	 * using the {@link #pluginConstructor}. This uses single-instancing using the {@link #instance}.
	 * Before calling this, the {@link #isEnabled} function should have been used to determine if the
	 * {@link Zarafa.core.Plugin} is allowed to be instantiated.
	 * property.
	 * @return {Zarafa.core.Plugin} The Plugin instance
	 */
	getInstance : function()
	{
		if (!this.instance) {
			this.instance = new this.pluginConstructor({ info : this });
		}
		return this.instance;
	}
});
