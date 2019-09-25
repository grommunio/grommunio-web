Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.ToolbarNotifierPlugin
 * @extends Zarafa.core.ui.notifier.NotifyPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.NotifyPlugin NotifyPlugin} which shows
 * notification messages inside {@link Ext.Toolbar Toolbar}. This plugin
 * will be registered to the {@link Zarafa.core.ui.notifier.Notifier notifier} using
 * the name 'toolbarnotifierplugin'.
 */
Zarafa.core.ui.notifier.ToolbarNotifierPlugin = Ext.extend(Zarafa.core.ui.notifier.NotifyPlugin, {
	/**
	 * Send a notification to the user. This {@link #getPlugin requests} the plugin for the provided category.
	 * On the plugin the {@link Zarafa.core.ui.notifier.NotifyPlugin#notify notify} function is called to display
	 * the message to the user. If no plugin could be found for
	 * the given category, then no message will be shown to the user.
	 *
	 * @param {String} category The category which applies to the notification.
	 * @param {String} message The message which should be displayed.
	 * @param {Object} config Configuration object which can be applied to the notifier
	 * This object can contain keys like:
	 * - toolbar: {@link Ext.Toolbar Toolbar} in which notification message will be added,
	 * notification message will be added at right most of the toolbar.
	 */
	notify : function(category, message, config)
	{
		if(category == 'info.mailsaving' || category == 'info.mailsaved') {
			if (config.toolbar) {
				if(!config.toolbar.saveMessageText) {
					var addInfoText = [{
							xtype: 'tbfill'
						}, {
							xtype : 'tbtext',
							autoWidth : true,
							ref: 'saveMessageText'
						}];
					config.toolbar.add(addInfoText);
					config.toolbar.doLayout();
				}
				config.toolbar.saveMessageText.setText(message);
			}
		}
		Zarafa.core.ui.notifier.ToolbarNotifierPlugin.superclass.notify.apply(this, arguments);
	}
});

Zarafa.onReady(function() {
	container.getNotifier().registerPlugin('toolbarnotifierplugin', new Zarafa.core.ui.notifier.ToolbarNotifierPlugin());
});
