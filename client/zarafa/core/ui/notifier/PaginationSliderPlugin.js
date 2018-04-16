Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.PaginationSliderPlugin
 * @extends Zarafa.core.ui.notifier.PagingSliderPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.PaginationSliderPlugin PaginationSliderPlugin} which shows the
 * a nice slider container which contains {@link Zarafa.common.ui.PagingToolbar PagingToolbar} into it.
 */
Zarafa.core.ui.notifier.PaginationSliderPlugin = Ext.extend(Zarafa.core.ui.notifier.PagingSliderPlugin, {

	/**
	 * @cfg {Boolean} pagingEnabled
	 * The pagingEnabled is true only when pagination is enabled.(Default to true)
	 */
	pagingEnabled : true,

	/**
	 * @cfg {Number} sliderDuration
	 * A specified time duration after that slide gets hide/remove the slide
	 * from DOM (defaults to <code>5</code> seconds).
	 */
	sliderDuration : 2000,

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
			pagingEnabled : true,
			sliderDuration : 2000
		});

		Zarafa.core.ui.notifier.PaginationSliderPlugin.superclass.constructor.call(this, config);
	},

	/**
	 * Notifier notifies only when number of pages are more than one page.
	 *
	 * @param {String} category The category which applies to the notification.
	 * @param {String} title The title which must be shown in the message.
	 * @param {String} message The message which should be displayed.
	 * @param {Object} config Configuration object which can be applied to the notifier
	 * This object can contain keys like:
	 * - parentEl: Which is the container to which the notifier should be restricted
	 * - destroy: Don't create new message, but destroy previous one
	 * - model: {@link Zarafa.core.ContextModel model} of the current context.
	 * - update: true to realign the slider.
	 * - slider: The slider container.
	 * @return {Ext.Element} The slider element which was created
	 */
	notify : function(category, title, message, config)
	{
		if (!config.destroy) {
			var total = config.model.getStore().totalLength;
			var pageSize = container.getSettingsModel().get('zarafa/v1/main/page_size');
			var pages = total < pageSize ? 1 : Math.ceil(total / pageSize);
			if (pages == 1) {
				return;
			}
		}
		return Zarafa.core.ui.notifier.PaginationSliderPlugin.superclass.notify.apply(this, arguments);
	}
});

Zarafa.onReady(function() {
	container.getNotifier().registerPlugin('pagingslider', new Zarafa.core.ui.notifier.PaginationSliderPlugin());
});