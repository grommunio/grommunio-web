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
	 * Notify the user with a message.
	 *
	 * The category can be either "error", "warning", "info" or "debug", or a subtype thereof (e.g. "info.newmail").
	 *
	 * @param {String} category The category which applies to the notification.
	 * @param {String} title The title which must be shown in the message. This
	 * notifier has room for the message only, so the title is not shown.
	 * @param {String} message The message which should be displayed.
	 * @param {Object} config Configuration object which can be applied to the notifier
	 * This object can contain keys like:
	 * - toolbar: {@link Ext.Toolbar Toolbar} in which notification message will be added,
	 * notification message will be added at right most of the toolbar.
	 */
	notify: function(category, title, message, config)
	{
		if(category == 'info.mailsaving' || category == 'info.mailsaved') {
			if (config && config.toolbar) {
				if(!config.toolbar.saveMessageText) {
					var addInfoText = [{
							xtype: 'tbfill'
						}, {
							xtype: 'tbtext',
							autoWidth: true,
							ref: 'saveMessageText',
							listeners: {
								afterrender: function(cmp) {
									if (cmp.el) {
										cmp.el.set({ 'role': 'status', 'aria-live': 'polite' });
									}
								}
							}
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
