Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsDisplayWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsdisplaywidget
 *
 * The Webapp Display settings widget. Gives the option to show dates in long or short format.
 */
Zarafa.settings.ui.SettingsDisplayWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @cfg {Zarafa.settings.SettingsModel} settingsModel The settingsModel on which
	 * to work with the settings.
	 */
	settingsModel: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.settingsdisplaywidget',
			title: _('Display'),
			layout: 'form',
			items: [{
				xtype: 'displayfield',
				hideLabel: true,
				value: _('I want to display date and time in this format:')
			},{
				xtype: 'radiogroup',
				name: 'zarafa/v1/main/datetime_display_format',
				ref: 'datetimeDisplayFormat',
				hideLabel: true,
				columns: 1,
				items: [{
					xtype: 'radio',
					inputValue: 'short',
					name: 'datetimeDisplayFormat',
					boxLabel: _('Short') + '<span class="k-settings-label-minor">(' + new Date().formatDefaultTime(_('D {0}')) + ')</span>'
				},{
					xtype: 'radio',
					name: 'datetimeDisplayFormat',
					inputValue: 'long',
					boxLabel: _('Long') + '<span class="k-settings-label-minor">(' + new Date().formatDefaultTime(_('l d/m/Y {0}')) + ')</span>'
				}],
				listeners: {
					change: this.onRadioChange,
					scope: this
				}
			},{
				xtype: 'displayfield',
				hideLabel: true,
				value: _('Time format:')
			},{
				xtype: 'radiogroup',
				name: 'zarafa/v1/main/datetime_time_format',
				ref: 'datetimeTimeformat',
				hideLabel: true,
				width: 200,
				columns: 2,
				items: [{
					xtype: 'radio',
					inputValue: Zarafa.common.data.TimeFormat.TWELVEHOUR,
					name: 'datetimeTimeformat',
					boxLabel: _('12h clock')
				},{
					xtype: 'radio',
					inputValue: Zarafa.common.data.TimeFormat.TWENTYFOURHOUR,
					name: 'datetimeTimeformat',
					boxLabel: _('24h clock'),
					checked: true
				}],
				listeners: {
					change: this.onRadioChangeTimeFormat,
					scope: this
				}
			},{
				xtype: 'displayfield',
				hideLabel: true,
				value: _('Favorite settings')
			},{
				xtype: 'checkbox',
				name: 'zarafa/v1/contexts/hierarchy/hide_favorites',
				ref: 'hideFavorites',
				boxLabel: _('Hide favorites'),
				hideLabel: true,
				listeners: {
					change: this.onFieldChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				name: 'zarafa/v1/contexts/hierarchy/scroll_favorites',
				ref: 'scrollFavorites',
				boxLabel: _('Unpin favorites from top'),
				hideLabel: true,
				listeners: {
					change: this.onFieldChange,
					scope: this
				}
			},{
				xtype: 'displayfield',
				hideLabel: true,
				value: _('Other')
			},{
				xtype: 'checkbox',
				name: 'zarafa/v1/main/unread_borders',
				ref: 'unreadBorders',
				boxLabel: _('Give unread items a colored border'),
				hideLabel: true,
				listeners: {
					change: this.onFieldChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				name: 'zarafa/v1/main/help_manual/show',
				ref: 'helpManual',
				hideLabel: true,
				requiresReload: true,
				appliedPluginSetting: false,
				pluginSettingPath: 'zarafa/v1/plugins/webappmanual/enable',
				boxLabel: _('Show \'help\' button in top-right corner'),
				listeners: {
					change: this.onFieldChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				name: 'zarafa/v1/main/title_counter/show',
				ref: 'titleCounter',
				hideLabel: true,
				requiresReload: true,
				appliedPluginSetting: false,
				pluginSettingPath: 'zarafa/v1/plugins/titlecounter/enable',
				boxLabel: _('Show unread mail counter in application title'),
				listeners: {
					change: this.onFieldChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				name: 'zarafa/v1/widgets/sidebar/hide_widgetpanel',
				ref: 'hideWidgetpanel',
				hideLabel: true,
				hidden: !container.getServerConfig().isWidgetEnabled(),
				requiresReload: true,
				boxLabel: _('Hide widget panel'),
				listeners: {
					change: this.onFieldChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				name: 'zarafa/v1/contexts/hierarchy/show_searchbar',
				ref: 'showSearchBar',
				requiresReload: true,
				hideLabel: true,
				boxLabel: _('Show search bar above folder list'),
				listeners: {
					change: this.onFieldChange,
					scope: this
				}
			},

			// Insertion point at the end of the display widget
			container.populateInsertionPoint('settings.display.last')]
		});

		Zarafa.settings.ui.SettingsDisplayWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update: function (settingsModel)
	{
		this.model = settingsModel;
		this.datetimeDisplayFormat.setValue(settingsModel.get(this.datetimeDisplayFormat.name));
		this.datetimeTimeformat.setValue(settingsModel.get(this.datetimeTimeformat.name));
		this.hideFavorites.setValue(settingsModel.get(this.hideFavorites.name));
		this.scrollFavorites.setValue(settingsModel.get(this.scrollFavorites.name));
		this.unreadBorders.setValue(settingsModel.get(this.unreadBorders.name));
		this.hideWidgetpanel.setValue(settingsModel.get(this.hideWidgetpanel.name));
		this.showSearchBar.setValue(settingsModel.get(this.showSearchBar.name));

		// Check if help manual plugin's settings available else check main settings.
		var helpManualPluginSetting = settingsModel.get(this.helpManual.pluginSettingPath);
		this.helpManual.appliedPluginSetting = Ext.isDefined(helpManualPluginSetting);
		this.helpManual.setValue(this.helpManual.appliedPluginSetting ? helpManualPluginSetting : settingsModel.get(this.helpManual.name));

		// Check if title counter plugin's settings available else check main settings.
		var titleCounterPluginSetting = settingsModel.get(this.titleCounter.pluginSettingPath);
		this.titleCounter.appliedPluginSetting = Ext.isDefined(titleCounterPluginSetting);
		this.titleCounter.setValue(this.titleCounter.appliedPluginSetting ? titleCounterPluginSetting : settingsModel.get(this.titleCounter.name));
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function (settingsModel)
	{
		var datetimeDisplayFormat = this.datetimeDisplayFormat.getValue().inputValue;
		var datetimeTimeFormat = settingsModel.get(this.datetimeTimeformat.name);
		settingsModel.set(this.datetimeDisplayFormat.name, datetimeDisplayFormat);
		settingsModel.set(this.datetimeTimeformat.name, datetimeTimeFormat);
		settingsModel.set(this.hideFavorites.name, this.hideFavorites.getValue());
		settingsModel.set(this.scrollFavorites.name, this.scrollFavorites.getValue());
		settingsModel.set(this.unreadBorders.name, this.unreadBorders.getValue());
		settingsModel.set(this.hideWidgetpanel.name, this.hideWidgetpanel.getValue());
		settingsModel.set(this.showSearchBar.name, this.showSearchBar.getValue());

		// Remove webapp manual plugin settings.
		if (this.helpManual.appliedPluginSetting) {
			settingsModel.remove('zarafa/v1/plugins/webappmanual', {type: 'deprecated'});
		}
		settingsModel.set(this.helpManual.name, this.helpManual.getValue());

		// Remove title counter plugin settings.
		if (this.titleCounter.appliedPluginSetting) {
			settingsModel.remove('zarafa/v1/plugins/titlecounter', {type: 'deprecated'});
		}
		settingsModel.set(this.titleCounter.name, this.titleCounter.getValue());

		// Hide favorites
		if (this.hideFavorites.getValue() === true) {
			Ext.getBody().addClass('hideFavorites');
		} else {
			Ext.getBody().removeClass('hideFavorites');
		}

		// Scroll favorites
		if (this.scrollFavorites.getValue() === true) {
			Ext.getBody().addClass('scrollFavorites');
		} else {
			Ext.getBody().removeClass('scrollFavorites');
		}

		// Unread borders
		if (this.unreadBorders.getValue() === true) {
			Ext.getBody().addClass('k-unreadborders');
		} else {
			Ext.getBody().removeClass('k-unreadborders');
		}
	},

	/**
	 * Event handler which is fired when the value of the datetime format radio button has been changed.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {Ext.form.Radio} radio The radio which was enabled
	 * @private
	 */
	onRadioChange: function (field, radio)
	{
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== radio.inputValue) {
				this.model.set(field.name, radio.inputValue);
			}
		}
	},

	/**
	 * Event handler which is fired when the value of the datetime time format radio button has been changed.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {Ext.form.Radio} radio The radio which was enabled
	 */
	onRadioChangeTimeFormat: function(field, radio)
	{
		if (this.model) {
			var timeFormatString = container.settingsModel.get('zarafa/v1/main/datetime_time_format');
			if (timeFormatString !== radio.inputValue) {
				if (radio.inputValue === 'G:i') {
					this.model.set(this.datetimeTimeformat.name, Zarafa.common.data.TimeFormat.TWENTYFOURHOUR);
				} else {
					this.model.set(this.datetimeTimeformat.name, Zarafa.common.data.TimeFormat.TWELVEHOUR);
				}
			}
		}
	},

	/**
	 * Event handler which is called when one of the textfields has been changed.
	 * This will apply the new value to the settings.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {String} value The new value
	 * @private
	 */
	onFieldChange: function(field, value)
	{
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			var property = field.appliedPluginSetting === true && Ext.isDefined(field['pluginSettingPath']) ? 'pluginSettingPath' : 'name';
			if (this.model.get(field[property]) !== value) {
				this.model.set(field[property], value);

				// Reload only when this config has been set in the field component.
				if (Ext.isDefined(field.requiresReload) && field.requiresReload) {
					this.model.requiresReload = true;
				}
			}
		}
	}
});

Ext.reg('zarafa.settingsdisplaywidget', Zarafa.settings.ui.SettingsDisplayWidget);
