Ext.namespace('Zarafa.plugins.passkey.settings');

/**
 * @class Zarafa.plugins.passkey.settings.Category
 * @extends Zarafa.settings.ui.SettingsCategory
 * 
 * Settings category for the Passkey plugin
 */
Zarafa.plugins.passkey.settings.Category = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

    /**
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor: function(config) {
        config = config || {};

        Ext.applyIf(config, {
            title: _('Passkey authentication'),
            categoryIndex: 1,
            iconCls: 'icon_passkey_category',
            items: [{
                xtype: 'Zarafa.plugins.passkey.generalsettingswidget'
            }, container.populateInsertionPoint('context.settings.category.passkey', this)]
        });

        Zarafa.plugins.passkey.settings.Category.superclass.constructor.call(this, config);
    }
});

Ext.reg('Zarafa.plugins.passkey.category', Zarafa.plugins.passkey.settings.Category);
