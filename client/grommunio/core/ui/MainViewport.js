Ext.namespace('Grommunio.core.ui');

/**
 * @class Grommunio.core.ui.MainViewport
 * @extends Ext.Viewport
 * The main viewport for the application. It defines the basic switching context
 * containers (toolbar, main content panel)
 */
Grommunio.core.ui.MainViewport = Ext.extend(Ext.Viewport, {
	// Insertion points for this class
	/**
	 * @insert main.content
	 * Insertion point for the main panel content area.
	 */

	/**
	 * The {@link Grommunio.core.ui.NavigationPanel NavigationPanel}.
	 * @property
	 * @type Grommunio.core.ui.NavigationPanel
	 */
	navigationPanel: undefined,

	/**
	 * The {@link Grommunio.core.ui.widget.WidgetPanel WidgetPanel}
	 * @property
	 * @type Grommunio.core.ui.widget.WidgetPanel
	 */
	widgetPanel: undefined,

	/**
	 * The {@link Grommunio.core.ui.ContextContainer ContextContainer}
	 * @property
	 * @type Grommunio.core.ui.ContextContainer
	 */
	contentPanel: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};
		config = Ext.applyIf(config, {
			layout: 'fit',
			items: [{
				xtype: 'container',
				id: 'grommunio-mainview',
				layout: 'border',
				cls: 'grommunio-panel-body',
				border: false,
				items: [
					this.createTopbarContainer(),
					this.createNavigationPanel(),
					this.createTodayPanel(),
					this.createContentContainer()				]
			}]
		});

		// initialise the viewport with some pre-defined settings
		Grommunio.core.ui.MainViewport.superclass.constructor.call(this, config);

		// Add skip-to-content link for keyboard accessibility (WCAG 2.4.1)
		this.on('afterrender', function() {
			// Set landmark roles on rendered elements
			var mainView = Ext.getCmp('grommunio-mainview');
			if (mainView && mainView.getEl()) {
				mainView.getEl().set({ 'role': 'application', 'aria-label': _('grommunio Web') });
			}

			var skipLink = Ext.DomHelper.insertFirst(document.body, {
				tag: 'a',
				href: '#',
				cls: 'sr-only',
				html: _('Skip to main content'),
				style: 'z-index:99999;'
			}, true);
			skipLink.on('focus', function() {
				this.setStyle({
					position: 'fixed',
					top: '5px',
					left: '5px',
					width: 'auto',
					height: 'auto',
					clip: 'auto',
					'white-space': 'normal',
					overflow: 'visible',
					padding: '8px 16px',
					background: '#fff',
					color: '#1d2939',
					'font-size': '14px',
					'font-weight': '600',
					'border-radius': '4px',
					'box-shadow': '0 2px 8px rgba(0,0,0,0.2)',
					margin: '0'
				});
			});
			skipLink.on('blur', function() {
				this.setStyle({
					position: 'absolute',
					width: '1px',
					height: '1px',
					clip: 'rect(0,0,0,0)',
					'white-space': 'nowrap',
					overflow: 'hidden',
					padding: '0',
					margin: '-1px'
				});
			});
		}, this, { single: true });

		// Activate global key events.
		Grommunio.core.KeyMapMgr.activate(null, 'global', Ext.getBody());
		// Don't allow propagation of all other key events which are registered in KeyMapMgr.
		Grommunio.core.KeyMapMgr.activate(null, 'globaldisable', Ext.getBody());
	},

	/**
	 * Create the {@link Grommunio.core.ui.NavigationPanel NavigationPanel} for
	 * the west region of the client in which the treePanel can be shown.
	 * @return {Grommunio.core.ui.NavigationPanel} NavigationPanel.
	 * @private
	 */
	createNavigationPanel: function()
	{
		this.navigationPanel = new Grommunio.core.ui.NavigationPanel({
			region: 'west',
			stateful: true,
			statefulName: 'hierarchybar',
			statefulRelativeDimensions: true
		});
		this.navigationRail = new Grommunio.core.ui.NavigationRail({ panel: this.navigationPanel });
		return this.navigationPanel;
	},

	/**
	 * Returns the {@link Grommunio.core.ui.NavigationPanel NavigationPanel} for
	 * the west region of the client in which the treePanel can be shown.
	 * @return {Grommunio.core.ui.NavigationPanel} NavigationPanel.
	 */
	getNavigationPanel: function()
	{
		return this.navigationPanel;
	},

	/**
	 * Create the {@link Grommunio.core.ui.widget.WidgetPanel WidgetPanel} for
	 * the east region of the client in which the Today view can be shown.
	 * @return {Object} Configuration object for the WidgetPanel.
	 * @private
	 */
	createTodayPanel: function()
	{
		var hide = container.getServerConfig().isWidgetEnabled() ? container.getSettingsModel().get('grommunio/v1/widgets/sidebar/hide_widgetpanel', true, false) : true;
		this.widgetPanel = new Grommunio.core.ui.widget.WidgetPanel({
			region: 'east',
			title: _('Widgets'),
			numColumns: 1,
			stateful: true,
			statefulName: 'todaybar',
			statefulRelativeDimensions: true,
			settingsPath: 'grommunio/v1/contexts/today/sidebar',
			hidden: hide,
			collapsed: true
		});
		return this.widgetPanel;
	},

	/**
	 * Returns the {@link Grommunio.core.ui.widget.WidgetPanel WidgetPanel} for
	 * the east region of the client in which the widgets can be shown.
	 * @return {Grommunio.core.ui.widget.WidgetPanel} widgetPanel
	 */
	getWidgetPanel: function()
	{
		return this.widgetPanel;
	},

	/**
	 * Create the {@link Grommunio.core.ui.ContextContainer ContextContainer} for
	 * the center region of the client in which the main contents can be shown.
	 * @return {Object} Configuration object for the ContextContainer
	 * @private
	 */
	createContentContainer: function()
	{
		var cc = new Grommunio.core.ui.ContextContainer({
			name: 'main.content',
			id: 'grommunio-mainpanel-content'
		});
		//get items from insertion point
		//TODO: create separate insertion points for front and back of tab strip?
		var lazyItems = container.populateInsertionPoint('main.content.tabpanel', this);

		this.contentPanel = new Grommunio.core.ui.MainContentTabPanel({
			id: 'grommunio-mainpanel',
			activeTab: 0,
			region: 'center',
			enableTabScroll: true,
			layoutOnTabChange: true,
			items: [ cc ].concat(lazyItems),
			plugins: [ 'grommunio.tabclosemenuplugin' ],
			cls: 'grommunio-body-tabbar',
			listeners: {
				"afterrender": function() {
					container.fireEvent('afterrendercontentpanel', this);
				}
			}
		});
		return this.contentPanel;
	},

	/**
	 * Returns the {@link Grommunio.core.ui.ContextContainer ContentPanel} for
	 * the center region of the client in which the context will display its contents
	 * @return {Grommunio.core.ui.ContextContainer} contentPanel
	 */
	getContentPanel: function()
	{
		return this.contentPanel;
	},

	/**
	 * Create a {@link Ext.Container Container} that contains the
	 * {@link Grommunio.core.ui.MainTabBar MainTabBar} and the {@link Grommunio.core.ui.MainTab MainTab}
	 * at the top of the client.
	 * @return {Ext.Container} Container holding the MainTabBar and MainTab
	 * @private
	 */
	createTopbarContainer: function()
	{
		return new Ext.Container({
			name: 'main.topbar',
			region: 'north',
			layout: 'border',
			height: 36+54,
			items: [
				new Grommunio.core.ui.MainTabBar({
					name: 'main.maintabbar',
					region: 'center',
					height: 36,
					boxMinHeight: 36,
					boxMaxHeight: 36,
					ref: '../../mainTabBar'
				}),
				new Grommunio.core.ui.MainToolbar({
					name: 'main.toolbar',
					region: 'south',
					height: 54,
					boxMinHeight: 54,
					boxMaxHeight: 54,
					ref: '../../mainToolbar'
				})
			]
		});
	}
});
