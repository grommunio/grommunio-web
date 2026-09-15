Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsCategoryTab
 * @extends Ext.Container
 * @xtype grommunio.settingscategorytab
 *
 * Special category option to be rendered into the
 * {@link Grommunio.settings.ui.SettingsCategoryPanel SettingsCategoryPanel}
 */
Grommunio.settings.ui.SettingsCategoryTab = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Grommunio.settings.SettingsContext} context The settings context
	 * for which these tabs are shown.
	 */
	context: undefined,

	/**
	 * @cfg {String} title The title of the category, this string
	 * will be displayed in the left panel of the
	 * {@link Grommunio.settings.ui.SettingsMainPanel}.
	 */
	title: '',

	/**
	 * @cfg {Number} categoryIndex The index of the category
	 * in the {@link Grommunio.settings.ui.SettingsCategoryPanel category list}
	 */
	categoryIndex: 100,

	/**
	 * @cfg {Grommunio.settings.ui.SettingsCategory} category The category
	 * to which this tab has been connected to. When this tab is clicked
	 * that category will be activated through
	 * {@link Grommunio.settings.SettingsContext#setView}
	 */
	category: undefined,

	/**
	 * @cfg {String} iconCls The CSS classname which should be
	 * applied to the tab to display an icon next to the {@link #title}.
	 */
	iconCls: 'grommunio-settings-category-tab-icon',

	/**
	 * @cfg {String} activeCls The CSS classname which should be
	 * applied to the tab when it has been marked {@link #setActive active}.
	 */
	activeCls: 'grommunio-settings-category-tab-active',

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls: 'grommunio-settings-category-tab',
			html: config.title || this.title,
			listeners: {
				afterrender: this.onAfterRender,
				scope: this
			}
		});

		Grommunio.settings.ui.SettingsCategoryTab.superclass.constructor.call(this, config);
	},

	/**
	 * Check if the given {@link Ext.Component#id} matches the id of the
	 * {@link #category} which is linked to this tab.
	 * @param {String} id The ID to check
	 * @return {Boolean} True if the given ID is handled by this tab
	 */
	isTabForId: function(id)
	{
		return (this.category && this.category.getId() === id);
	},

	/**
	 * Activate the tab by applying the {@link #activeCls} to the {@link #getEl element}
	 * @param {Boolean} active False to deactivate the tab
	 */
	setActive: function(active)
	{
		if (active !== false) {
			this.getEl().addClass(this.activeCls);
			this.getEl().set({ 'aria-selected': 'true' });
		} else {
			this.getEl().removeClass(this.activeCls);
			this.getEl().set({ 'aria-selected': 'false' });
		}
	},

	/**
	 * Called when the Tab is being rendered, this will apply the {@link Ext.Element#addClassOnClick},
	 * {@link Ext.Element#addClassOnFocus} and {@link Ext.Element#addClassOnOver} for the {@link #el mail element}.
	 * @private
	 */
	onRender: function()
	{
		Grommunio.settings.ui.SettingsCategoryTab.superclass.onRender.apply(this, arguments);

		var el = this.getEl();

		if (!Ext.isEmpty(this.cls)) {
			el.addClassOnClick(this.cls + '-click');
			el.addClassOnFocus(this.cls + '-focus');
			el.addClassOnOver(this.cls + '-over');
		}

		el.set({
			'role': 'tab',
			'tabindex': '0'
		});
		this.mon(el, 'click', this.onClick, this);
		this.mon(el, 'keydown', function(e) {
			if (e.getKey() === e.ENTER || e.getKey() === e.SPACE) {
				e.stopEvent();
				this.onClick();
			}
		}, this);
	},

	/**
	 * Called after the Tab has been rendered, this will add the icon
	 * @private
	 */
	onAfterRender: function()
	{
		var el = this.getEl();

		if (!Ext.isEmpty(this.iconCls)) {
			el.addClass('k-with-icon');

			// Create an element for the icon
			el.createChild(
				{
					tag: 'img',
					cls: this.iconCls + ' k-settings-category-icon',
					src: Ext.BLANK_IMAGE_URL,
					'aria-hidden': 'true',
					alt: ''
				},
				Ext.fly(el.dom.firstChild)
			);
		}
	},

	/**
	 * Event handler which is fired when the tab is being clicked,
	 * this will call the {@link #handler} function.
	 * @private
	 */
	onClick: function()
	{
		if (this.context && this.category) {
			this.context.setView(this.category.id);
		}
	}
});

Ext.reg('grommunio.settingscategorytab', Grommunio.settings.ui.SettingsCategoryTab);
