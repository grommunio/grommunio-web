Ext.namespace('Zarafa.plugins.google2fa');

/**
 * @class Zarafa.plugins.google2fa.Google2FA
 * @extends Zarafa.core.Plugin
 */
Zarafa.plugins.google2fa.Google2FA = Ext.extend(Zarafa.core.Plugin, {

    /**
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor: function (config) {
        config = config || {};

        Zarafa.plugins.google2fa.Google2FA.superclass.constructor.call(this, config);
    },

    /**
     * Init plugin
     */
    initPlugin: function () {
        Zarafa.plugins.google2fa.Google2FA.superclass.initPlugin.apply(this, arguments);
        Zarafa.plugins.google2fa.data.Configuration.init();
        this.registerInsertionPoint("context.settings.categories", this.createSettingCategories, this);
    },

    /**
     * Create category in settings
     */
    createSettingCategories: function () {
        return {
            xtype: "Zarafa.plugins.google2fa.category"
        };
    }
});

Zarafa.onReady(function () {
    let allowUserDisable = container.getSettingsModel().get('zarafa/v1/plugins/google2fa/user_disable_allowed');

    container.registerPlugin(new Zarafa.core.PluginMetaData({
        name: 'google2fa',
        displayName: _('Google2FA Plugin'),
        allowUserDisable: allowUserDisable,
        pluginConstructor: Zarafa.plugins.google2fa.Google2FA
    }));
});
