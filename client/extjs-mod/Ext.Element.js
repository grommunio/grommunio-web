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
		},

		/**
		 * Gets the x,y coordinates to align this element with another element. See {@link #alignTo} for more info on the
		 * supported position values.
		 * @param {Mixed} element The element to align to.
		 * @param {String} position (optional, defaults to "tl-bl?") The position to align to.
		 * @param {Array} offsets (optional) Offset the positioning by [x, y]
		 * @return {Array} [x, y]
		 */
		getAlignToXY : function(el, p, o){
			el = Ext.get(el);

			if(!el || !el.dom){
				throw "Element.alignToXY with an element that doesn't exist";
			}

			o = o || [0,0];
			p = (!p || p == "?" ? "tl-bl?" : (!(/-/).test(p) && p !== "" ? "tl-" + p : p || "tl-bl")).toLowerCase();
			// Get document belongs to respective browser window to calculate positions of menu to prevent the overflow
			var browserWindow = Zarafa.core.BrowserWindowMgr.getOwnerWindow(el);
			var me = this,
					d = me.dom,
					a1,
					a2,
					x,
					y,
			//constrain the aligned el to viewport if necessary
					w,
					h,
					r,
					dw = browserWindow.innerWidth -10, // 10px of margin for ie
					dh = browserWindow.innerHeight - 10, // 10px of margin for ie
					p1y,
					p1x,
					p2y,
					p2x,
					swapY,
					swapX,
					doc = browserWindow.document,
					docElement = doc.documentElement,
					docBody = doc.body,
					scrollX = (docElement.scrollLeft || docBody.scrollLeft || 0)+5,
					scrollY = (docElement.scrollTop || docBody.scrollTop || 0)+5,
					c = false, //constrain to viewport
					p1 = "",
					p2 = "",
					m = p.match(/^([a-z]+)-([a-z]+)(\?)?$/);

			if(!m){
				throw "Element.alignTo with an invalid alignment " + p;
			}

			p1 = m[1];
			p2 = m[2];
			c = !!m[3];

			//Subtract the aligned el's internal xy from the target's offset xy
			//plus custom offset to get the aligned el's new offset xy
			a1 = me.getAnchorXY(p1, true);
			a2 = el.getAnchorXY(p2, false);

			x = a2[0] - a1[0] + o[0];
			y = a2[1] - a1[1] + o[1];

			if(c){
				w = me.getWidth();
				h = me.getHeight();
				r = el.getRegion();
				//If we are at a viewport boundary and the aligned el is anchored on a target border that is
				//perpendicular to the vp border, allow the aligned el to slide on that border,
				//otherwise swap the aligned el to the opposite border of the target.
				p1y = p1.charAt(0);
				p1x = p1.charAt(p1.length-1);
				p2y = p2.charAt(0);
				p2x = p2.charAt(p2.length-1);
				swapY = ((p1y=="t" && p2y=="b") || (p1y=="b" && p2y=="t"));
				swapX = ((p1x=="r" && p2x=="l") || (p1x=="l" && p2x=="r"));


				if (x + w > dw + scrollX) {
					x = swapX ? r.left-w : dw+scrollX-w;
				}
				if (x < scrollX) {
					x = swapX ? r.right : scrollX;
				}
				if (y + h > dh + scrollY) {
					y = swapY ? r.top-h : dh+scrollY-h;
				}
				if (y < scrollY){
					y = swapY ? r.bottom : scrollY;
				}
			}
			return [x,y];
		},

		// private ==>  used outside of core
		adjustForConstraints : function(xy, parent, offsets){
			// Using currently active browser window in case if parent is undefined
			var browserWindow = Zarafa.core.BrowserWindowMgr.getActive();
			return this.getConstrainToXY(parent || browserWindow.document, false, offsets, xy) ||  xy;
		},

		// private ==>  used outside of core
		getConstrainToXY : function(el, local, offsets, proposedXY){
			var os = {top:0, left:0, bottom:0, right: 0};

			return function(el, local, offsets, proposedXY){
				// Using currently active browser window for size and position related calculations
				var browserWindow = Zarafa.core.BrowserWindowMgr.getActive();
				el = Ext.get(el);
				offsets = offsets ? Ext.applyIf(offsets, os) : os;

				var vw, vh, vx = 0, vy = 0;
				if(el.dom == browserWindow.document.body || el.dom == browserWindow.document){
					vw = browserWindow.innerWidth;
					vh = browserWindow.innerHeight;
				}else{
					vw = el.dom.clientWidth;
					vh = el.dom.clientHeight;
					if(!local){
						var vxy = el.getXY();
						vx = vxy[0];
						vy = vxy[1];
					}
				}

				var s = el.getScroll();

				vx += offsets.left + s.left ? s.left : 0;
				vy += offsets.top + s.top ? s.top : 0 ;

				vw -= offsets.right ? offsets.right : 0;
				vh -= offsets.bottom ? offsets.bottom : 0;

				var vr = vx + vw,
						vb = vy + vh,
						xy = proposedXY || (!local ? this.getXY() : [this.getLeft(true), this.getTop(true)]),
						x = xy[0], y = xy[1],
						offset = this.getConstrainOffset(),
						w = this.dom.offsetWidth + offset,
						h = this.dom.offsetHeight + offset;

				// only move it if it needs it
				var moved = false;

				// first validate right/bottom
				if((x + w) > vr){
					x = vr - w;
					moved = true;
				}
				if((y + h) > vb){
					y = vb - h;
					moved = true;
				}
				// then make sure top/left isn't negative
				if(x < vx){
					x = vx;
					moved = true;
				}
				if(y < vy){
					y = vy;
					moved = true;
				}
				return moved ? [x, y] : false;
			};
		}()
	});

	var orig_get = Ext.Element.get;

	Ext.override(Ext.Element, {
		/**
		 * Override get to consider the active browser window while retrieving {@link Ext.Element} objects from the given HTMLElement.
		 * @param {HTMLElement} el The HTMLElement which needs to be wrapped into {@link Ext.Element}
		 * @return {Ext.Element} The Element object (or null if no matching element was found)
		 */
		get : function(el) {
			var getResult = null;
			var activeBrowserWindow = Zarafa.core.BrowserWindowMgr.getActive();

			// First, find the element in active browser window if the active window is not the main webapp window
			if (Ext.isDefined(activeBrowserWindow) && activeBrowserWindow.name !== 'mainBrowserWindow' && typeof el === "string") {
				var respectiveElement = activeBrowserWindow.document.getElementById(el);
				// Wrap the element only if it is found
				getResult = respectiveElement ? new Ext.Element(respectiveElement) : respectiveElement;
			}

			// Find the element in webapp main window
			if(getResult === null) {
				getResult = orig_get.apply(this, arguments);
			}

			// If the element is still not found, Try to find the same in all the available browser windows
			if (getResult === null && typeof el === "string") {
				var browserWindows = Zarafa.core.BrowserWindowMgr.browserWindows;
				browserWindows.each(function(browserWindow){
					if(Ext.isDefined(browserWindow) && browserWindow.name !== 'mainBrowserWindow' && browserWindow !== activeBrowserWindow) {
						getResult = new Ext.Element(browserWindow.document.getElementById(el));
						return;
					}
				});
			} else {
				var browserWindows = Zarafa.core.BrowserWindowMgr.browserWindows;
				if(Ext.isDefined(browserWindows)) {
					browserWindows.each(function(browserWindow) {
						if(browserWindow.document === el) {
							// create a bogus element object representing the document object
							var f = function(){};
							f.prototype = Ext.Element.prototype;
							getResult = new f();
							getResult.dom = browserWindow.document;
							return;
						}
					});
				}
			}

			return getResult;
		}
	});

	// Expose overridden method to Ext global object
	Ext.get = Ext.Element.prototype.get;


	// Overriding this method because 
	// While mousedown event handler call it will get XY posstion of clickable area 
	// and then it will get style of particular posstion.
	// So, getStyle method will use active browser window instead of main window.
	Ext.Element.addMethods(function() {
		// local style camelizing for speed
		var supports = Ext.supports,
			propCache = {},
			camelRe = /(-[a-z])/gi,
			view = document.defaultView,
			opacityRe = /alpha\(opacity=(.*)\)/i;

		// private
		function camelFn(m, a) {
			return a.charAt(1).toUpperCase();
		}

		function chkCache(prop) {
			return propCache[prop] || (propCache[prop] = prop == 'float' ? (supports.cssFloat ? 'cssFloat' : 'styleFloat') : prop.replace(camelRe, camelFn));
		}

		return {
			/**
			 * Normalizes currentStyle and computedStyle.
			 * @param {String} property The style property whose value is returned.
			 * @return {String} The current value of the style property for this element.
			 */
			getStyle: function () {
				return view && view.getComputedStyle ?
						function (prop) {
							var el = this.dom,
									v,
									cs,
									out,
									display;

							if (el == Zarafa.core.BrowserWindowMgr.getActive().document) {
								return null;
							}
							prop = chkCache(prop);
							out = (v = el.style[prop]) ? v :
									(cs = view.getComputedStyle(el, "")) ? cs[prop] : null;

							// Ignore cases when the margin is correctly reported as 0, the bug only shows
							// numbers larger.
							if (prop == 'marginRight' && out != '0px' && !supports.correctRightMargin) {
								display = el.style.display;
								el.style.display = 'inline-block';
								out = view.getComputedStyle(el, '').marginRight;
								el.style.display = display;
							}

							if (prop == 'backgroundColor' && out == 'rgba(0, 0, 0, 0)' && !supports.correctTransparentColor) {
								out = 'transparent';
							}
							return out;
						} :
						function (prop) {
							var el = this.dom,
									m,
									cs;

							if (el == document) return null;
							if (prop == 'opacity') {
								if (el.style.filter.match) {
									if (m = el.style.filter.match(opacityRe)) {
										var fv = parseFloat(m[1]);
										if (!isNaN(fv)) {
											return fv ? fv / 100 : 0;
										}
									}
								}
								return 1;
							}
							prop = chkCache(prop);
							return el.style[prop] || ((cs = el.currentStyle) ? cs[prop] : null);
						};
			}(),

			/**
			 * Wrapper for setting style properties, also takes single object parameter of multiple styles.
			 * @param {String/Object} property The style property to be set, or an object of multiple styles.
			 * @param {String} value (optional) The value to apply to the given property, or null if an object was passed.
			 * @return {Ext.Element} this
			 */
			setStyle: function (prop, value) {
				var tmp, style;

				if (typeof prop != 'object') {
					tmp = {};
					tmp[prop] = value;
					prop = tmp;
				}
				for (style in prop) {
					value = prop[style];
					style == 'opacity' ?
							this.setOpacity(value) :
							this.dom.style[chkCache(style)] = value;
				}
				return this;
			}
		}
	}());
})();
