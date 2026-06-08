Ext.namespace('Zarafa.plugins.passkey');

/**
 * @class Zarafa.plugins.passkey.PasskeyPlugin
 * @extends Zarafa.core.Plugin
 *
 * This class integrates the Passkey plugin into grommunio Web.
 * It allows users to set up and manage their Passkeys for their account.
 */
Zarafa.plugins.passkey.PasskeyPlugin = Ext.extend(Zarafa.core.Plugin, {

    /**
     * @constructor
     * @param {Object} config
     */
    constructor: function (config) {
        config = config || {};

        Zarafa.plugins.passkey.PasskeyPlugin.superclass.constructor.call(this, config);
    },

    /**
     * This method is called by the parent and will initialize all insertion points
     * and shared components.
     */
    initPlugin: function () {
        Zarafa.plugins.passkey.PasskeyPlugin.superclass.initPlugin.apply(this, arguments);

        Zarafa.plugins.passkey.data.Configuration.init();

        this.registerInsertionPoint("context.settings.categories", this.createSettingCategories, this);
    },

    /**
     * Create category in settings
     */
    createSettingCategories: function () {
        return {
            xtype: "Zarafa.plugins.passkey.category"
        };
    }
});

/**
 * This code gets executed after grommunio Web has loaded.
 * It hooks the plugin to grommunio Web.
 */
Zarafa.onReady(function () {
    container.registerPlugin(new Zarafa.core.PluginMetaData({
        name: 'passkey',
        displayName: _('Passkey Plugin'),
        allowUserDisable: true,
        pluginConstructor: Zarafa.plugins.passkey.PasskeyPlugin
    }));
});
