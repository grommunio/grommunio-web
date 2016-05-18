Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsCategory
 * @extends Ext.Container
 * @xtype zarafa.settingscategory
 *
 * The main category object which defines the {@link #title name} of the category
 * and all the {@link Zarafa.settings.ui.SettingsWidget widgets} ({@link #items})
 * which should be displayed in the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}.
 *
 * This object should be used for registering new categories through the
 * {@link Zarafa.settings.ui.SettingsMainPanel#context.settings.categories insertion point}.
 */
Zarafa.settings.ui.SettingsCategory = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Array} items The array of configuration
	 * objects for the {@link Zarafa.settings.ui.SettingsWidget Settings Widgets}
	 * which should be shown in the center panel of the
	 * {@link Zarafa.settings.ui.SettingsMainPanel}.
	 */
	items : undefined,

	/**
	 * @cfg {Zarafa.settings.SettingsContext} settingsContext
	 */
	settingsContext : undefined,

	/**
	 * @cfg {String} title The title of the category, this string
	 * will be displayed in the left panel of the
	 * {@link Zarafa.settings.ui.SettingsMainPanel}.
	 */
	title : '',

	/**
	 * @cfg {Number} categoryIndex The index of the category
	 * in the {@link Zarafa.settings.ui.SettingsCategoryPanel category list}
	 */
	categoryIndex : 100,

	/**
	 * The reference as returned by {@link Zarafa.core.ui.notifier.Notifier#notify} to reference the
	 * message in order to remove the message as soon as the save was completed.
	 * @property
	 * @type Ext.Element
	 * @private
	 */
	savingEl : undefined,

	/**
	 * Each widget can have different saving methods (saving settings through the {@link Zarafa.settings.SettingsModel settings}
	 * or perhaps through an alternative {@link Ext.data.Store}. This counter keeps track how many saving methods have been
	 * {@link #displaySavingMask started} and will only {@link #hideSavingMask hide} it when all saving methods have completed.
	 * @property
	 * @type Number
	 * @private
	 */
	savingElCounter : 0,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			autoScroll: true
		});

		Zarafa.settings.ui.SettingsCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Called by superclass when the Category has been selected and is shown to the user,
	 * this will register the {@link #onBeforeSaveSettings} event handler.
	 * @private
	 */
	onShow : function()
	{
		Zarafa.settings.ui.SettingsCategory.superclass.onShow.apply(this, arguments);

		this.mon(container.getCurrentContext().getModel(), 'beforesavesettings', this.onBeforeSaveSettingsModel, this);
	},

	/**
	 * Called by superclass when the Category has been deselected and is hidden from the user,
	 * this will unregister the {@link #onBeforeSaveSettings} event handler.
	 * @private
	 */
	onHide : function()
	{
		Zarafa.settings.ui.SettingsCategory.superclass.onHide.apply(this, arguments);

		this.mun(container.getCurrentContext().getModel(), 'beforesavesettings', this.onBeforeSaveSettingsModel, this);

		// Unregister the 'beforesave' event. This could be lingering when
		// 'savesettings' was fired but it was cancelled by one of the
		// event handlers.
		this.mun(container.getSettingsModel(), 'beforesave', this.onBeforeSettingsSave, this);
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
		// Listen to the settings model to determine when the saving mask can be removed.
		var model = container.getSettingsModel();
		this.mon(model, 'beforesave', this.onBeforeSettingsSave, this, { single : true });

		// We will start saving, however each category can have multiple
		// saving methods (not just settings). So we keep track of those
		// using a counter if this counter reaches 0 we know that all
		// saving methods have completed.
		this.savingElCounter = 0;
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.settings.SettingsModel SettingsModel} fires
	 * the {@link Zarafa.settings.SettingsModel#beforesave beforesave} event.
	 * This will {@link #displaySavingMask Display a notifier} to the user, and will wait until the save was completed.
	 * @param {Zarafa.settings.SettingsModel} model The settings model which fired the event
	 * @private
	 */
	onBeforeSettingsSave : function(model)
	{
		this.displaySavingMask();

		// Unregister the event handler, we will listen for it again when the ContextModel
		// is about to save the settings again.
		this.mun(model, 'beforesave', this.onBeforeSettingsSave, this);

		// We know the settingsmodel is going to be saved, so we can listen for the event.
		this.mon(model, 'save', this.onSettingsSave, this);
		this.mon(model, 'exception', this.onSettingsException, this);
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.settings.SettingsModel SettingsModel}
	 * fires the {@link Zarafa.settings.SettingsModel#save save} event. This will update the
	 * notification messages.
	 * @param {Zarafa.settings.SettingsModel} model The settings model which fired the event
	 * @private
	 */
	onSettingsSave : function(model)
	{
		// Remove event handlers
		this.mun(model, 'save', this.onSettingsSave, this);
		this.mun(model, 'exception', this.onSettingsException, this);

		this.hideSavingMask(true);
	},

	/**
	 * Called when the {@link Zarafa.settings.SettingsModel} fires the {@link Zarafa.settings.SettingsModel#exception exception}
	 * event to indicate the settings were not successfully saved.
	 * @param {Zarafa.settings.SettingsModel} model The settings model which fired the event
	 * @private
	 */
	onSettingsException : function(model)
	{
		// Remove event handlers
		this.mun(model, 'save', this.onSettingsSave, this);
		this.mun(model, 'exception', this.onSettingsException, this);

		this.hideSavingMask(false);
	},

	/**
	 * Show a {@link Zarafa.core.ui.notifier.Notifier Notification} to the user indicating that the
	 * settings are being saved. This will initialize {@link #savingEl}.
	 * This uses the {@link #savingElCounter} counter to determine if this was the first Saving method
	 * to show the notification.
	 * @private
	 */
	displaySavingMask : function()
	{
		// Increase the counter for savingEl, as we have a new saving method
		// which will handle saving.
		this.savingElCounter++;

		// If we don't have the notifier yet, show it now.
		if (!this.savingEl) {
			this.savingEl = container.getNotifier().notify('info.saving', '', _('Saving') + '...', {
				container : container.getContentPanel().getEl(),
				persistent : true
			});
		}
	},

	/**
	 * Hide the {@link Zarafa.core.ui.notifier.Notifier Notification} from {@link #displaySavingMask}
	 * and optionally show a new Notification indicatin that the settings were saved successfully.
	 * This uses the {@link #savingElCounter} counter to determine if this was the last Saving method
	 * in order to update the notifications.
	 * @param {Boolean} success True if a notification should be shown that the settings were saved.
	 * @private
	 */
	hideSavingMask : function(success)
	{
		var contentEl = container.getContentPanel().getEl();

		// Reduce the counter for the savingEl, as one of the used
		// saving methods has completed.
		this.savingElCounter--;

		// If this was the last saving method, we can complete it.
		// If the save was not successful we immediately hide the
		// notification as well, to prevent other saving methods
		// from falsy reporting success.
		if (this.savingElCounter === 0 || !success) {
			if (this.savingEl) {
				container.getNotifier().notify('info.saving', null, null, {
					container : contentEl,
					destroy : true,
					reference : this.savingEl
				});

				delete this.savingEl;

				if (success) {
					container.getNotifier().notify('info.saved', _('Saved'), _('Saved successfully'), {
						container : contentEl
					});
				}
			}
		}
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 *
	 * By default this will call {@link Zarafa.settings.ui.SettingsWidget#update} on all
	 * {@link #items}
	 *
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		var widgets = this.findByType('zarafa.settingswidget');
		for (var i = 0, len = widgets.length; i < len; i++) {
			widgets[i].update.apply(widgets[i], arguments);
		}
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 *
	 * By default this will call {@link Zarafa.settings.ui.SettingsWidget#updateSettings} on all
	 * {@link #items}
	 *
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		var widgets = this.findByType('zarafa.settingswidget');
		for (var i = 0, len = widgets.length; i < len; i++) {
			widgets[i].updateSettings.apply(widgets[i], arguments);
		}
	}
});

Ext.reg('zarafa.settingscategory', Zarafa.settings.ui.SettingsCategory);
