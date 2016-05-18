/*
 * #dependsFile client/zarafa/core/Container.js
 */
Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.MessageBoxPlugin
 * @extends Zarafa.core.ui.notifier.NotifyPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.NotifyPlugin NotifyPlugin} which sends all
 * messages to the user using a {@link Ext.messageBox MessageBox}. This plugin will be registered to the
 * {@link Zarafa.core.ui.notifier.Notifier notifier} using the name 'messagebox'.
 */
Zarafa.core.ui.notifier.MessageBoxPlugin = Ext.extend(Zarafa.core.ui.notifier.NotifyPlugin, {

	/**
	 * Notify the user with a message.
	 *
	 * The category can be either  "error", "warning", "info" or "debug", or a subtype thereof (e.g. "info.newmail").
	 *
	 * @param {String} category The category which applies to the notification.
	 * @param {String} title The title which must be shown in the message.
	 * @param {String} message The message which should be displayed.
	 * @param {Object} config Configuration object which can be applied to the notifier
	 * This object can contain keys like:
	 * - container: Which is the container to which the notifier should be restricted
	 * - persistent: True to make the message persistent and don't disappear automatically
	 * - destroy: Don't create new message, but destroy previous one
	 * - update: Don't create a new message, but update previous one
	 * - reference: The original message which must be updated by this action
	 * - listeners: Event handlers which must be registered on the element
	 * @return {Ext.MessageBox} The message box
	 */
	notify : function(category, title, message)
	{
		var icon;
		if (category.indexOf('info') === 0) {
			icon = Ext.MessageBox.INFO;
		} else if (category.indexOf('warning') === 0) {
			icon = Ext.MessageBox.WARNING;
		} else if (category.indexOf('error') === 0) {
			icon = Ext.MessageBox.ERROR;
		}

		return Ext.MessageBox.show({
			title: title,
			msg : message,
			icon: icon,
			buttons: Ext.MessageBox.OK
		});
	}
});

Zarafa.onReady(function() {
	container.getNotifier().registerPlugin('messagebox', new Zarafa.core.ui.notifier.MessageBoxPlugin());
});
