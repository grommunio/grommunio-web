Ext.namespace('Zarafa.calendar.settings');

/**asd
 * @class Zarafa.calendar.settings.SettingsFreeBusyWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsfreebusywidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the Free/Busy permission for other users.
 */
Zarafa.calendar.settings.SettingsFreeBusyWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var message = _('Free/Busy information is used by people sending meeting requests, to determine when you are available for meetings.');

		Ext.applyIf(config, {
			title : _('Free/Busy publishing'),
			items : [{
				xtype : 'displayfield',
				hideLabel : true,
				value : message
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('Publish {A} month(s) of Calendar Free/Busy information on the server.'),
				items: [{
					xtype: 'numberfield',
					cls: 'k-centeredtext',
					width : 30,
					name : 'zarafa/v1/contexts/calendar/free_busy_range',
					labelSplitter: '{A}',
					ref : '../freeBusyMonth',
					minValue : 0,
					maxValue : 36,
					allowBlank: false,
					allowDecimals : false,
					allowNegative : false,
					listeners : {
						change : this.onFieldChange,
						scope : this
					}
				}]
			},{
				xtype : 'displayfield',
				hideLabel : true,
				value : _('You can only publish a Free/Busy period from 0 to 36 months. 0 means Free/Busy information is not published.')
			}]
		});

		Zarafa.calendar.settings.SettingsFreeBusyWidget.superclass.constructor.call(this, config);
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

		var months = settingsModel.get(this.freeBusyMonth.name);
		this.freeBusyMonth.setValue(months);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		var freeBusyMonth = this.freeBusyMonth.isValid() ? this.freeBusyMonth.getValue() : settingsModel.get(this.freeBusyMonth.name, false, true);

		settingsModel.beginEdit();
		settingsModel.set(this.freeBusyMonth.name, freeBusyMonth);
		settingsModel.endEdit();
	},

	/**
	 * Event handler which is called when a selection has been made in the
	 * {@link Ext.form.TextField textfield}.
	 * @param {Ext.form.textfield} field The field which fired the event
	 * @param {number} newValue The newValue is contains the updated months range.
	 * @param {number} oldValue The newValue is contains the old months range.
	 * @private
	 */
	onFieldChange : function(field, newValue, oldValue)
	{
		if (this.model) {

			if (this.model.get(field.name) !== newValue) {
				this.model.set(field.name, newValue);
			}
		}
	}
});

Ext.reg('zarafa.settingsfreebusywidget', Zarafa.calendar.settings.SettingsFreeBusyWidget);
