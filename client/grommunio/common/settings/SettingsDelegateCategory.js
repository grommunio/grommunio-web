Ext.namespace('Grommunio.common.settings');

/**
 * @class Grommunio.common.settings.SettingsDelegateCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingsdelegatecategory
 *
 * The delegates category for users which will allow the user to configure delegation settings.
 */
Grommunio.common.settings.SettingsDelegateCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.delegate
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.common.settings.SettingsDelegateCategory Delegate Category}.
	 * @param {Grommunio.common.settings.SettingsDelegateCategory} category The delegate
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Delegates'),
			categoryIndex: 5,
			xtype: 'grommunio.settingsdelegatecategory',
			iconCls: 'grommunio-settings-category-delegate',
			items: [{
					xtype: 'grommunio.settingsdelegatewidget',
					settingsContext: config.settingsContext
				},
				container.populateInsertionPoint('context.settings.category.delegate', this)
			]
		});

		Grommunio.common.settings.SettingsDelegateCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Called by superclass when the Category has been deselected and is hidden from the user,
	 * this will unregister the {@link #onBeforeSaveRules} event handler.
	 * @private
	 */
	onHide: function()
	{
		Grommunio.common.settings.SettingsDelegateCategory.superclass.onHide.apply(this, arguments);

		// Unregister the 'beforesave' event. This could be lingering when
		// 'savesettings' was fired but it was cancelled by one of the
		// event handlers.
		var store = this.get(0).getDelegateStore();
		this.mun(store, 'beforesave', this.onBeforeSaveDelegate, this);
	},

	/**
	 * Event handler for the
	 * {@link Grommunio.settings.SettingsContextModel ContextModel}#{@link Grommunio.settings.SettingsContextModel#beforesavesettings beforesavesettings}
	 * event. It will reset the {@link #savingElCounter} and his will register the event handler for
	 * {@link Grommunio.settings.SettingsModel#beforesave beforesave} event.
	 * @private
	 */
	onBeforeSaveSettingsModel: function()
	{
		Grommunio.common.settings.SettingsDelegateCategory.superclass.onBeforeSaveSettingsModel.apply(this, arguments);

		var store = this.get(0).getDelegateStore();
		this.mon(store, 'beforesave', this.onBeforeSaveDelegate, this, { single: true });
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.common.delegates.data.DelegateStore Delegate Store}
	 * fires the 'beforesave' event. This will {@link #displaySavingMask show a notification} and register the
	 * event handlers for the completion of the save.
	 * @private
	 */
	onBeforeSaveDelegate: function()
	{
		this.displaySavingMask();

		var store = this.get(0).getDelegateStore();
		this.mon(store, 'save', this.onDelegateSave, this);
		this.mon(store, 'exception', this.onDelegateException, this);
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.common.delegates.data.DelegateStore Delegate Store}
	 * fires the 'save' event indicating the successful save of the delegates. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onDelegateSave: function()
	{
		this.hideSavingMask(true);

		var store = this.get(0).getDelegateStore();
		this.mun(store, 'save', this.onDelegateSave, this);
		this.mun(store, 'exception', this.onDelegateException, this);
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.common.delegates.data.DelegateStore Delegate Store}
	 * fires the 'exception' event indicating a failing save of the delegates. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onDelegateException: function()
	{
		this.hideSavingMask(false);

		var store = this.get(0).getDelegateStore();
		this.mun(store, 'save', this.onDelegateSave, this);
		this.mun(store, 'exception', this.onDelegateException, this);
	}
});

Ext.reg('grommunio.settingsdelegatecategory', Grommunio.common.settings.SettingsDelegateCategory);
