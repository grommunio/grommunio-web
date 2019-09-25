Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.LiveScrollSliderPlugin
 * @extends Zarafa.core.ui.notifier.PagingSliderPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.LiveScrollSliderPlugin LiveScrollSliderPlugin} which shows the
 * a nice slider container which contains live scroll loading information into it.
 */
Zarafa.core.ui.notifier.LiveScrollSliderPlugin = Ext.extend(Zarafa.core.ui.notifier.PagingSliderPlugin, {
	/**
	 * @cfg {Boolean} pagingEnabled
	 * The pagingEnabled is true only when pagination is enabled.(Default to false)
	 */
	pagingEnabled : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Position the container at the bottom-center
			sliderContainerPosition : 'b',
			pagingEnabled : false,
			sliderDuration : 5000
		});

		Zarafa.core.ui.notifier.LiveScrollSliderPlugin.superclass.constructor.call(this, config);
	}
});

Zarafa.onReady(function() {
	container.getNotifier().registerPlugin('livescrollslider', new Zarafa.core.ui.notifier.LiveScrollSliderPlugin());
});