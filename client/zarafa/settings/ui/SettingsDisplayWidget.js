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
	settingsModel : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.settingsdisplaywidget',
			title : _('Display'),
			layout : 'form',
			items : [{
				xtype : 'displayfield',
				hideLabel : true,
				value : _('I want to display date and time in this format:')
			},{
				xtype : 'radiogroup',
				name : 'zarafa/v1/main/datetime_display_format',
				ref : 'datetimeDisplayFormat',
				hideLabel : true,
				columns : 1,
				items : [{
					xtype : 'radio',
					inputValue : 'short',
					name: 'datetimeDisplayFormat',
					boxLabel : _('Short') + '<span class="k-settings-label-minor">(' + new Date().format(_('D G:i')) + ')</span>'
				},{
					xtype : 'radio',
					name: 'datetimeDisplayFormat',
					inputValue : 'long',
					boxLabel : _('Long') + '<span class="k-settings-label-minor">(' + new Date().format(_('l d/m/Y G:i')) + ')</span>'
				}],
				listeners : {
					change : this.onRadioChange,
					scope : this
				}
			},{
				xtype : 'displayfield',
				hideLabel : true,
				value : _('Favorite settings')
			},{
				xtype : 'checkbox',
				name : 'zarafa/v1/contexts/hierarchy/hide_favorites',
				ref : 'hideFavorites',
				boxLabel : _('Hide favorites'),
				hideLabel : true,
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			},{
				xtype : 'checkbox',
				name: 'zarafa/v1/contexts/hierarchy/scroll_favorites',
				ref : 'scrollFavorites',
				boxLabel : _('Unpin favorites from top'),
				hideLabel : true,
				listeners : {
					change : this.onFieldChange,
					scope : this
				}	
			}]
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
	update : function (settingsModel)
	{
		this.model = settingsModel;
		this.datetimeDisplayFormat.setValue(settingsModel.get(this.datetimeDisplayFormat.name));
		this.hideFavorites.setValue(settingsModel.get(this.hideFavorites.name));
		this.scrollFavorites.setValue(settingsModel.get(this.scrollFavorites.name));
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function (settingsModel)
	{
		var datetimeDisplayFormat = this.datetimeDisplayFormat.getValue().inputValue;

		settingsModel.set(this.datetimeDisplayFormat.name, datetimeDisplayFormat);
		settingsModel.set(this.hideFavorites.name, this.hideFavorites.getValue());
		settingsModel.set(this.scrollFavorites.name, this.scrollFavorites.getValue());
		if (this.hideFavorites.getValue() === true) {
			Ext.getBody().addClass('hideFavorites');
		} else {
			Ext.getBody().removeClass('hideFavorites');
		}

		if (this.scrollFavorites.getValue() === true) {
			Ext.getBody().addClass('scrollFavorites');
		} else {
			Ext.getBody().removeClass('scrollFavorites');
		}
	},

	/**
	 * Event handler which is fired when the value of the datetime format radio button has been changed.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {Ext.form.Radio} radio The radio which was enabled
	 * @private
	 */
	onRadioChange : function (field, radio)
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
	 * Event handler which is called when one of the textfields has been changed.
	 * This will apply the new value to the settings.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {String} value The new value
	 * @private
	 */
	onFieldChange : function(field, cb)
	{
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== cb.checked) {
				this.model.set(field.name, cb.checked);
			}
		}
	}

});

Ext.reg('zarafa.settingsdisplaywidget', Zarafa.settings.ui.SettingsDisplayWidget);
