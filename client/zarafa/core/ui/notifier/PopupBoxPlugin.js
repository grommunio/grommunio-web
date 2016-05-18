Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.PopupBoxPlugin
 * @extends Zarafa.core.ui.notifier.SliderNotifierPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.SliderNotifierPlugin SliderPlugin} which sends all
 * messages to a nice popup box in the lower-right corner of the screen. This plugin
 * will be registered to the {@link Zarafa.core.ui.notifier.Notifier notifier} using
 * the name 'popup'.
 */
Zarafa.core.ui.notifier.PopupBoxPlugin = Ext.extend(Zarafa.core.ui.notifier.SliderNotifierPlugin, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.apply(config, {
			itemCls : 'zarafa-notifier-popup-item',
			// Position the container at the bottom-right
			sliderContainerPosition : 'br',
			// We want to show the message for 5 seconds
			msgLifetime : 5
		});

		Zarafa.core.ui.notifier.PopupBoxPlugin.superclass.constructor.call(this, config);
	}
});

Zarafa.onReady(function() {
	container.getNotifier().registerPlugin('popup', new Zarafa.core.ui.notifier.PopupBoxPlugin());
});
