(function() {
	/**
	 * @class Ext.Element
	 * <p>Encapsulates a DOM element, adding simple DOM manipulation facilities, normalizing for browser differences.</p>
	 * <p>All instances of this class inherit the methods of {@link Ext.Fx} making visual effects easily available to all DOM elements.</p>
	 * <p>Note that the events documented in this class are not Ext events, they encapsulate browser events. To
	 * access the underlying browser event, see {@link Ext.EventObject#browserEvent}. Some older
	 * browsers may not support the full range of events. Which events are supported is beyond the control of ExtJs.</p>
	 * Usage:<br>
	<pre><code>
	// by id
	var el = Ext.get('my-div');

	// by DOM element reference
	var el = Ext.get(myDivElement);
	</code></pre>
	 * <b>Animations</b><br />
	 * <p>When an element is manipulated, by default there is no animation.</p>
	 * <pre><code>
	var el = Ext.get('my-div');

	// no animation
	el.setWidth(100);
	 * </code></pre>
	 * <p>Many of the functions for manipulating an element have an optional 'animate' parameter.  This
	 * parameter can be specified as boolean (<tt>true</tt>) for default animation effects.</p>
	 * <pre><code>
	// default animation
	el.setWidth(100, true);
	 * </code></pre>
	 *
	 * <p>To configure the effects, an object literal with animation options to use as the Element animation
	 * configuration object can also be specified. Note that the supported Element animation configuration
	 * options are a subset of the {@link Ext.Fx} animation options specific to Fx effects.  The supported
	 * Element animation configuration options are:</p>
	<pre>
	Option    Default   Description
	--------- --------  ---------------------------------------------
	{@link Ext.Fx#duration duration}  .35       The duration of the animation in seconds
	{@link Ext.Fx#easing easing}    easeOut   The easing method
	{@link Ext.Fx#callback callback}  none      A function to execute when the anim completes
	{@link Ext.Fx#scope scope}     this      The scope (this) of the callback function
	</pre>
	 *
	 * <pre><code>
	// Element animation options object
	var opt = {
		{@link Ext.Fx#duration duration}: 1,
		{@link Ext.Fx#easing easing}: 'elasticIn',
		{@link Ext.Fx#callback callback}: this.foo,
		{@link Ext.Fx#scope scope}: this
	};
	// animation with some options set
	el.setWidth(100, opt);
	 * </code></pre>
	 * <p>The Element animation object being used for the animation will be set on the options
	 * object as 'anim', which allows you to stop or manipulate the animation. Here is an example:</p>
	 * <pre><code>
	// using the 'anim' property to get the Anim object
	if(opt.anim.isAnimated()){
		opt.anim.stop();
	}
	 * </code></pre>
	 * <p>Also see the <tt>{@link #animate}</tt> method for another animation technique.</p>
	 * <p><b> Composite (Collections of) Elements</b></p>
	 * <p>For working with collections of Elements, see {@link Ext.CompositeElement}</p>
	 * @constructor Create a new Element directly.
	 * @param {String/HTMLElement} element
	 * @param {Boolean} forceNew (optional) By default the constructor checks to see if there is already an instance of this element in the cache and if there is it returns the same instance. This will skip that check (useful for extending this class).
	 */
	Ext.Element.addMethods({

		/**
		 * Test if size has a unit, otherwise appends the default
		 *
		 * FIX: Overridden Ext.Element to fix an issue that calling
		 * Element.addUnits(0/0) would return the string 'NaNpx'
		 * instead we return an empty string (which ExtJs already
		 * did when size was an empty string or undefined.
		 *
		 * @param {String} size The size where the units will be postfixed
		 * @return {String} The size plus the optional size unit postfixed
		 * @private
		 */
		addUnits : function(size)
		{
			if (Ext.isEmpty(size) || size == 'auto') {
				size = size || '';
			} else if (isNaN(size)) {
				size = '';
			} else if (!/\d+(px|em|%|en|ex|pt|in|cm|mm|pc)$/i.test(size)) {
				size = size + (this.defaultUnit || 'px');
			}

			return size;
		},

		/**
		 * Stops the specified event(s) from bubbling and optionally prevents the default action
		 * @param {String/Array} eventName an event / array of events to stop from bubbling
		 * @param {Boolean} preventDefault (optional) true to prevent the default action too
		 * @return {Ext.Element} this
		 * @override
		 */
		swallowEvent : function(eventName, preventDefault)
		{
			var me = this;
			var fn = (preventDefault === true) ? this.swallowEventHandlerPreventDefault : this.swallowEventHandler;

			if(Ext.isArray(eventName)){
				Ext.each(eventName, function(e) {
					me.on(e, fn, this);
				});
				return me;
			}
			me.on(eventName, fn, this);
			return me;
		},

		/**
		 * Event handler for {@link #swallowEvent} which is used
		 * to swallow a particular event. This will only call
		 * {@link Ext.EventObject#stopPropagation}. For preventing
		 * the {@link Ext.EventObject#preventDefault} then
		 * {@link #swallowEventHandlerPreventDefault} should be used instead.
		 * @param {Ext.EventObject} e The event object
		 * @private
		 */
		swallowEventHandler : function(e)
		{
			e.stopPropagation();
		},

		/**
		 * Event handler for {@link #swallowEvent} which is used
		 * to swallow a particular event. This will call
		 * {@link Ext.EventObject#stopPropagation} and
		 * {@link Ext.EventObject#preventDefault}. If the latter
		 * call is unwanted, the {@link #swallowEventHandler} should be
		 * used instead.
		 * @param {Ext.EventObject} e The event object
		 * @private
		 */
		swallowEventHandlerPreventDefault : function(e)
		{
			e.stopPropagation();
			e.preventDefault();
		},

		/**
		 * Opposite of {@link #swallowEvent}, this will re-enable the
		 * given event (or events).
		 * @param {String/Array} eventName an event / array of events to start bubbling
		 * @param {Boolean} preventDefault (optional) true if the default action was also prevented
		 * @return {Ext.Element} this
		 */
		spitOutEvent : function(eventName, preventDefault)
		{
			var me = this;
			var fn = (preventDefault === true) ? this.swallowEventHandlerPreventDefault : this.swallowEventHandler;
			if(Ext.isArray(eventName)){
				Ext.each(eventName, function(e) {
					me.un(e, fn, this);
				});
				return me;
			}
			me.un(eventName, fn, this);
			return me;
		},

		/**
		 * Opposite of {@link #unselectable}, enables text selection for this element (normalized across browsers)
		 * @return {Ext.Element} this
		 */
		selectable : function()
		{
			this.dom.unselectable = 'off';
			return this.spitOutEvent('selectstart', true).
					removeClass('x-unselectable');
		},

		/**
		 * Clear all CSS classes which were applied to the DOM tree
		 */
		clearClass : function()
		{
			this.dom.className = '';
		},

		/**
		 * Fires specified event for {@link Ext.Element element}.
		 * @param {String} e The event name
		 */
		fireEvent : function(eventName)
		{
			var HTMLEvts = /^(scroll|resize|load|unload|abort|error)$/,
				mouseEvts = /^(click|dblclick|mousedown|mouseup|mouseover|mouseout|contextmenu)$/,
				UIEvts = /^(focus|blur|select|change|reset|keypress|keydown|keyup)$/,
				onPref = /^on/;

			eventName = eventName.toLowerCase();
			eventName.replace(onPref, '');
			var evt;
			if (mouseEvts.test(eventName)) {
				var b = this.getBox(),
					x = b.x + b.width / 2,
					y = b.y + b.height / 2;
				evt = document.createEvent("MouseEvents");
				evt.initMouseEvent(eventName, true, true, window, (eventName=='dblclick')?2:1, x, y, x, y, false, false, false, false, 0, null);
			} else if (UIEvts.test(eventName)) {
				evt = document.createEvent("UIEvents");
				evt.initUIEvent(eventName, true, true, window, 0);
			} else if (HTMLEvts.test(eventName)) {
				evt = document.createEvent("HTMLEvents");
				evt.initEvent(eventName, true, true);
			}
			if (evt) {
				this.dom.dispatchEvent(evt);
			}
		}
	});
})();
