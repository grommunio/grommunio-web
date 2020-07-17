Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsAdvancedCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingsadvancedcategory
 *
 * The default available category for users which will
 * load the {@link Zarafa.settings.ui.SettingsTreePanel Settings Tree}
 * to display all available settings which are available for the user.
 */
Zarafa.settings.ui.SettingsAdvancedCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Advanced'),
			categoryIndex : 9999,
			iconCls : 'zarafa-settings-category-advanced',
			layout : 'fit',
			// scrolling is supplied by the treepanel
			autoScroll: false,
			defaults: {
				margins : "0 0 5 0"
			},
			items : [{
				xtype:'container',
				layout: {
					type: 'border',
				},
				items : [{
					xtype : 'zarafa.settingswidget',
					title : _('Advanced settings'),
					layout:'fit',
					region:'center',
					items : [{
						xtype : 'zarafa.settingstreepanel',
						ref : '../../treePanel'
					}]
				}, {
					xtype : 'zarafa.settingswidget',
					title : _('Developer tools'),
					height:80,
					region : 'north',
					items:[{
						xtype: 'checkbox',
						name : 'zarafa/v1/main/kdeveloper_tool/kdeveloper',
						boxLabel : _('Show insertion points in WebApp'),
						ref : '../../showInsertionCheck',
						hideLabel : true,
						listeners : {
							change : this.onFieldChange,
							scope : this
						}
					}]
				}]
			}]
		});

		Zarafa.settings.ui.SettingsAdvancedCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.model = settingsModel;
		Zarafa.settings.ui.SettingsAdvancedCategory.superclass.update.apply(this, arguments);

		this.treePanel.bindModel(settingsModel);

		this.showInsertionCheck.setValue(settingsModel.get(this.showInsertionCheck.name));
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		Zarafa.settings.ui.SettingsAdvancedCategory.superclass.updateSettings.apply(this, arguments);

		settingsModel.set(this.showInsertionCheck.name, this.showInsertionCheck.getValue());
	},

	/**
	 * Event handler which is called when "Show insertion points in WebApp" has been checked/unchecked.
	 * This will apply the new value to the settings.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {String} checked The new value of check box.
	 * @private
	 */
	onFieldChange : function(field, checked)
	{
		if (this.model) {
			if (this.model.get(field.name) !== checked) {
				this.model.set(field.name, checked);
				this.model.requiresReload = true;
			}
		}
	}
});

Ext.reg('zarafa.settingsadvancedcategory', Zarafa.settings.ui.SettingsAdvancedCategory);
