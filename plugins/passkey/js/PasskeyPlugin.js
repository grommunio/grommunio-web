Ext.namespace('Grommunio.plugins.passkey');

/**
 * @class Grommunio.plugins.passkey.PasskeyPlugin
 * @extends Grommunio.core.Plugin
 *
 * This class integrates the Passkey plugin into grommunio Web.
 * It allows users to set up and manage their Passkeys for their account.
 */
Grommunio.plugins.passkey.PasskeyPlugin = Ext.extend(Grommunio.core.Plugin, {

    /**
     * @constructor
     * @param {Object} config
     */
    constructor: function (config) {
        config = config || {};

        Grommunio.plugins.passkey.PasskeyPlugin.superclass.constructor.call(this, config);
    },

    /**
     * This method is called by the parent and will initialize all insertion points
     * and shared components.
     */
    initPlugin: function () {
        Grommunio.plugins.passkey.PasskeyPlugin.superclass.initPlugin.apply(this, arguments);

        Grommunio.plugins.passkey.data.Configuration.init();

        this.registerInsertionPoint("context.settings.categories", this.createSettingCategories, this);
    },

    /**
     * Create category in settings
     * @param {String} insertionName The name of the insertion point
     * @param {Grommunio.settings.ui.SettingsMainPanel} settingsMainPanel The panel to which the category is added
     * @param {Grommunio.settings.SettingsContext} settingsContext The settings context
     */
    createSettingCategories: function (insertionName, settingsMainPanel, settingsContext) {
        return {
            xtype: "passkey.category",
            settingsContext: settingsContext
        };
    }
});

/**
 * This code gets executed after grommunio Web has loaded.
 * It hooks the plugin to grommunio Web.
 */
Grommunio.onReady(function () {
    container.registerPlugin(new Grommunio.core.PluginMetaData({
        name: 'passkey',
        displayName: _('Passkey Plugin'),
        allowUserDisable: true,
        pluginConstructor: Grommunio.plugins.passkey.PasskeyPlugin
    }));
});
