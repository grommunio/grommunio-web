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
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'zarafa.maintabbar',
			id: 'zarafa-mainmenu',
			cls : 'zarafa-maintabbar',
			defaultType: 'zarafa.maintab'
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
	initBar : function()
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

		var logoutButton = {
			text: _('Logout'),
			handler : this.onLogoutButton,
			id: 'mainmenu-button-logout'
		};

		this.add(leftItems, {xtype: 'tbfill'}, loginText, rightItems, logoutButton);
	},
	
	/**
	 * Used to apply key shortcut and context name in tooltip.
	 * @param {Array} leftItems The leftItems contains the left context items which are properly sorted by priority.
	 * @param {Array} rightItems The rightItems contains the right context items.
	 */
	addTooltip : function(leftItems, rightItems)
	{
		var contextItems = [];
		contextItems = contextItems.concat(leftItems, rightItems);
		Ext.each(contextItems, function(context, index) {
			context.tooltip = context.text + ' (Ctrl + '+index+')';
		});
	},

	/**
	 * Event handler which is called when the user presses the 'logout' button
	 * @private
	 */
	onLogoutButton : function()
	{
		container.logout();
	}
});

Ext.reg('zarafa.maintabbar', Zarafa.core.ui.MainTabBar);
