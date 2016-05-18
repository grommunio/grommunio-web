Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.SliderContainer
 * @extends Object
 *
 * Special container to be used by the {@link Zarafa.core.ui.notifier.SliderNotifyPlugin}.
 * This supports holding multiple notification messages within a single DIV element,
 * and slide new ones into the container, and old ones out. The code is structured so only
 * one animation occurs at a time, and the container can be positioned anywhere on the screen.
 */
Zarafa.core.ui.notifier.SliderContainer = Ext.extend(Object, {
	/**
	 * @cfg {Ext.Element} parentContainer The parent container in which the
	 * slider will be positioned.
	 */
	parentContainer : undefined,

	/**
	 * @cfg {String} containerCls The CSS class to be applied on the {@link #container}.
	 */
	containerCls : 'zarafa-notifier-container',

	/**
	 * @cfg {String} itemCls The CSS class to be applied to the DIV wrapper around
	 * the messages added in {@link #createMessage}.
	 */
	itemCls : 'zarafa-notifier-container-item',

	/**
	 * @cfg {String} containerPosition The position of the container
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
	containerPosition : 't',

	/**
	 * @cfg {Char} slideinDirection the animation slidein direction for notification
	 */
	slideinDirection : 't',

	/**
	 * @cfg {Char} slideoutDirection the animation slideout direction for notification
	 */
	slideoutDirection : 't',

	/**
	 * @cfg {Boolean} animatedContainerResize True to animate the resizing of the container
	 * when a new notification is added into the container. This defaults to 'false' if
	 * {@link #slideinDirection} is 't', 'true' otherwise.
	 */
	animatedContainerResize : false,

	/**
	 * The container in which the sliders will be placed.
	 * @property
	 * @type Ext.Element
	 * @private
	 */
	container : undefined,

	/**
	 * The array of {@link Ext.Element Elements} which are pending to be displayed in the {@link #container}.
	 * Because we cannot animate two messages simultaneously, we keep the list of pending messages here, which
	 * serves as FIFO queue. Whenever a message has been animated, this list will be checked to see if a message
	 * is in the queue to be animated.
	 * @property
	 * @type Array
	 * @private
	 */
	pendingMessages : undefined,

	/**
	 * The array of {@link Ext.Element Elements} which are currently displayed in the {@link #container}.
	 * @property
	 * @type Array
	 * @private
	 */
	stackedMessages : undefined,

	/**
	 * Used by {@link #showNextMessage} to check if there currently is a Message which is being animated.
	 * When this field is set to 'true', then no other message is allowed to start animating.
	 * @property
	 * @type Array
	 * @private
	 */
	animating : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);

		this.container = this.getContainer();
		this.pendingMessages = [];
		this.stackedMessages = [];

		// update animatedContainerResize depending on configuration
		if (!Ext.isDefined(config.animatedContainerResize)) {
			this.animatedContainerResize = this.slideinDirection !== 't';
		}
	},

	/**
	 * Add a new slider to the container. This will animate the slider into the {@link #container}.
	 * @param {String} html The HTML string for the slider to create
	 * @param {Number} timeout (optional) If provided, the message will be removed automatically after the timeout
	 * @return {Ext.Element} The slider element which was created
	 */
	createMessage : function(html, timeout)
	{
		// Construct the Ext.Element object
		var element = Ext.DomHelper.append(this.container, { html : html, cls : this.itemCls, style : 'visibility: hidden;' }, true);

		// Push it to pending messages
		this.pendingMessages.push(element);
		element.timeout = timeout;
		element.slider = this;

		// Check if there are no pending messages, and we can direct display this new one.
		this.showNextMessage();

		return element;
	},

	/**
	 * Update a message which was previously created using {@link #createMessage}.
	 * @param {Ext.Element} The element to update
	 * @param {String} html The HTML string for the slider to update
	 * @return {Ext.Element} The slider element which was updated
	 * @private
	 */
	updateMessage : function(element, html)
	{
		element.dom.innerHTML = html;
		return element;
	},

	/**
	 * Remove a message which was previously created using {@link #createMessage}.
	 * @param {Ext.Element} element The element to remove
	 */
	removeMessage : function(element)
	{
		this.animating = true;

		if (this.stackedMessages.indexOf(element) >= 0) {
			element.ghost(this.slideoutDirection, {
				remove : true,
				callback : this.onRemoveComplete.createDelegate(this, [ element ]),
				scope : this
			});
		}
	},

	/**
	 * Called whenever a message has been added to the {@link #pendingMessages} queue, or when
	 * a message has been removed from the {@link #stackedMessages}. When we still have pending
	 * messages in {@link #pendingMessages},  we first check if we are currently busy
	 * {@link #animating animating} a message, or if there is no room for a new message to appear.
	 * When neither problem occurs, then we start animating the new message into the screen.
	 *
	 * @private
	 */
	showNextMessage : function()
	{
		var element = this.pendingMessages[0];
		var msgHeight = element.getHeight();
		var ctHeight = this.container.getHeight();
		var maxHeight = this.parentContainer.getHeight();

		// The <body> element might sometimes have height 0, compensate this
		// by asking for the document height in that case.
		if (maxHeight === 0 && this.parentContainer.dom.tagName === 'BODY') {
			maxHeight = document.height;
		}

		if (this.animating || (ctHeight + msgHeight) > maxHeight) {
			return;
		}
		this.animating = true;

		// Update the dimensions of the container to make room for the new element.
		// All existing messages will be nicely shifted the require height higher.
		var newHeight = ctHeight + msgHeight;
		this.updateContainer(newHeight, this.animatedContainerResize);

		// Store the original height of the message for later,
		// we need it for onMessageSlideOutComplete() when the real height has been reset,
		// and we need to resize the container.
		element.height = msgHeight;

		// Move the element to the next queue
		this.pendingMessages.remove(element);
		this.stackedMessages.push(element);

		this.animMessage(element);
	},

	/**
	 * Start the animation which will {@link Ext.Fx#slideIn slidein} the given element.
	 * If the slider was configured with a timeout, it will {@link Ext.Fx#pause show} the
	 * element for the given time and then {@link Ext.Fx#ghost remove} it again.
	 * @param {Ext.Element} element The element to show
	 * @private
	 */
	animMessage : function(element)
	{
		element = element.slideIn(this.slideinDirection, {
			callback : this.onShowComplete,
			scope : this
		});

		// Check if this element must automatically be removed
		// after a certain timeout.
		if (Ext.isNumber(element.timeout)) {
			element.pause(element.timeout, {
				callback : this.onPauseComplete,
				scope : this
			}).ghost(this.slideoutDirection, {
				remove : true,
				callback : this.onRemoveComplete.createDelegate(this, [ element ]),
				scope : this
			});
		}
	},

	/**
	 * Event handler which is called when the {@link Ext.Fx#slideIn slideIn} animation has been
	 * completed. This will reset the {@link #animating} flag, and call {@link #showNextMessage}
	 * to start animating any pending messages.
	 *
	 * @private
	 */
	onShowComplete : function()
	{
		this.animating = false;

		// Show the next message if there are pending messages,
		// and the parent container still exists (it might have been
		// deleted while the element was animating).
		if (!Ext.isEmpty(this.pendingMessages) && this.parentContainer.dom) {
			this.showNextMessage();
		}
	},

	/**
	 * Event handler which is called when the {@link Ext.Fx#pause pause} has been completed.
	 * This will set the {@link #animating} field again to prepare for the {@link Ext.Fx#ghost ghost}
	 * animation.
	 *
	 * @private
	 */
	onPauseComplete : function()
	{
		this.animating = true;
	},

	/**
	 * Event handler which is called when the {@link Ext.Fx#ghost ghost} animation has been
	 * completed. This will resize the {@link #container} to make sure it will only
	 * contain enough room for the visible {@link #stackedMessages messages}.
	 * @param {Ext.Element} element The element which was removed
	 * @private
	 */
	onRemoveComplete : function(element)
	{
		var newHeight = this.container.getHeight() - element.height;
		var index = this.stackedMessages.indexOf(element);

		// Technically shouldn't happen...
		if (index < 0) {
			return;
		}

		// Remove the element from stack
		this.stackedMessages.splice(index, 1);

		this.animating = false;

		if (newHeight < 0) {
			newHeight = 0;
		}

		// After cleaning up, we need to check if the parent container
		// still exists, as it might have been deleted while the element
		// was animating.
		if (!this.parentContainer.dom) {
			return;
		}

		// Don't animate the repositioning, otherwise all visible
		// messages will be bumbed above and then animated down again.
		// By not animating, the messages will remain exactly where they
		// are.
		this.updateContainer(newHeight, false);

		if (!Ext.isEmpty(this.pendingMessages)) {
			this.showNextMessage();
		}
	},
																		    
	/**
	 * Obtain the {@link Ext.Element container} in which this slider will operate.
	 * This uses the {@link #parentContainer} to find if any slider container already
	 * exists, if not, it will create one at the {@link #containerPosition}.
	 * @return {Ext.Element} The slider container
	 * @private
	 */
	getContainer : function()
	{
		var parentId = this.parentContainer.id;
		var sliderCls = this.containerCls + ' ' + this.containerCls + '-' + this.containerPosition;
		var sliderId = parentId + '-' + this.containerCls + '-' + this.containerPosition;

		var ct = Ext.DomQuery.select('#' + sliderId).shift();
		if (!ct) {
			// Insert the notifier message into the given container
			ct = Ext.DomHelper.insertFirst(this.parentContainer, { id : sliderId, cls : sliderCls }, true);

			// Set initial height to 0
			ct.setHeight(0);

			// Position the container to the correct location
			ct.alignTo(this.parentContainer, this.containerPosition);
		} else {
			ct = Ext.get(ct);
		}

		return ct;
	},

	/**
	 * Update the {@link #container} with a new height. This will recalculate the
	 * position of the {@link #container} to make sure the container remains fixed
	 * to the {@link #containerPosition.
	 *
	 * @param {Number} height The new height which must be applied to the container
	 * @param {Boolean} animate True when the resize/repositioning of the container
	 * should be animated.
	 * @private
	 */
	updateContainer : function(height, animate)
	{
		// The position of the element should be: br-br, t-t, etc, to ensure
		// that the bottom-right corner of the container is in the bottom-right
		// corner of the parentContainer.
		var position = this.containerPosition + '-' + this.containerPosition;

		// Update positioning of the container
		this.container.setHeight(height);
		this.container.alignTo(this.parentContainer, position, undefined, animate);
	}
});
