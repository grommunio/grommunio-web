Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsFavoritePanel
 * @extends Ext.Panel
 * @xtype zarafa.settingsfavoritepanel
 *
 * The extra container which displays the favorite settings on which the user
 * can click to be directly forwarded to that particular setting on the correct
 * {@link Zarafa.settings.ui.SettingsCategoryTab tab}.
 *
 * When a {@link Zarafa.core.Plugin Plugins} register a
 * {@link Zarafa.settings.ui.SettingsWidget SettingsWidget} with the
 * {@link Zarafa.settings.ui.SettingsWidget#favorite favorite} property enabled,
 * then it will be automatically added to the {@link #items} of this class.
 * However during {@link #initComponent initialization} it will check if the
 * given {@link Zarafa.settings.ui.SettingsWidget SettingsWidget} is officially
 * allowed to be listed in the favorites panel.
 */
Zarafa.settings.ui.SettingsFavoritePanel = Ext.extend(Ext.Panel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Favorite settings'),
			cls: 'zarafa-settings-favorite-panel'
		});

		Zarafa.settings.ui.SettingsFavoritePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the component, it will loop over all registered {@link #items}
	 * and will check if the widget {@link #isSupportedWidget is supported} to be
	 * inside this favorites panel
	 * @private
	 */
	initComponent : function()
	{
		Zarafa.settings.ui.SettingsFavoritePanel.superclass.initComponent.apply(this, arguments);

		for (var i = 0, len = this.items.length; i < len; i++) {
			var item = this.items.get(i);

			item.setVisible(this.isSupportedWidget(item.widget));
		}
	},

	/**
	 * Check if the given widget is allowed to be visible inside this panel. It will check if
	 * the given {@link Zarafa.settings.ui.SettingsWidget widget} is present in the the list of
	 * supported namespaces. 
	 * @param {Zarafa.settings.ui.SettingsWidget} widget The widget to check if it is supported
	 * @return {Boolean} True if the given widget is officially supported
	 * @private
	 */
	isSupportedWidget : function(widget)
	{
		// These are the allowed namespaces
		var allowedNamespaces = [
			'Zarafa.calendar.settings',
			'Zarafa.contact.settings',
			'Zarafa.mail.settings',
			'Zarafa.note.settings',
			'Zarafa.settings.settings',
			'Zarafa.task.settings'
		];

		// Go over all namespaces to check in which namespace the
		// given widget exists.
		for (var i = 0, len = allowedNamespaces.length; i < len; i++) {
			var namespace = this.getNamespace(allowedNamespaces[i]);
			if (namespace) {
				for (var key in namespace) {
					if (namespace[key] === widget.constructor) {
						return true;
					}
				}
			}
		}

		return false;
	},

	/**
	 * Obtain the object belonging to the given namespace. This works similarly
	 * as {@link Ext#namespace} with the main difference that this function will
	 * not create the object if it didn't yet exist, instead it will return false.
	 * @param {String} namespace The namespace for which the object is requested
	 * @return {Object} The object represented by the namespace, false if the
	 * namespace didn't exist.
	 * @private
	 */
	getNamespace : function(namespace)
	{
		var parts = namespace.split('.');
		var root = window;

		for (var i = 0, len = parts.length; i < len; i++) {
			root = root[parts[i]];
			if (!Ext.isDefined(root)) {
				return false;
			}
		}

		return root;
	}
});

Ext.reg('zarafa.settingsfavoritepanel', Zarafa.settings.ui.SettingsFavoritePanel);
