Ext.namespace('Zarafa.plugins.smime.settings');

/**
 * @class Zarafa.plugins.smime.settings.SettingsSmimeCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype smime.settingssmimecategory
 *
 * The smime category for users which will
 * allow the user to upload public/private certificates
 */
Zarafa.plugins.smime.settings.SettingsSmimeCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
        /**
         * @insert context.settings.category.smime
         * Insertion point to register new {@link Zarafa.settings.settingssmimewidget widgets}
         * for the {@link Zarafa.smime.settings.settingssmimecategory}.
         * @param {Zarafa.smime.settings.settingssmimecategory} category The smime
         * category to which the widgets will be added.
         */

        /**
         * @constructor
         * @param {Object} config Configuration object
         */
        constructor : function(config) {
                config = config || {};
		this.store = new Zarafa.plugins.smime.data.SmimeCertificateStore();

                Ext.applyIf(config, {
			title : _('S/MIME', 'plugin_smime'),
                        categoryIndex : 1,
                        iconCls : 'icon_smime_settings',
                        items : [{
				xtype : 'smime.settingssmimewidget',
				store: this.store
                        },{
				xtype : 'smime.uploadcertificatewidget',
				store: this.store
                        },{
				xtype : 'smime.settingspublickeywidget',
				settingsContext : config.settingsContext,
				store: this.store
			}]
                });

                Zarafa.plugins.smime.settings.SettingsSmimeCategory.superclass.constructor.call(this, config);
        },

	/**
	 * Called by superclass when the Category has been deselected and is hidden from the user,
	 * this will unregister the {@link #onBeforeSaveRules} event handler.
	 * @private
	 */
	onHide : function()
	{
                Zarafa.plugins.smime.settings.SettingsSmimeCategory.superclass.onHide.apply(this, arguments);

		// Unregister the 'beforesave' event. This could be lingering when
		// 'savesettings' was fired but it was cancelled by one of the
		// event handlers.
		this.mun(this.store, 'beforesave', this.onBeforeSaveCertificate, this);
	},

	/**
	 * Event handler for the
	 * {@link Zarafa.settings.SettingsContextModel ContextModel}#{@link Zarafa.settings.SettingsContextModel#beforesavesettings beforesavesettings}
	 * event. It will reset the {@link #savingElCounter} and his will register the event handler for
	 * {@link Zarafa.settings.SettingsModel#beforesave beforesave} event.
	 * @private
	 */
	onBeforeSaveSettingsModel : function()
	{
		Zarafa.plugins.smime.settings.SettingsSmimeCategory.superclass.onBeforeSaveSettingsModel.apply(this, arguments);

		this.mon(this.store, 'beforesave', this.onBeforeSaveCertificate, this, { single : true });
	},
	
	/**
	 * Event handler which is fired when the {@link Zarafa.plugins.smime.data.SmimeCertificateStore SmimeCertificateStore}
	 * fires the 'beforesave' event. This will {@link #displaySavingMask show a notification} and register the
	 * event handlers for the completion of the save.
	 * @private
	 */
	onBeforeSaveCertificate : function()
	{
		this.displaySavingMask();

		this.mon(this.store, 'save', this.onCertificateSave, this);
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.plugins.smime.data.SmimeCertificateStore SmimeCertificateStore}
	 * fires the 'save' event indicating the successfull save of the delegates. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onCertificateSave : function()
	{
		this.hideSavingMask(true);

		this.mun(this.store, 'save', this.onCertificateSave, this);
	}
});

Ext.reg('smime.settingssmimecategory', Zarafa.plugins.smime.settings.SettingsSmimeCategory); 
