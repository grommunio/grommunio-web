Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsCategoryWidgetPanel
 * @extends Ext.Container
 * @xtype zarafa.settingscategorywidgetpanel
 *
 * The main container in which the {@link Zarafa.settings.ui.SettingsCategory categories}
 * will display all their settings. This panel has a {@link Ext.layout.CardLayout} to
 * ensure only a single category will be shown at the same time.
 */
Zarafa.settings.ui.SettingsCategoryWidgetPanel = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Zarafa.settings.SettingsContext} context The context which
	 * is using this widget panel
	 */
	context : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			layout : 'card',
			cls : 'zarafa-settings-category-widget-panel'
		});

		Zarafa.settings.ui.SettingsCategoryWidgetPanel.superclass.constructor.call(this, config);

		if (this.context) {
			var model = this.context.getModel();

			this.mon(this.context, {
				viewchange : this.onViewChange,
				viewmodechange : this.onViewModeChange,
				scope : this
			});

			this.mon(model, {
				beforesavesettings : this.onBeforeSaveSettings,
				savesettings : this.onSaveSettings,
				discardsettings : this.onDiscardSettings,
				scope : this
			});
		}

		this.on('afterlayout', this.onAfterFirstLayout, this, { single : true });
	},

	/**
	 * Event handler fired when this component is being {@link #doLayout layed out} for the
	 * first time. This will activate the first registered category.
	 * @private
	 */
	onAfterFirstLayout : function()
	{
		var item = this.get(0);

		this.context.setView(item.id);
	},

	/**
	 * Event handler for the {@link Zarafa.settings.SettingsContext#viewchange} event on
	 * the {@link Zarafa.settings.SettingsContext context}. This will
	 * {@link Ext.layout.CardLayout#setActiveItem activate} the view} in the panel.
	 * @param {Zarafa.settings.SettingsContext} context The context which fired the event
	 * @param {Mixed} viewId The view id which should be activated
	 * @param {Mixed} oldViewId the old view which was previously activated
	 * @private
	 */
	onViewChange : function(context, viewId, oldViewId)
	{
		var layout = this.getLayout();

		layout.setActiveItem(viewId);
		layout.activeItem.doLayout();
		layout.activeItem.update(context.getModel().getEditableSettingsModel());
	},

	/**
	 * Event handler for the {@Link Zarafa.settings.SettingsContext#viewmodechange} event on
	 * the {@link Zarafa.settings.SettingsContext context}. This will {@link Ext.Element#scrollChildIntoView scroll}
	 * the corresponding {@link Zarafa.settings.ui.SettingsWidget} into the current view.
	 * @param {Zarafa.settings.SettingsContext} context The context which fired the event
	 * @param {Mixed} viewMod The viewMode which should be activated
	 * @param {Mixed} oldViewId The old viewMode
	 * @private
	 */
	onViewModeChange : function(context, viewMode, oldViewMode)
	{
		var activeItem = this.getLayout().activeItem;
		if (activeItem) {
			var widget = activeItem.get(viewMode);

			if (widget) {
				activeItem.el.scrollChildIntoView(widget.el);
			}
		}
	},

	/**
	 * Event handler for the {@link Zarafa.settings.SettingsContextModel#beforesavesettings}
	 * event on the {@link Zarafa.settings.SettingsContextModel}. This will call
	 * {@link Zarafa.settings.ui.SettingsCategory#updateSettings} to update the settings
	 * from the {@link Zarafa.settings.ui.SettingsCategory category} into the
	 * {@link Zarafa.settings.ui.SettingsModel model} so the latest settings can be saved.
	 * @param {Zarafa.settings.SettingsContextModel} model The context model which fired the event
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings model which will be saved
	 * @private
	 */
	onBeforeSaveSettings : function(model, settingsModel)
	{
		var layout = this.getLayout();

		layout.activeItem.updateSettings(settingsModel);
	},

	/**
	 * Event handler for the {@link Zarafa.settings.SettingsContextModel#savesettings}
	 * event on the {@link Zarafa.settings.SettingsContextModel}. This will call
	 * {@link Zarafa.settings.ui.SettingsCategory#update} to load the new settings
	 * into the {@link Zarafa.settings.ui.SettingsCategory category}.
	 * @param {Zarafa.settings.SettingsContextModel} model The context model which fired the event
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings model which has been saved
	 * @private
	 */
	onSaveSettings : function(model, settingsModel)
	{
		var layout = this.getLayout();

		layout.activeItem.update(settingsModel);
	},

	/**
	 * Event handler for the {@link Zarafa.settings.SettingsContextModel#discardsettings}
	 * event on the {@link Zarafa.settings.SettingsContextModel}. This will call
	 * {@link Zarafa.settings.ui.SettingsCategory#update} to load the reverted settings
	 * into the {@link Zarafa.settings.ui.SettingsCategory category}.
	 * @param {Zarafa.settings.SettingsContextModel} model The context model which fired the event
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings model which has been reverted
	 * @private
	 */
	onDiscardSettings : function(model, settingsModel)
	{
		var layout = this.getLayout();

		layout.activeItem.update(settingsModel);
	}
});

Ext.reg('zarafa.settingscategorywidgetpanel', Zarafa.settings.ui.SettingsCategoryWidgetPanel);
