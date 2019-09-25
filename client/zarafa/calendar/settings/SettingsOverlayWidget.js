Ext.namespace('Zarafa.calendar.settings');

/**
 * @class Zarafa.calendar.settings.SettingsOverlayWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsoverlaywidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the calendar overlay behavior in the {@link Zarafa.calendar.settings.SettingsCalendarCategory calendar category}.
 */
Zarafa.calendar.settings.SettingsOverlayWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var overlayStore = {
			xtype : 'jsonstore',
			fields : [ 'name', 'value' ],
			data : [{
				name : _('Side-by-side mode'),
				value : 'separate'
			},{
				name : _('Overlay mode'),
				value : 'merge'
			}]
		};

		Ext.applyIf(config, {
			title : _('Calendar view settings'),
			layout : 'form',
			items : [{
				xtype : 'combo',
				ref : 'overlayCombo',
				fieldLabel : _('View multiple calendars in'),
				name : 'zarafa/v1/contexts/calendar/default_merge_state',
				store : overlayStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'name',
				valueField: 'value',
				lazyInit: false,
				autoSelect : true,
				forceSelection: true,
				editable: false,
				listeners : {
					select : this.onOpenMethodSelect,
					scope : this
				}
			}]
		});

		Zarafa.calendar.settings.SettingsCalendarWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.model = settingsModel;

		var overlay = settingsModel.get(this.overlayCombo.name);
		this.overlayCombo.setValue(overlay ? 'merge' : 'separate');
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		settingsModel.set(this.overlayCombo.name, this.overlayCombo.getValue() === 'merge');
	},

	/**
	 * Event handler which is called when a selection has been made in the
	 * {@link Ext.form.ComboBox combobox}.
	 * @param {Ext.form.ComboBox} field The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 * @private
	 */
	onOpenMethodSelect : function(field, record)
	{
		if (this.model) {
			var set = record.get(field.valueField);

			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== set) {
				this.model.set(field.name, set === 'merge');
			}
		}
	}
});

Ext.reg('zarafa.settingsoverlaywidget', Zarafa.calendar.settings.SettingsOverlayWidget);
