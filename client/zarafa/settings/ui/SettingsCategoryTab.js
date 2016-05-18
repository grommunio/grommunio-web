Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsCategoryTab
 * @extends Ext.Container
 * @xtype zarafa.settingscategorytab
 *
 * Special category option to be rendered into the
 * {@link Zarafa.settings.ui.SettingsCategoryPanel SettingsCategoryPanel}
 */
Zarafa.settings.ui.SettingsCategoryTab = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Zarafa.settings.SettingsContext} context The settings context
	 * for which these tabs are shown.
	 */
	context : undefined,

	/**
	 * @cfg {String} title The title of the category, this string
	 * will be displayed in the left panel of the
	 * {@link Zarafa.settings.ui.SettingsMainPanel}.
	 */
	title : '',

	/**
	 * @cfg {Number} categoryIndex The index of the category
	 * in the {@link Zarafa.settings.ui.SettingsCategoryPanel category list}
	 */
	categoryIndex : 100,

	/**
	 * @cfg {Zarafa.settings.ui.SettingsCategory} category The category
	 * to which this tab has been connected to. When this tab is clicked
	 * that category will be activated through
	 * {@link Zarafa.settings.SettingsContext#setView}
	 */
	category : undefined,

	/**
	 * @cfg {String} iconCls The CSS classname which should be
	 * applied to the tab to display an icon next to the {@link #title}.
	 */
	iconCls : 'zarafa-settings-category-tab-icon',

	/**
	 * @cfg {String} activeCls The CSS classname which should be
	 * applied to the tab when it has been marked {@link #setActive active}.
	 */
	activeCls : 'zarafa-settings-category-tab-active',

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls : 'zarafa-settings-category-tab',
			html : config.title || this.title
		});

		Zarafa.settings.ui.SettingsCategoryTab.superclass.constructor.call(this, config);
	},

	/**
	 * Check if the given {@link Ext.Component#id} matches the id of the
	 * {@link #category} which is linked to this tab.
	 * @param {String} id The ID to check
	 * @return {Boolean} True if the given ID is handled by this tab
	 */
	isTabForId : function(id)
	{
		return (this.category && this.category.getId() === id);
	},

	/**
	 * Activate the tab by applying the {@link #activeCls} to the {@link #getEl element}
	 * @param {Boolean} active False to deactivate the tab
	 */
	setActive : function(active)
	{
		if (active !== false) {
			this.getEl().addClass(this.activeCls);
		} else {
			this.getEl().removeClass(this.activeCls);
		}
	},

	/**
	 * Called when the Tab is being rendered, this will apply the {@link Ext.Element#addClassOnClick},
	 * {@link Ext.Element#addClassOnFocus} and {@link Ext.Element#addClassOnOver} for the {@link #el mail element}.
	 * @private
	 */
	onRender : function()
	{
		Zarafa.settings.ui.SettingsCategoryTab.superclass.onRender.apply(this, arguments);

		var el = this.getEl();

		if (!Ext.isEmpty(this.iconCls)) {
			el.addClass(this.iconCls);
		}
		if (!Ext.isEmpty(this.cls)) {
			el.addClassOnClick(this.cls + '-click');
			el.addClassOnFocus(this.cls + '-focus');
			el.addClassOnOver(this.cls + '-over');
		}

		this.mon(el, 'click', this.onClick, this);
	},

	/**
	 * Event handler which is fired when the tab is being clicked,
	 * this will call the {@link #handler} function.
	 * @private
	 */
	onClick : function()
	{
		if (this.context && this.category) {
			this.context.setView(this.category.id);
		}
	}
});

Ext.reg('zarafa.settingscategorytab', Zarafa.settings.ui.SettingsCategoryTab);
