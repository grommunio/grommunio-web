Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsCategoryPanel
 * @extends Ext.Container
 * @xtype zarafa.settingscategorypanel
 *
 * The extra container which displays the {@link Zarafa.settings.ui.SettingsCategoryTab tabs}
 * for the various registered {@link Zarafa.settings.ui.SettingsCategory categories}.
 */
Zarafa.settings.ui.SettingsCategoryPanel = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Zarafa.settings.SettingsContext} context The context which
	 * is using this tab panel
	 */
	context : undefined,

	/**
	 * The currently marked {@link Zarafa.settings.ui.SettingsCategoryTab#setActive active}
	 * {@link Zarafa.settings.ui.SettingsCategoryTab tab}. This is updated during {@link #onViewChange}
	 * @property
	 * @type Zarafa.settings.ui.SettingsCategoryTab
	 */
	activeTab : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls:'zarafa-settings-category-panel'
		});

		Zarafa.settings.ui.SettingsCategoryPanel.superclass.constructor.call(this, config);

		if (this.context) {
			this.mon(this.context, 'viewchange', this.onViewChange, this);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.settings.SettingsContext#viewchange} event on
	 * the {@link Zarafa.settings.SettingsContext context}. This will mark the new
	 * {@link Zarafa.settings.ui.SettingsCategoryTab tab} as
	 * {@link Zarafa.settings.ui.SettingsCategoryTab#setActive}.
	 * @param {Zarafa.settings.SettingsContext} context The context which fired the event
	 * @param {Mixed} viewId The view id which should be activated
	 * @param {Mixed} oldViewId the old view which was previously activated
	 * @private
	 */
	onViewChange : function(context, viewId, oldViewId)
	{
		// The viewId is the ID which matches the Zarafa.settings.ui.SettingsCategory
		// as loaded in the Zarafa.settings.ui.SettingsCategoryWidgetPanel. Search
		// through all tabs to find the tab which corresponds with it.
		var item = this.findBy(function(tab) {
			return tab.isTabForId(viewId);
		});

		if (this.activeTab) {
			this.activeTab.setActive(false);
			delete this.activeTab;
		}
		if (!Ext.isEmpty(item)) {
			this.activeTab = item[0];
			this.activeTab.setActive(true);
		}
	}
});

Ext.reg('zarafa.settingscategorypanel', Zarafa.settings.ui.SettingsCategoryPanel);
