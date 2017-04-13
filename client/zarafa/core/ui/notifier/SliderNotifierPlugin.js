Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.SliderNotifierPlugin
 * @extends Zarafa.core.ui.notifier.NotifyPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.NotifyPlugin NotifyPlugin} which works by sliding
 * the message at a certain position into the screen.
 *
 * This class is intended as Base implementation by any notifier which want to implement
 * some sort of sliding of messages at a certain position. This class defines the various
 * locations and will ensure that different sliders will properly stack at those locations.
 */
Zarafa.core.ui.notifier.SliderNotifierPlugin = Ext.extend(Zarafa.core.ui.notifier.NotifyPlugin, {
	/**
	 * @cfg {Ext.XTemplate/String} The template used to create the PopupBox.
	 * The {@link Ext.XTemplate XTemplate} arguments are:
	 * - 'categorycls': The CSS class which is used to indicate the category for which the notifier is created
	 * - 'basecls': The CSS class which is used as base on the different elements
	 * - 'title': The title which must be shown (See the title argument for {@link #notify}).
	 * - 'message': The message which must be shown (See the message argument for {@link #notify}).
	 */
	msgTemplate : new Ext.XTemplate(
		'<div class="{categorycls} {basecls}">' +
			'<div class="left">'+
				'<div class="icon" ></div>' +
			'</div>'+
			'<div class="right">' +
				'<h2 class="{basecls}-title">' +
					'{title}' +
				'</h2>' +
				'<div class={basecls}-message">' +
					'{message}' +
				'</div>' +
			'</div>'+
		'</div>'
	),

	/**
	 * @cfg {String} itemCls The base CSS class to be applied to {@link #msgTemplate}
	 */
	itemCls : 'zarafa-slide-notifier',

	/**
	 * @cfg {String} categoryCls The base CSS class for the categorycls to be applied to {@link #msgTemplate}
	 */
	categoryCls : 'zarafa-slide-notifier',

	/**
	 * @cfg {Number} msgLifetime The amount of seconds of which non-persistent messages should be displayed.
	 */
	msgLifetime : 5,

	/**
	 * @cfg {String} sliderContainerPosition The position of the container
	 * in which the notifier will be shown. This can be any of the following values:
	 * - 'tl': The top left corner
	 * - 't': The center of the top edge (default)
	 * - 'tr': The top right corner
	 * - 'l': The center of the left edge
	 * - 'c': In the center of the element
	 * - 'r': The center of the right edge
	 * - 'bl': The bottom left corner
	 * - 'b': The center of the bottom edge
	 * - 'br': The bottom right corner
	 */
	sliderContainerPosition : 't',

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Zarafa.core.ui.notifier.SliderNotifierPlugin.superclass.constructor.call(this, config);

		if (Ext.isString(this.msgTemplate)) {
			this.msgTemplate = new Ext.XTemplate(this.msgTemplate, { compiled : true });
		}
	},

	/**
	 * Obtain a {@link Zarafa.core.ui.notifier.SliderContainer SliderContainer} from 
	 * {@lin #slideContainers} or instantiate a new one. This container can be used
	 * to show new notifications.
	 * @param {Ext.Element} parentCt The parent element in which the container should
	 * be placed
	 * @param {String} The position of the container, see {@link #sliderContainerPosition}.
	 * @return {Zarafa.core.ui.notifier.SliderContainer} The slider container
	 * @private
	 */
	getSliderContainer : function(parentCt, position)
	{
		parentCt = parentCt || Ext.getBody();

		var containerid = parentCt.id + '-' + position;
		var containers = Zarafa.core.ui.notifier.SliderNotifierPlugin.sliderContainers;

		// Check if the container exists in the DOM, otherwise create a new one
		if (!containers[containerid] || !Ext.get(containers[containerid].container.id) ) {
			containers[containerid] = new Zarafa.core.ui.notifier.SliderContainer({
				parentContainer : parentCt,
				containerPosition : position,
				slideinDirection : position[0],
				slideoutDirection : position[0]
			});
		}else{
			// The parent component could be removed from the DOM and rendered again later.
			// If we set it again we are sure we have the DOM oject
			containers[containerid].parentContainer = parentCt;
		}

		return containers[containerid];
	},

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
	 * @return {Ext.Element} The slider element which was created
	 */
	notify : function(category, title, message, config)
	{
		// Enable default config if none was provided
		config = config || {};

		// Generate a CSS class which must be applied
		var basecls = this.itemCls;
		var categorycls = this.categoryCls + '-' + category.split('.')[0] + ' ' + this.categoryCls + '-' + category.replace(/\./g, '-');

		// Create the HTML string which we want to generate
		var html = this.msgTemplate.apply({ title : title, message : message, basecls : basecls, categorycls : categorycls });
		var slider = this.getSliderContainer(config.container, this.sliderContainerPosition);

		if (config.reference) {
			if (config.destroy) {
				slider.removeMessage(config.reference);
			} else if (config.update) {
				return slider.updateMessage(config.reference, html);
			}
		} else {
			var lifetime = config.persistent ? false : this.msgLifetime;
			var reference = slider.createMessage(html, lifetime);
			// Register the click event on notifier if notification
			// is not persistent and does not have already registered click event,
			// which discard notification when user click on it.
			if (lifetime !== false && !(Ext.isDefined(config.listeners) && Ext.isDefined(config.listeners.click))) {
				config.listeners = {
					click: this.onNotifierClick.createDelegate(this,[category], 1),
					scope: this
				};
			}
			if (config.listeners) {
				this.addMessageListeners(reference, config.listeners);
			}

			return reference;
		}
	},

	/**
	 * Event handler which triggers when user click on notification.
	 * Where function is used to discard the existing notification.
	 *
	 * @param {Zarafa.core.ui.notifier.SliderContainer} notification The slider container of notification.
	 * @param {String} category The category which applies to the notification.
	 * @param {Ext.EventObject} event The event object
	 */
	onNotifierClick : function (notification, category, event) {
		container.getNotifier().notify(category, null, null, {
			container : notification.slider.parentContainer,
			destroy : true,
			reference : notification
		});
	},

	/**
	 * Register event handlers to the {@link Ext.Element message}.
	 * @param {Ext.Element} reference The Message reference
	 * @param {Object} listeners The object of event handlers to register
	 * @private
	 */
	addMessageListeners : function(reference, listeners)
	{
		for (var key in listeners) {
			var fn = listeners[key];

			if (key !== 'scope' && Ext.isFunction(fn)) {
				reference.on(key, function(event, reference, fn) {
					fn.call(this, reference, event);
				}.createDelegate(listeners.scope || reference, [ reference, fn ], 1));
			}
		}
	}
});

/**
 * Cache of all {@link Zarafa.core.ui.notifier.SliderContainer} instances which were
 * created by the {@link Zarafa.core.ui.notifier.SliderNotifierPlugin SliderNotifierPlugin}.
 * @property
 * @type Object
 * @private
 * @static
 */
Zarafa.core.ui.notifier.SliderNotifierPlugin.sliderContainers = {};
