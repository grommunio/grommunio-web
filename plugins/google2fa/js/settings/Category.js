Ext.namespace("Zarafa.plugins.google2fa.settings");

/**
 * @class Zarafa.plugins.google2fa.settings.SettingsGoogle2FACategory
 * @extends Zarafa.settings.ui.SettingsCategory
 *
 * Category view for two-factor authentication in settings
 */
Zarafa.plugins.google2fa.settings.Category = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
    /**
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor: function (config) {
        config = config || {};
        Ext.applyIf(config, {
            title: _('Two-factor authentication'),
            categoryIndex: 1,
            iconCls: "icon_google2fa_category",
            items: [{
                xtype: "Zarafa.plugins.google2fa.generalsettingswidget"
            }, container.populateInsertionPoint("context.settings.category.google2fa", this)]
        });
        Zarafa.plugins.google2fa.settings.Category.superclass.constructor.call(this, config);
    }
});

Ext.reg("Zarafa.plugins.google2fa.category", Zarafa.plugins.google2fa.settings.Category);
