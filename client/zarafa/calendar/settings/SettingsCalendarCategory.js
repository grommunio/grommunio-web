Ext.namespace('Zarafa.calendar.settings');

/**
 * @class Zarafa.calendar.settings.SettingsCalendarCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingscalendarcategory
 *
 * The calendar category for users which will
 * allow the user to configure Calendar related settings
 */
Zarafa.calendar.settings.SettingsCalendarCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.calendar
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.calendar.settings.SettingsCalendarCategory Calendar Category}.
	 * @param {Zarafa.calendar.settings.SettingsCalendarCategory} category The mail
	 * category to which the widgets will be added.
	 */
		
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Calendar'),
			categoryIndex : 4,
			iconCls : 'zarafa-settings-category-calendar',
			items : [{
				xtype : 'zarafa.settingscalendarwidget'
			},{
				xtype : 'zarafa.settingsfreebusywidget'
			},{
				xtype : 'zarafa.settingsoverlaywidget'
			},{
				xtype : 'zarafa.settingsreminderwidget'
			},
			container.populateInsertionPoint('context.settings.category.calendar', this)
			]
		});

		Zarafa.calendar.settings.SettingsCalendarCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingscalendarcategory', Zarafa.calendar.settings.SettingsCalendarCategory);
