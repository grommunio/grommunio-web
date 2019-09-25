/*
 * #dependsFile client/zarafa/core/Container.js
 */
Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.ConsolePlugin
 * @extends Zarafa.core.ui.notifier.NotifyPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.NotifyPlugin NotifyPlugin} which sends all
 * messages to the browser console. This plugin will be registered to the
 * {@link Zarafa.core.ui.notifier.Notifier notifier} using the name 'console'.
 */
Zarafa.core.ui.notifier.ConsolePlugin = Ext.extend(Zarafa.core.ui.notifier.NotifyPlugin, {

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
	 * @return {Mixed} A reference to the message which was created, this can be used
	 * as value for 'reference' in the config argument.
	 */
	notify : function(category, title, message, config)
	{
		// Internet Explorer only defines 'console' when the browser's
		// debugger is opened, and the console on which is going to be
		// printed is visible. Hence we have to check if the console
		// exists before using it.
		if (!console) {
			return;
		}

		var str = title + ': ' + message;

		if (category.indexOf('info') === 0) {
			console.info(str);
		} else if (category.indexOf('warning') === 0) {
			console.warn(str);
		} else if (category.indexOf('error') === 0) {
			console.error(str);
		} else {
			console.log(str);
		}
	}
});

Zarafa.onReady(function() {
	container.getNotifier().registerPlugin('console', new Zarafa.core.ui.notifier.ConsolePlugin());
});
