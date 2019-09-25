Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.DropdownBoxPlugin
 * @extends Zarafa.core.ui.notifier.SliderNotifierPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.SliderNotifierPlugin SliderPlugin} which sends all
 * messages to a nice dropdown box in the top-middle of the screen. This plugin
 * will be registered to the {@link Zarafa.core.ui.notifier.Notifier notifier} using
 * the name 'dropdown'.
 */
Zarafa.core.ui.notifier.DropdownBoxPlugin = Ext.extend(Zarafa.core.ui.notifier.SliderNotifierPlugin, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			itemCls : 'zarafa-notifier-dropdown-item',
			// Position the container at the top-center
			sliderContainerPosition : 't'
		});

		Zarafa.core.ui.notifier.DropdownBoxPlugin.superclass.constructor.call(this, config);
	}
});

Zarafa.onReady(function() {
	container.getNotifier().registerPlugin('dropdown', new Zarafa.core.ui.notifier.DropdownBoxPlugin());

	// Backwards compatibility
	container.getNotifier().registerPlugin('eventdropdown', new Zarafa.core.ui.notifier.DropdownBoxPlugin());
	container.getNotifier().registerPlugin('persistentmessageplugin', new Zarafa.core.ui.notifier.DropdownBoxPlugin());
	container.getNotifier().registerPlugin('dialognotifier', new Zarafa.core.ui.notifier.DropdownBoxPlugin());
});
