Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.MainTabBar
 * @extends Ext.Toolbar
 * @xtype zarafa.maintabbar
 *
 * The MainTabBar shows the tabs at the top of the application. It can be filled by two insertion
 * points that populate the left and the right side of the bar. It will use instances of the
 * {@link Zarafa.core.ui.MainTab MainTab} to represent the tabs.
 */
Zarafa.core.ui.MainTabBar = Ext.extend(Ext.Toolbar, {
	// Insertion points for this class
	/**
	 * @insert main.maintabbar.left
	 * Insertion point for populating main tabbar to the left. The tabOrderIndex is used to
	 * determine the order of the tabs. The lower the number the more to the left the button is
	 * added.
	 * @param {Zarafa.core.ui.MainTabBar} toolbar This toolbar
	 */
	/**
	 * @insert main.maintabbar.right
	 * Insertion point for populating main tabbar to the right. The tabOrderIndex is used to
	 * determine the order of the tabs. The lower the number the more to the right the button is
	 * added.
	 * @param {Zarafa.core.ui.MainTabBar} toolbar This toolbar
	 */

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'zarafa.maintabbar',
			id: 'zarafa-mainmenu',
			cls: 'zarafa-maintabbar',
			defaultType: 'zarafa.maintab',
			ariaLabel: _('Main navigation')
		});

		Zarafa.core.ui.MainTabBar.superclass.constructor.call(this, config);

		this.initBar();
	},

	/**
	 * Add items to this toolbar by using the main.maintabbar.left and main.maintabbar.right
	 * insertion points. Also the text who is logged in and the log out button is added. The buttons
	 * added through the insertion points are sorted using the tabOrderIndex set on the objects in
	 * the list returned by the insertion point.
	 * @private
	 */
	initBar: function()
	{

		var leftItems = container.populateInsertionPoint('main.maintabbar.left', this) || [];
		var rightItems = container.populateInsertionPoint('main.maintabbar.right', this) || [];

		// Make sure the items are properly sorted by priority.
		leftItems = Zarafa.core.Util.sortArray(leftItems, 'ASC', 'tabOrderIndex');
		// The right items are sorted so that the first item appears to the most right
		rightItems = Zarafa.core.Util.sortArray(rightItems, 'DESC', 'tabOrderIndex');

		this.addTooltip(leftItems, rightItems);

		var loginText = {
				xtype: 'tbtext',
				width: 'auto',
				cls: 'zarafa-maintabbar-logintext',
				text: container.getUser().getDisplayName(),
				id: 'mainmenu-logintext'
		};

		// Adding reminder button with bell icon.
		var reminder = {
			width: 30,
			id: 'mainmenu-button-reminder',
			ref: 'reminder',
			tooltip: _('Reminders'),
			handler: function() {
				var store = container.getReminderStore();
				Zarafa.common.Actions.openReminderContent(store.getRange());
			},
			listeners: {
				afterRender: function(reminderBtn) {
					var store = container.getReminderStore();
					var recordLength = store.getRange().length;
					reminderBtn.getEl().setStyle('backgroundImage', 'url(\'' + Zarafa.common.ui.IconClass.getReminderSvgIcon( recordLength ) + '\')');
					var noReminder = recordLength === 0;
					reminderBtn.setDisabled(noReminder);
					reminderBtn.setTooltip(noReminder? _('There are no reminders'): '');
				},
				scope: this
			},
			style: {
				backgroundImage: 'url(\'' + Zarafa.common.ui.IconClass.getReminderSvgIcon() + '\')',
				backgroundRepeat: 'no-repeat',
				backgroundPosition: 'center'
			},
			scope: this
		};

		var darkModeSwitcher = this.createDarkModeSwitcher();

		this.add(leftItems, {xtype: 'tbfill'}, loginText, reminder, darkModeSwitcher, rightItems);

		// Don't show the logout button when using SSO or if it's disabled in the config, but always show it in DeskApp
		if ( !(container.getServerConfig().usingSSO() || !container.getServerConfig().showLogoutButton()) || Zarafa.isDeskApp ){
			var logoutButton = {
				text: _('Logout'),
				handler: this.onLogoutButton,
				id: 'mainmenu-button-logout'
			};

			this.add(logoutButton);
		}
	},

	/**
	 * Create an SVG data URI for the dark mode switcher icon.
         * Icons are optimized, secondary pass not required
	 * @param {String} mode One of 'light', 'dark', 'system'
	 * @return {String} SVG data URI
	 * @private
	 */
	getDarkModeIcon: function(mode)
	{
		var svg;
		if (mode === 'light') {
			// Sun icon
			svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
		} else if (mode === 'dark') {
			// Moon icon
			svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79"/></svg>';
		} else {
			// Auto icon: sun-moon combo
			svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3V1m0 22v-2m9-9h2M1 12h2m15.78-7.78L20.2 2.8M4.22 19.78l1.42-1.42m12.72 1.42 1.42 1.42M4.22 4.22l1.42 1.42"/><circle cx="12" cy="12" r="4"/><path fill="#fff" stroke="none" d="M12 8a4 4 0 0 1 0 8z"/></svg>';
		}
		return 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svg);
	},

	/**
	 * Get the tooltip text for the dark mode switcher.
	 * @param {String} mode One of 'light', 'dark', 'system'
	 * @return {String} tooltip text
	 * @private
	 */
	getDarkModeTooltip: function(mode)
	{
		switch (mode) {
			case 'light': return _('Appearance') + ': ' + _('Light');
			case 'dark': return _('Appearance') + ': ' + _('Dark');
			default: return _('Appearance') + ': ' + _('Automatic');
		}
	},

	/**
	 * Create the dark mode 3-way switcher button config.
	 * Cycles through light -> system -> dark -> light.
	 * @return {Object} Ext button config
	 * @private
	 */
	createDarkModeSwitcher: function()
	{
		var currentMode = Zarafa.core.DarkMode.getMode();
		return {
			width: 30,
			id: 'mainmenu-button-darkmode',
			tooltip: this.getDarkModeTooltip(currentMode),
			handler: function() {
				var mode = Zarafa.core.DarkMode.getMode();
				// Cycle: light -> system -> dark -> light
				if (mode === 'light') {
					mode = 'system';
				} else if (mode === 'system') {
					mode = 'dark';
				} else {
					mode = 'light';
				}
				Zarafa.core.DarkMode.setMode(mode);
			},
			style: {
				backgroundImage: 'url(\'' + this.getDarkModeIcon(currentMode) + '\')',
				backgroundRepeat: 'no-repeat',
				backgroundPosition: 'center'
			}
		};
	},

	/**
	 * Used to apply key shortcut and context name in tooltip.
	 * @param {Array} leftItems The leftItems contains the left context items which are properly sorted by priority.
	 * @param {Array} rightItems The rightItems contains the right context items.
	 */
	addTooltip: function(leftItems, rightItems)
	{
		var contextItems = [];
		contextItems = contextItems.concat(leftItems, rightItems);
		Ext.each(contextItems, function(context, index) {
			context.tooltip = context.text + Zarafa.core.KeyMapMgr.formatShortcutHint('Ctrl + '+index, false);
		});
	},

	/**
	 * Event handler which is called when the user presses the 'logout' button
	 * @private
	 */
	onLogoutButton: function()
	{
		container.logout();
	}
});

Ext.reg('zarafa.maintabbar', Zarafa.core.ui.MainTabBar);
