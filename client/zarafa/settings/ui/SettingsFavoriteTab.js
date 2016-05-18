Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsFavoriteTab
 * @extends Ext.Container
 * @xtype zarafa.settingsfavoritetab
 *
 * Special favorite option to be rendered into the
 * {@link Zarafa.settings.ui.SettingsFavoritePanel SettingsFavoritePanel}
 */
Zarafa.settings.ui.SettingsFavoriteTab = Ext.extend(Ext.Container, {
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
	favoriteIndex : 100,

	/**
	 * @cfg {Zarafa.settings.ui.SettingsCategory} category The category
	 * to which this tab has been connected to. When this tab is clicked
	 * that category will be activated through
	 * {@link Zarafa.settings.SettingsContext#setView}
	 */
	category : undefined,

	/**
	 * @cfg {Zarafa.settings.ui.SettingsWidget} widget The widget inside the
	 * {@link #category} which this favorite option refers to. When this tab
	 * is clicked this widget will be slited into
	 * {@link Zarafa.settings.SettingsContext#setViewMode}
	 */
	widget : undefined,

	/**
	 * @cfg {String} iconCls The CSS classname which should be
	 * applied to the favorite tab to display an icon next to the {@link #title}.
	 */
	iconCls : 'zarafa-settings-favorite-tab-icon',

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls : 'zarafa-settings-favorite-tab',
			html : config.title || this.title
		});

		Zarafa.settings.ui.SettingsFavoriteTab.superclass.constructor.call(this, config);
	},

	/**
	 * Called when the Tab is being rendered, this will apply the {@link Ext.Element#addClassOnClick},
	 * {@link Ext.Element#addClassOnFocus} and {@link Ext.Element#addClassOnOver} for the {@link #el mail element}.
	 * @private
	 */
	onRender : function()
	{
		Zarafa.settings.ui.SettingsFavoriteTab.superclass.onRender.apply(this, arguments);

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
	 * Event handler which is fired when the favorite is being clicked,
	 * this will call the {@link #handler} function.
	 * @private
	 */
	onClick : function()
	{
		if (this.context && this.category && this.widget) {
			this.context.setView(this.category.id);
			this.context.setViewMode(this.widget.id);
		}
	}
});

Ext.reg('zarafa.settingsfavoritetab', Zarafa.settings.ui.SettingsFavoriteTab);
