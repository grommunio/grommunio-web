Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.Notifier
 * @extends Object
 */
Zarafa.core.ui.notifier.Notifier = Ext.extend(Object, {
	/**
	 * The key-value list of all available plugins which
	 * might be used to send notify messages to. 
	 * @property 
	 * @type Object
	 */
	availablePlugins : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);

		this.availablePlugins = {};
	},

	/**
	 * Register the {@link Zarafa.core.ui.notifier.NotifyPlugin NotifyPlugin} to the
	 * Notifier instance. This will add the plugin for the given name on the
	 * {@link #availablePlugins} array. It will also make the name available
	 * to be set in the {@link Zarafa.core.SettingsManager Settings}.
	 *
	 * @param {String} name The name how the plugin must be registered.
	 * @param {Zarafa.core.ui.notifier.NotifyPlugin} plugin The plugin which must be registered.
	 */
	registerPlugin : function(name, plugin)
	{
		if (!Ext.isDefined(this.availablePlugins[name])) {
			this.availablePlugins[name] = plugin;
		}
	},

	/**
	 * Obtain the {@link Zarafa.core.ui.notifier.NotifyPlugin plugin} which should be used
	 * for Notifications for the given category.
	 *
	 * The category should be either "error", "warning", "info" or "debug", or a subtype thereof (e.g. "info.newmail"). When
	 * searching for a valid plugin, the {@link Zarafa.core.SettingsManager Settings} is consulted to find the
	 * correct pluginname. If no pluginname is found for the given category, a supertype will be tried. For example,
	 * if no pluginname is found for "info.alfresco", then it will try to find the pluginname for "info" instead.
	 * If no pluginname can be found, then 'default' will be used as categoryname. Finally, if that also has no
	 * plugin registered, then this function will return 'undefined'.
	 *
	 * @param {String} category The category for which the plugin is searched for.
	 * @return {Zarafa.core.ui.notifier.NotifyPlugin} The plugin.
	 */
	getPlugin : function(category)
	{
		var setting = 'zarafa/v1/main/notifier/' + category.replace(/\./g, '/') + (category != 'default' ? '/value' : '');
		var pluginName = container.getSettingsModel().get(setting);
		var plugin = this.availablePlugins[pluginName];

		if (!plugin && category != 'default') {
			var index = category.lastIndexOf('.');
			if (index > 0) {
				category = category.substr(0, index);
			} else {
				category = 'default';
			}

			plugin = this.getPlugin(category);
		}

		return plugin;
	},

	/**
	 * Send a notification to the user. This {@link #getPlugin requests} the plugin for the provided category.
	 * On the plugin the {@link Zarafa.core.ui.notifier.NotifyPlugin#notify notify} function is called to display
	 * the message to the user. If no plugin could be found for
	 * the given category, then no message will be shown to the user.
	 *
	 * @param {String} category The category which applies to the notification.
	 * @param {String} title The title which must be shown in the message.
	 * @param {String} message The message which should be displayed.
	 * @param {Object} config Configuration object which can be applied to the notifier
	 * This object can contain keys like:
	 * - container: Which is the container to which the notifier should be restricted
	 * - persistent: True to make the message persistent and don't disappear automatically
	 * - destroy: Don't create new message, but destroy previous one
	 * - update: Don't create a new message, but update previous one
	 * - reference: The original message which must be updated by this action
	 * - listeners: Event handlers which must be registered on the element
	 * @return {Mixed} A reference to the message which was created, this can be used
	 * as value for 'reference' in the config argument.
	 */
	notify : function(category, title, message, config)
	{
		var categoryName = category.toLowerCase();
		var plugin = this.getPlugin(categoryName);
		if (plugin) {
			return plugin.notify(categoryName, title, message, config);
		}
	}
});
