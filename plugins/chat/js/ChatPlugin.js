Ext.namespace('Zarafa.plugins.chat');

/**
 * @class Zarafa.plugins.chat.Chat
 * @extends Zarafa.core.Plugin
 *
 * Plugin that adds Chat to grommunio Web
 */
Zarafa.plugins.chat.Chat = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Initializes the plugin.
	 */
	initPlugin : function(){
		var pluginSettings = container.getSettingsModel().get('zarafa/v1/plugins/chat', true);
		var site = {
			url: pluginSettings.url,
			tabOrder: 9
		};

		// The tab in the top tabbar
		this.registerInsertionPoint('main.maintabbar.left', this.createMainTab.createDelegate(this, [site]), this);

		// The settings category
		this.registerInsertionPoint('context.settings.categories', this.createSettingCategory, this);

		// Register mail specific dialog types
		Zarafa.core.data.SharedComponentType.addProperty('plugins.chat.panel');

		// Autostart if needed
		if ( pluginSettings.autostart ){
			container.on('webapploaded', function(){
				// use the openTab function for convenience
				this.openTab(this.createMainTab(site));

				// OpenTab will also switch to the chat tab, but we don't want that, so
				// let's switch back to the main tab.
				var mainContentTabPanel = container.getMainPanel().contentPanel;
				mainContentTabPanel.activate(0);
			}, this);
		}
	},

	/**
	 * Adds a button to the top tab bar for this context.
	 * @return {Object} The button for the top tabbar
	 * @private
	 */
	createMainTab: function(site)
	{
		return {
			text: 'Chat',
			url: site.url,
			tabOrderIndex: site.tabOrder,
			cls: 'mainmenu-button-chat',
			handler: this.openTab
		};
	},

	/**
	 * Event handler for the click event of the tabbar buttons. It will
	 * open the tab if it already exists, or create it otherwise.
	 * @param {Zarafa.core.ui.MainTab} btn The button in the
	 * {@link Zarafa.core.ui.MainTabBar main tabbar}
	 */
	openTab: function(btn)
	{
		var tabIndex;
		Ext.each(container.getTabPanel().items.items, function(item, index){
			if ( item.tabId === 'chat' ){
				tabIndex = index;
			}
		});

		if ( Ext.isDefined(tabIndex) ){
			// open the existing tab
			var mainContentTabPanel = container.getMainPanel().contentPanel;
			mainContentTabPanel.activate(tabIndex);
			return;
		}

		// Create a new tab
		Zarafa.core.data.UIFactory.openLayerComponent(
			Zarafa.core.data.SharedComponentType['plugins.chat.panel'],
			null,
			{
				url: btn.url,
				title: btn.text,
				tabOrder: btn.tabOrderIndex,
				tabId: 'chat'
			}
		);
	},

	createSettingCategory : function()
	{
		return {
			xtype: 'zarafa.plugins.chat.settings.category'
		};
	},

	/**
	 * Bid for the type of shared component
	 * and the given record.
	 * This will bid on a common.dialog.create or common.dialog.view for a
	 * record with a message class set to IPM or IPM.Note.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context
	 * can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent : function(type, record)
	{
			var bid = -1;

			switch (type) {
				case Zarafa.core.data.SharedComponentType['plugins.chat.panel']:
					bid = 1;
			}

			return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context
	 * can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent : function(type, record)
	{
		var component;
		switch (type)
		{
			case Zarafa.core.data.SharedComponentType['plugins.chat.panel']:
				return Zarafa.plugins.chat.ui.ContentPanel;
		}
	}

});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'chat',
		displayName : 'Chat',
		allowUserVisible : true,
		pluginConstructor : Zarafa.plugins.chat.Chat
	}));
});
