/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsCategoryWidgetPanel
 * @extends Ext.Container
 * @xtype grommunio.settingscategorywidgetpanel
 *
 * The main container in which the {@link Grommunio.settings.ui.SettingsCategory categories}
 * will display all their settings. This panel has a {@link Ext.layout.CardLayout} to
 * ensure only a single category will be shown at the same time.
 */
Grommunio.settings.ui.SettingsCategoryWidgetPanel = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Grommunio.settings.SettingsContext} context The context which
	 * is using this widget panel
	 */
	context: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			layout: 'card',
			cls: 'grommunio-settings-category-widget-panel'
		});

		Grommunio.settings.ui.SettingsCategoryWidgetPanel.superclass.constructor.call(this, config);

		if (this.context) {
			var model = this.context.getModel();

			this.mon(this.context, {
				viewchange: this.onViewChange,
				viewmodechange: this.onViewModeChange,
				scope: this
			});

			this.mon(model, {
				beforesavesettings: this.onBeforeSaveSettings,
				savesettings: this.onSaveSettings,
				discardsettings: this.onDiscardSettings,
				scope: this
			});
		}

		this.on('afterlayout', this.onAfterFirstLayout, this, { single: true });
		this.mon(container.getTabPanel(), 'beforetabchange', this.onTabChangeHandler, this);
	},

	/**
	 * Event handler fired when this component is being {@link #doLayout laid out} for the
	 * first time. This will activate the first registered category.
	 * @private
	 */
	onAfterFirstLayout: function()
	{
		var item = this.get(this.getActiveTab());

		// scroll the scroll bar to signature tab.
		if (Ext.isDefined(this.context.scrollToSignatureWidget)) {
			item.scrollToSignatureWidget = this.context.scrollToSignatureWidget;
			delete this.context.scrollToSignatureWidget;
		}

		this.context.setView(item.id);
	},

	/**
	 * Helper function which used to get the index of {@link Grommunio.settings.ui.SettingsCategoryTab activeTab}.
	 *
	 * @returns {Number} return the index of active tab.
	 */
	getActiveTab: function()
	{
		var activeTab = 0;
		if (Ext.isDefined(this.context.defaultActiveTab)) {
			activeTab = this.context.defaultActiveTab;
			delete this.context.defaultActiveTab;
		}
		return activeTab;
	},

	/**
	 * Event handler triggers when content tab panel is changed,
	 * It will internally call {@link #onAfterFirstLayout} function.
	 * Which select the {@link Grommunio.mail.settings.SettingsMailCategory SettingsMailCategory}
	 * and set the focus on {@link Grommunio.mail.settings.SettingsSignaturesWidget SettingsSignaturesWidget}
	 */
	onTabChangeHandler: function()
	{
		if (Ext.isDefined(this.context.defaultActiveTab) && Ext.isDefined(this.context.scrollToSignatureWidget)){
			this.onAfterFirstLayout();
		}
	},

	/**
	 * Event handler for the {@link Grommunio.settings.SettingsContext#viewchange} event on
	 * the {@link Grommunio.settings.SettingsContext context}. This will
	 * {@link Ext.layout.CardLayout#setActiveItem activate} the view} in the panel.
	 * @param {Grommunio.settings.SettingsContext} context The context which fired the event
	 * @param {Mixed} viewId The view id which should be activated
	 * @param {Mixed} oldViewId the old view which was previously activated
	 * @private
	 */
	onViewChange: function(context, viewId, oldViewId)
	{
		var layout = this.getLayout();

		layout.setActiveItem(viewId);
		layout.activeItem.doLayout();
		layout.activeItem.update(context.getModel().getEditableSettingsModel());
	},

	/**
	 * Event handler for the {@Link Grommunio.settings.SettingsContext#viewmodechange} event on
	 * the {@link Grommunio.settings.SettingsContext context}. This will {@link Ext.Element#scrollChildIntoView scroll}
	 * the corresponding {@link Grommunio.settings.ui.SettingsWidget} into the current view.
	 * @param {Grommunio.settings.SettingsContext} context The context which fired the event
	 * @param {Mixed} viewMod The viewMode which should be activated
	 * @param {Mixed} oldViewId The old viewMode
	 * @private
	 */
	onViewModeChange: function(context, viewMode, oldViewMode)
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
	 * Event handler for the {@link Grommunio.settings.SettingsContextModel#beforesavesettings}
	 * event on the {@link Grommunio.settings.SettingsContextModel}. This will call
	 * {@link Grommunio.settings.ui.SettingsCategory#updateSettings} to update the settings
	 * from the {@link Grommunio.settings.ui.SettingsCategory category} into the
	 * {@link Grommunio.settings.ui.SettingsModel model} so the latest settings can be saved.
	 * @param {Grommunio.settings.SettingsContextModel} model The context model which fired the event
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings model which will be saved
	 * @private
	 */
	onBeforeSaveSettings: function(model, settingsModel)
	{
		var layout = this.getLayout();

		layout.activeItem.updateSettings(settingsModel);
	},

	/**
	 * Event handler for the {@link Grommunio.settings.SettingsContextModel#savesettings}
	 * event on the {@link Grommunio.settings.SettingsContextModel}. This will call
	 * {@link Grommunio.settings.ui.SettingsCategory#update} to load the new settings
	 * into the {@link Grommunio.settings.ui.SettingsCategory category}.
	 * @param {Grommunio.settings.SettingsContextModel} model The context model which fired the event
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings model which has been saved
	 * @private
	 */
	onSaveSettings: function(model, settingsModel)
	{
		var layout = this.getLayout();

		layout.activeItem.update(settingsModel);
	},

	/**
	 * Event handler for the {@link Grommunio.settings.SettingsContextModel#discardsettings}
	 * event on the {@link Grommunio.settings.SettingsContextModel}. This will call
	 * {@link Grommunio.settings.ui.SettingsCategory#update} to load the reverted settings
	 * into the {@link Grommunio.settings.ui.SettingsCategory category}.
	 * @param {Grommunio.settings.SettingsContextModel} model The context model which fired the event
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings model which has been reverted
	 * @private
	 */
	onDiscardSettings: function(model, settingsModel)
	{
		var layout = this.getLayout();

		layout.activeItem.update(settingsModel);
	}
});

Ext.reg('grommunio.settingscategorywidgetpanel', Grommunio.settings.ui.SettingsCategoryWidgetPanel);
