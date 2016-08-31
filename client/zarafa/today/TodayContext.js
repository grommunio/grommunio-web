Ext.namespace('Zarafa.today');

/**
 * @class Zarafa.today.TodayContext
 * @extends Zarafa.core.Context
 * 
 * The today context presents an overview of tasks, notes, and appointments for today. The user can customise
 * the today view by adding and removing widgets. Widgets display information such as the aforementioned
 * daily overviews, but can also be made to display other things such as the time in various places in the world,
 * the weather, or a game.   
 */
Zarafa.today.TodayContext = Ext.extend(Zarafa.core.Context, {
	// Insertion points for this class
	/**
	 * @insert main.maintoolbar.view.today
	 * Insertion point for populating the main toolbar with a View button. This item is only visible
	 * when this context is active.
	 * @param {Zarafa.mail.TodayContext} context This context
	 */

	/**
 	 * @constructor
	 * @param config
	 */	 
	constructor : function(config)
	{
		// The tab in the top tabbar
		this.registerInsertionPoint('main.maintabbar.left', this.createMainTab, this);
		Zarafa.today.TodayContext.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Zarafa.taday.TodayContextModel} the today context model
	 */
	getModel : function()
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Zarafa.today.TodayContextModel();
		}
		return this.model;
	},

	/**
	 * Bid for the given {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
	 * This will bid on the {@link Zarafa.hierarchy.data.MAPIFolderRecord#isIPMSubTree SubTree} folder.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the context is bidding
	 * @return {Number} 1 when the contexts supports the folder, -1 otherwise
	 */
	bid : function(folder)
	{
		if (folder.isOwnRoot()) {
			return 2;
		}

		return 0;
	},
	
	/**
	 * Obtain the {@link Zarafa.core.ui.widget.WidgetPanel WidgetPanel} object
	 *
	 * @return {Zarafa.core.ui.widget.WidgetPanel} The main panel which should
	 * be used within the {@link Zarafa.core.Context context}
	 */
	createContentPanel : function()
	{
		return {
			xtype: 'zarafa.widgetpanel',
			id: 'zarafa-mainpanel-contentpanel-today',
			settingsPath : 'zarafa/v1/contexts/today',
			showDefaultWidgets : ['mail', 'appointments', 'tasks'],
			context : this,
			collapsible : false,
			numColumns: container.getSettingsModel().get('zarafa/v1/contexts/today/num_columns')
		};
	},

	/**
	 * Returns the buttons for the dropdown list of the VIEW-button in the main toolbar. It will use the 
	 * main.maintoolbar.view.today insertion point to allow other plugins to add their items at the end.
	 * 
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarViewButtons : function()
	{
		var items = container.populateInsertionPoint('main.maintoolbar.view.today', this) || [];

		return items;
	},

	/**
	 * Adds a button to the top tab bar for this context.
	 * @return {Object} The button for the top tabbar 
	 * @private
	 */
	createMainTab: function()
	{
		return {
			text: this.getDisplayName(),
			tabOrderIndex: 1,
			context: this.getName(),
			id: 'mainmenu-button-today'
		};
	}
});

Zarafa.onReady(function() {
	container.registerContext(new Zarafa.core.ContextMetaData({
		name : 'today',
		displayName : _('Today'),
		allowUserVisible : false,
		pluginConstructor : Zarafa.today.TodayContext
	}));
});
