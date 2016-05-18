Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsOutOfOfficeCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingsoutofofficecategory
 *
 * The category for users which willallow the user to configure Out-of-Office related settings
 */
Zarafa.mail.settings.SettingsOutOfOfficeCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.outofoffice
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.mail.settings.SettingsOutOfOfficeCategory Out of Office Category}.
	 * @param {Zarafa.mail.settings.SettingsOutOfOfficeCategory} category The Out of Office
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
			title : _('Out of Office'),
			categoryIndex : 2,
			iconCls : 'zarafa-settings-category-oof',
			items : [{
				xtype : 'zarafa.settingsoofwidget'
			},
			container.populateInsertionPoint('context.settings.category.outofoffice', this)
			]
		});

		Zarafa.mail.settings.SettingsOutOfOfficeCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingsoutofofficecategory', Zarafa.mail.settings.SettingsOutOfOfficeCategory);
