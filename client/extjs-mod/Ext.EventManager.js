/*
 * #dependsFile client/extjs-mod/Ext.js
 *
 * Override if browser is IE/Edge because IE and Edge throws a 'permission denied' exception when trying to compare a missing element (e.g. an iframe) from the 'specialElCache'
 * The element has been removed, but is prevented from being garbage collected
 * That's why a try/catch was added on line 45 so that the entire function would not fail on such occasion
 */
if(Ext.isIE || Ext.isEdge) {


	(function () {
		/**
		 * @class Ext.EventManager
		 * Registers event handlers that want to receive a normalized EventObject instead of the standard browser event and provides
		 * several useful events directly.
		 * See {@link Ext.EventObject} for more details on normalized event objects.
		 * @singleton
		 */
		Ext.apply(Ext.EventManager, function () {
			var docReadyEvent,
				docReadyProcId,
				docReadyState = false,
				DETECT_NATIVE = Ext.isGecko || Ext.isWebKit || Ext.isSafari,
				E = Ext.lib.Event,
				D = Ext.lib.Dom,
				DOC = document,
				WINDOW = window,
				DOMCONTENTLOADED = "DOMContentLoaded",
				COMPLETE = 'complete',
				propRe = /^(?:scope|delay|buffer|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate)$/,
			/*
			 * This cache is used to hold special js objects, the document and window, that don't have an id. We need to keep
			 * a reference to them so we can look them up at a later point.
			 */
				specialElCache = [];

			function getId(el) {
				var id = false,
					i = 0,
					len = specialElCache.length,
					skip = false,
					o;

				if (el) {
					if (el.getElementById || el.navigator) {
						// look up the id
						for (; i < len; ++i) {
							o = specialElCache[i];
							//entire override because of this try - otherwise IE/Edge chokes on missing elements
							try {
								if (o.el === el) {
									id = o.id;
									break;
								}
							} catch (e) {
							}
						}
						if (!id) {
							// for browsers that support it, ensure that give the el the same id
							id = Ext.id(el);
							specialElCache.push({
								id: id,
								el: el
							});
							skip = true;
						}
					} else {
						id = Ext.id(el);
					}
					if (!Ext.elCache[id]) {
						Ext.Element.addToCache(new Ext.Element(el), id);
						if (skip) {
							Ext.elCache[id].skipGC = true;
						}
					}
				}
				return id;
			}

			/// There is some jquery work around stuff here that isn't needed in Ext Core.
			function addListener(el, ename, fn, task, wrap, scope) {
				el = Ext.getDom(el);
				var id = getId(el),
					es = Ext.elCache[id].events,
					wfn;

				wfn = E.on(el, ename, wrap);
				es[ename] = es[ename] || [];

				/* 0 = Original Function,
				 1 = Event Manager Wrapped Function,
				 2 = Scope,
				 3 = Adapter Wrapped Function,
				 4 = Buffered Task
				 */
				es[ename].push([fn, wrap, scope, wfn, task]);

				// this is a workaround for jQuery and should somehow be removed from Ext Core in the future
				// without breaking ExtJS.

				// workaround for jQuery
				if (el.addEventListener && ename == "mousewheel") {
					var args = ["DOMMouseScroll", wrap, false];
					el.addEventListener.apply(el, args);
					Ext.EventManager.addListener(WINDOW, 'unload', function () {
						el.removeEventListener.apply(el, args);
					});
				}

				// fix stopped mousedowns on the document
				if (el == DOC && ename == "mousedown") {
					Ext.EventManager.stoppedMouseDownEvent.addListener(wrap);
				}
			}

			function doScrollChk() {
				/* Notes:
				 'doScroll' will NOT work in a IFRAME/FRAMESET.
				 The method succeeds but, a DOM query done immediately after -- FAILS.
				 */
				if (window != top) {
					return false;
				}

				try {
					DOC.documentElement.doScroll('left');
				} catch (e) {
					return false;
				}

				fireDocReady();
				return true;
			}

			/**
			 * @return {Boolean} True if the document is in a 'complete' state (or was determined to
			 * be true by other means). If false, the state is evaluated again until canceled.
			 */
			function checkReadyState(e) {

				if (Ext.isIE && doScrollChk()) {
					return true;
				}
				if (DOC.readyState == COMPLETE) {
					fireDocReady();
					return true;
				}
				docReadyState || (docReadyProcId = setTimeout(arguments.callee, 2));
				return false;
			}

			var styles;

			function checkStyleSheets(e) {
				styles || (styles = Ext.query('style, link[rel=stylesheet]'));
				if (styles.length == DOC.styleSheets.length) {
					fireDocReady();
					return true;
				}
				docReadyState || (docReadyProcId = setTimeout(arguments.callee, 2));
				return false;
			}

			function OperaDOMContentLoaded(e) {
				DOC.removeEventListener(DOMCONTENTLOADED, arguments.callee, false);
				checkStyleSheets();
			}

			function fireDocReady(e) {
				if (!docReadyState) {
					docReadyState = true; //only attempt listener removal once

					if (docReadyProcId) {
						clearTimeout(docReadyProcId);
					}
					if (DETECT_NATIVE) {
						DOC.removeEventListener(DOMCONTENTLOADED, fireDocReady, false);
					}
					if (Ext.isIE && checkReadyState.bindIE) {  //was this was actually set ??
						DOC.detachEvent('onreadystatechange', checkReadyState);
					}
					E.un(WINDOW, "load", arguments.callee);
				}
				if (docReadyEvent && !Ext.isReady) {
					Ext.isReady = true;
					docReadyEvent.fire();
					docReadyEvent.listeners = [];
				}

			}

			function initDocReady() {
				docReadyEvent || (docReadyEvent = new Ext.util.Event());
				if (DETECT_NATIVE) {
					DOC.addEventListener(DOMCONTENTLOADED, fireDocReady, false);
				}
				/*
				 * Handle additional (exceptional) detection strategies here
				 */
				if (Ext.isIE) {
					//Use readystatechange as a backup AND primary detection mechanism for a FRAME/IFRAME
					//See if page is already loaded
					if (!checkReadyState()) {
						checkReadyState.bindIE = true;
						DOC.attachEvent('onreadystatechange', checkReadyState);
					}

				} else if (Ext.isOpera) {
					/* Notes:
					 Opera needs special treatment needed here because CSS rules are NOT QUITE
					 available after DOMContentLoaded is raised.
					 */

					//See if page is already loaded and all styleSheets are in place
					(DOC.readyState == COMPLETE && checkStyleSheets()) ||
					DOC.addEventListener(DOMCONTENTLOADED, OperaDOMContentLoaded, false);

				} else if (Ext.isWebKit) {
					//Fallback for older Webkits without DOMCONTENTLOADED support
					checkReadyState();
				}
				// no matter what, make sure it fires on load
				E.on(WINDOW, "load", fireDocReady);
			}

			function createTargeted(h, o) {
				return function () {
					var args = Ext.toArray(arguments);
					if (o.target == Ext.EventObject.setEvent(args[0]).target) {
						h.apply(this, args);
					}
				};
			}

			function createBuffered(h, o, task) {
				return function (e) {
					// create new event object impl so new events don't wipe out properties
					task.delay(o.buffer, h, null, [new Ext.EventObjectImpl(e)]);
				};
			}

			function createSingle(h, el, ename, fn, scope) {
				return function (e) {
					Ext.EventManager.removeListener(el, ename, fn, scope);
					h(e);
				};
			}

			function createDelayed(h, o, fn) {
				return function (e) {
					var task = new Ext.util.DelayedTask(h);
					if (!fn.tasks) {
						fn.tasks = [];
					}
					fn.tasks.push(task);
					task.delay(o.delay || 10, h, null, [new Ext.EventObjectImpl(e)]);
				};
			}

			function listen(element, ename, opt, fn, scope) {
				var o = (!opt || typeof opt == "boolean") ? {} : opt,
					el = Ext.getDom(element), task;

				fn = fn || o.fn;
				scope = scope || o.scope;

				if (!el) {
					throw "Error listening for \"" + ename + '\". Element "' + element + '" doesn\'t exist.';
				}
				function h(e) {
					// prevent errors while unload occurring
					if (!Ext) {// !window[xname]){  ==> can't we do this?
						return;
					}
					e = Ext.EventObject.setEvent(e);
					var t;
					if (o.delegate) {
						if (!(t = e.getTarget(o.delegate, el))) {
							return;
						}
					} else {
						t = e.target;
					}
					if (o.stopEvent) {
						e.stopEvent();
					}
					if (o.preventDefault) {
						e.preventDefault();
					}
					if (o.stopPropagation) {
						e.stopPropagation();
					}
					if (o.normalized === false) {
						e = e.browserEvent;
					}

					fn.call(scope || el, e, t, o);
				}

				if (o.target) {
					h = createTargeted(h, o);
				}
				if (o.delay) {
					h = createDelayed(h, o, fn);
				}
				if (o.single) {
					h = createSingle(h, el, ename, fn, scope);
				}
				if (o.buffer) {
					task = new Ext.util.DelayedTask(h);
					h = createBuffered(h, o, task);
				}

				addListener(el, ename, fn, task, h, scope);
				return h;
			}

			var pub = {
				/**
				 * Appends an event handler to an element.  The shorthand version {@link #on} is equivalent.  Typically you will
				 * use {@link Ext.Element#addListener} directly on an Element in favor of calling this version.
				 * @param {String/HTMLElement} el The html element or id to assign the event handler to.
				 * @param {String} eventName The name of the event to listen for.
				 * @param {Function} handler The handler function the event invokes. This function is passed
				 * the following parameters:<ul>
				 * <li>evt : EventObject<div class="sub-desc">The {@link Ext.EventObject EventObject} describing the event.</div></li>
				 * <li>t : Element<div class="sub-desc">The {@link Ext.Element Element} which was the target of the event.
				 * Note that this may be filtered by using the <tt>delegate</tt> option.</div></li>
				 * <li>o : Object<div class="sub-desc">The options object from the addListener call.</div></li>
				 * </ul>
				 * @param {Object} scope (optional) The scope (<b><code>this</code></b> reference) in which the handler function is executed. <b>Defaults to the Element</b>.
				 * @param {Object} options (optional) An object containing handler configuration properties.
				 * This may contain any of the following properties:<ul>
				 * <li>scope : Object<div class="sub-desc">The scope (<b><code>this</code></b> reference) in which the handler function is executed. <b>Defaults to the Element</b>.</div></li>
				 * <li>delegate : String<div class="sub-desc">A simple selector to filter the target or look for a descendant of the target</div></li>
				 * <li>stopEvent : Boolean<div class="sub-desc">True to stop the event. That is stop propagation, and prevent the default action.</div></li>
				 * <li>preventDefault : Boolean<div class="sub-desc">True to prevent the default action</div></li>
				 * <li>stopPropagation : Boolean<div class="sub-desc">True to prevent event propagation</div></li>
				 * <li>normalized : Boolean<div class="sub-desc">False to pass a browser event to the handler function instead of an Ext.EventObject</div></li>
				 * <li>delay : Number<div class="sub-desc">The number of milliseconds to delay the invocation of the handler after te event fires.</div></li>
				 * <li>single : Boolean<div class="sub-desc">True to add a handler to handle just the next firing of the event, and then remove itself.</div></li>
				 * <li>buffer : Number<div class="sub-desc">Causes the handler to be scheduled to run in an {@link Ext.util.DelayedTask} delayed
				 * by the specified number of milliseconds. If the event fires again within that time, the original
				 * handler is <em>not</em> invoked, but the new handler is scheduled in its place.</div></li>
				 * <li>target : Element<div class="sub-desc">Only call the handler if the event was fired on the target Element, <i>not</i> if the event was bubbled up from a child node.</div></li>
				 * </ul><br>
				 * <p>See {@link Ext.Element#addListener} for examples of how to use these options.</p>
				 */
				addListener: function (element, eventName, fn, scope, options) {
					if (typeof eventName == 'object') {
						var o = eventName, e, val;
						for (e in o) {
							val = o[e];
							if (!propRe.test(e)) {
								if (Ext.isFunction(val)) {
									// shared options
									listen(element, e, o, val, o.scope);
								} else {
									// individual options
									listen(element, e, val);
								}
							}
						}
					} else {
						listen(element, eventName, options, fn, scope);
					}
				},
				/**
				 * Removes an event handler from an element.  The shorthand version {@link #un} is equivalent.  Typically
				 * you will use {@link Ext.Element#removeListener} directly on an Element in favor of calling this version.
				 * @param {String/HTMLElement} el The id or html element from which to remove the listener.
				 * @param {String} eventName The name of the event.
				 * @param {Function} fn The handler function to remove. <b>This must be a reference to the function passed into the {@link #addListener} call.</b>
				 * @param {Object} scope If a scope (<b><code>this</code></b> reference) was specified when the listener was added,
				 * then this must refer to the same object.
				 */
				removeListener: function (el, eventName, fn, scope) {
					el = Ext.getDom(el);
					var id = getId(el),
						f = el && (Ext.elCache[id].events)[eventName] || [],
						wrap, i, l, k, len, fnc;

					for (i = 0, len = f.length; i < len; i++) {

						/* 0 = Original Function,
						 1 = Event Manager Wrapped Function,
						 2 = Scope,
						 3 = Adapter Wrapped Function,
						 4 = Buffered Task
						 */
						if (Ext.isArray(fnc = f[i]) && fnc[0] == fn && (!scope || fnc[2] == scope)) {
							if (fnc[4]) {
								fnc[4].cancel();
							}
							k = fn.tasks && fn.tasks.length;
							if (k) {
								while (k--) {
									fn.tasks[k].cancel();
								}
								delete fn.tasks;
							}
							wrap = fnc[1];
							E.un(el, eventName, E.extAdapter ? fnc[3] : wrap);

							// jQuery workaround that should be removed from Ext Core
							if (wrap && el.addEventListener && eventName == "mousewheel") {
								el.removeEventListener("DOMMouseScroll", wrap, false);
							}

							// fix stopped mousedowns on the document
							if (wrap && el == DOC && eventName == "mousedown") {
								Ext.EventManager.stoppedMouseDownEvent.removeListener(wrap);
							}

							f.splice(i, 1);
							if (f.length === 0) {
								delete Ext.elCache[id].events[eventName];
							}
							for (k in Ext.elCache[id].events) {
								return false;
							}
							Ext.elCache[id].events = {};
							return false;
						}
					}
				},

				/**
				 * Removes all event handers from an element.  Typically you will use {@link Ext.Element#removeAllListeners}
				 * directly on an Element in favor of calling this version.
				 * @param {String/HTMLElement} el The id or html element from which to remove all event handlers.
				 */
				removeAll: function (el) {
					el = Ext.getDom(el);
					var id = getId(el),
						ec = Ext.elCache[id] || {},
						es = ec.events || {},
						f, i, len, ename, fn, k, wrap;

					for (ename in es) {
						if (es.hasOwnProperty(ename)) {
							f = es[ename];
							/* 0 = Original Function,
							 1 = Event Manager Wrapped Function,
							 2 = Scope,
							 3 = Adapter Wrapped Function,
							 4 = Buffered Task
							 */
							for (i = 0, len = f.length; i < len; i++) {
								fn = f[i];
								if (fn[4]) {
									fn[4].cancel();
								}
								if (fn[0].tasks && (k = fn[0].tasks.length)) {
									while (k--) {
										fn[0].tasks[k].cancel();
									}
									delete fn.tasks;
								}
								wrap = fn[1];
								E.un(el, ename, E.extAdapter ? fn[3] : wrap);

								// jQuery workaround that should be removed from Ext Core
								if (el.addEventListener && wrap && ename == "mousewheel") {
									el.removeEventListener("DOMMouseScroll", wrap, false);
								}

								// fix stopped mousedowns on the document
								if (wrap && el == DOC && ename == "mousedown") {
									Ext.EventManager.stoppedMouseDownEvent.removeListener(wrap);
								}
							}
						}
					}
					if (Ext.elCache[id]) {
						Ext.elCache[id].events = {};
					}
				},

				getListeners: function (el, eventName) {
					el = Ext.getDom(el);
					var id = getId(el),
						ec = Ext.elCache[id] || {},
						es = ec.events || {},
						results = [];
					if (es && es[eventName]) {
						return es[eventName];
					} else {
						return null;
					}
				},

				purgeElement: function (el, recurse, eventName) {
					el = Ext.getDom(el);
					var id = getId(el),
						ec = Ext.elCache[id] || {},
						es = ec.events || {},
						i, f, len;
					if (eventName) {
						if (es && es.hasOwnProperty(eventName)) {
							f = es[eventName];
							for (i = 0, len = f.length; i < len; i++) {
								Ext.EventManager.removeListener(el, eventName, f[i][0]);
							}
						}
					} else {
						Ext.EventManager.removeAll(el);
					}
					if (recurse && el && el.childNodes) {
						for (i = 0, len = el.childNodes.length; i < len; i++) {
							Ext.EventManager.purgeElement(el.childNodes[i], recurse, eventName);
						}
					}
				},
				_unload: function () {
					var el;
					for (el in Ext.elCache) {
						Ext.EventManager.removeAll(el);
					}
					delete Ext.elCache;
					delete Ext.Element._flyweights;

					// Abort any outstanding Ajax requests
					var c,
						conn,
						tid,
						ajax = Ext.lib.Ajax;
					(typeof ajax.conn == 'object') ? conn = ajax.conn : conn = {};
					for (tid in conn) {
						c = conn[tid];
						if (c) {
							ajax.abort({conn: c, tId: tid});
						}
					}
				},
				/**
				 * Adds a listener to be notified when the document is ready (before onload and before images are loaded). Can be
				 * accessed shorthanded as Ext.onReady().
				 * @param {Function} fn The method the event invokes.
				 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the handler function executes. Defaults to the browser window.
				 * @param {boolean} options (optional) Options object as passed to {@link Ext.Element#addListener}. It is recommended that the options
				 * <code>{single: true}</code> be used so that the handler is removed on first invocation.
				 */
				onDocumentReady: function (fn, scope, options) {
					if (Ext.isReady) { // if it already fired or document.body is present
						docReadyEvent || (docReadyEvent = new Ext.util.Event());
						docReadyEvent.addListener(fn, scope, options);
						docReadyEvent.fire();
						docReadyEvent.listeners = [];
					} else {
						if (!docReadyEvent) {
							initDocReady();
						}
						options = options || {};
						options.delay = options.delay || 1;
						docReadyEvent.addListener(fn, scope, options);
					}
				},

				/**
				 * Forces a document ready state transition for the framework.  Used when Ext is loaded
				 * into a DOM structure AFTER initial page load (Google API or other dynamic load scenario.
				 * Any pending 'onDocumentReady' handlers will be fired (if not already handled).
				 */
				fireDocReady: fireDocReady
			};
			pub.on = pub.addListener;
			pub.un = pub.removeListener;
			pub.stoppedMouseDownEvent = new Ext.util.Event();

			return pub;
		}());
	})();
}