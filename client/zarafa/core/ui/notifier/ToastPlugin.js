Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.ToastPlugin
 * @extends Zarafa.core.ui.notifier.NotifyPlugin
 *
 * Modern toast notification plugin that displays non-intrusive notifications
 * at the bottom-center of the screen. Replaces the legacy PopupBox, DropdownBox,
 * and MessageBox notification plugins with a unified, modern design.
 *
 * Features:
 * - Bottom-center positioning with upward stacking
 * - CSS-driven slide-up/fade animations
 * - Color-coded severity indicators (info, warning, error)
 * - Auto-dismiss with visual progress countdown
 * - Persistent mode for errors/warnings requiring user acknowledgment
 * - Expandable details section for error diagnostics
 */
Zarafa.core.ui.notifier.ToastPlugin = Ext.extend(Zarafa.core.ui.notifier.NotifyPlugin, {
	/**
	 * The container element that holds all toast notifications.
	 * @property
	 * @type HTMLElement
	 * @private
	 */
	toastContainer: undefined,

	/**
	 * @cfg {Number} infoLifetime Auto-dismiss time in ms for info toasts.
	 */
	infoLifetime: 5000,

	/**
	 * @cfg {Number} warningLifetime Auto-dismiss time in ms for warning toasts.
	 */
	warningLifetime: 8000,

	/**
	 * Active toast references keyed by their DOM id, for update/destroy lookups.
	 * @property
	 * @type Object
	 * @private
	 */
	activeToasts: undefined,

	/**
	 * Counter for generating unique toast IDs.
	 * @property
	 * @type Number
	 * @private
	 */
	idCounter: 0,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Zarafa.core.ui.notifier.ToastPlugin.superclass.constructor.call(this, config);
		this.activeToasts = {};
	},

	/**
	 * Ensure the toast container element exists in the DOM.
	 * Creates it on first call, appended to document.body.
	 * @return {HTMLElement} The toast container element
	 * @private
	 */
	ensureContainer: function()
	{
		if (!this.toastContainer || !document.body.contains(this.toastContainer)) {
			this.toastContainer = document.createElement('div');
			this.toastContainer.id = 'grommunio-toast-container';
			this.toastContainer.className = 'grommunio-toast-container';
			this.toastContainer.setAttribute('aria-live', 'polite');
			this.toastContainer.setAttribute('aria-atomic', 'false');
			this.toastContainer.setAttribute('role', 'status');
			document.body.appendChild(this.toastContainer);
		}
		return this.toastContainer;
	},

	/**
	 * Determine the severity class from the notification category.
	 * @param {String} category The notification category
	 * @return {String} One of 'info', 'warning', 'error'
	 * @private
	 */
	getSeverity: function(category)
	{
		if (category.indexOf('error') === 0) {
			return 'error';
		} else if (category.indexOf('warning') === 0) {
			return 'warning';
		}
		return 'info';
	},

	/**
	 * Get the SVG icon markup for the given severity.
	 * @param {String} severity One of 'info', 'warning', 'error'
	 * @return {String} SVG markup
	 * @private
	 */
	getIconSvg: function(severity)
	{
		switch (severity) {
			case 'error':
				return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
					'<circle cx="12" cy="12" r="10"/>' +
					'<line x1="15" y1="9" x2="9" y2="15"/>' +
					'<line x1="9" y1="9" x2="15" y2="15"/>' +
					'</svg>';
			case 'warning':
				return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
					'<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>' +
					'<line x1="12" y1="9" x2="12" y2="13"/>' +
					'<line x1="12" y1="17" x2="12.01" y2="17"/>' +
					'</svg>';
			default:
				return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
					'<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>' +
					'<polyline points="22 4 12 14.01 9 11.01"/>' +
					'</svg>';
		}
	},

	/**
	 * Build the toast DOM element.
	 * @param {String} severity The severity level
	 * @param {String} title The notification title
	 * @param {String} message The notification message
	 * @param {Object} config The notification config
	 * @return {HTMLElement} The toast element
	 * @private
	 */
	buildToastElement: function(severity, title, message, config)
	{
		var toast = document.createElement('div');
		var toastId = 'grommunio-toast-' + (++this.idCounter);
		toast.id = toastId;
		toast.className = 'grommunio-toast grommunio-toast-' + severity;
		toast.setAttribute('role', severity === 'error' ? 'alert' : 'status');
		toast.setAttribute('aria-live', severity === 'error' ? 'assertive' : 'polite');

		var isPersistent = config.persistent || severity === 'error';
		var lifetime = isPersistent ? 0 : (severity === 'warning' ? this.warningLifetime : this.infoLifetime);

		var html = '<div class="grommunio-toast-accent" aria-hidden="true"></div>' +
			'<div class="grommunio-toast-icon" aria-hidden="true">' + this.getIconSvg(severity) + '</div>' +
			'<div class="grommunio-toast-body">';

		if (title) {
			html += '<div class="grommunio-toast-title"></div>';
		}
		if (message) {
			html += '<div class="grommunio-toast-message"></div>';
		}

		if (config.details_message) {
			html += '<div class="grommunio-toast-details-toggle" role="button" tabindex="0" aria-expanded="false" aria-controls="' + toastId + '-details">' + _('Show Details') + '</div>' +
				'<div class="grommunio-toast-details" style="display:none;" id="' + toastId + '-details">' +
					'<pre class="grommunio-toast-details-text">' + Ext.util.Format.htmlEncode(config.details_message) + '</pre>' +
					'<div class="grommunio-toast-details-copy" role="button" tabindex="0" aria-label="' + _('Copy Details') + '">' + _('Copy Details') + '</div>' +
				'</div>';
		}

		html += '</div>' +
			'<div class="grommunio-toast-close" role="button" tabindex="0" aria-label="' + _('Close') + '">&times;</div>';

		if (lifetime > 0) {
			html += '<div class="grommunio-toast-progress" aria-hidden="true"><div class="grommunio-toast-progress-bar" style="animation-duration:' + lifetime + 'ms;"></div></div>';
		}

		toast.innerHTML = html;

		var titleEl = toast.querySelector('.grommunio-toast-title');
		if (titleEl && title) {
			titleEl.textContent = title;
		}
		var msgEl = toast.querySelector('.grommunio-toast-message');
		if (msgEl && message) {
			msgEl.textContent = message;
		}

		toast._toastId = toastId;
		toast._lifetime = lifetime;
		toast._severity = severity;

		return toast;
	},

	/**
	 * Attach event listeners to a toast element.
	 * @param {HTMLElement} toast The toast element
	 * @param {Object} config The notification config
	 * @private
	 */
	bindToastEvents: function(toast, config)
	{
		var self = this;
		var toastId = toast._toastId;

		// Close button
		var closeBtn = toast.querySelector('.grommunio-toast-close');
		if (closeBtn) {
			closeBtn.addEventListener('click', function(e) {
				e.stopPropagation();
				self.dismissToast(toastId);
			});
			closeBtn.addEventListener('keydown', function(e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					e.stopPropagation();
					self.dismissToast(toastId);
				}
			});
		}

		// Details toggle
		var detailsToggle = toast.querySelector('.grommunio-toast-details-toggle');
		if (detailsToggle) {
			var toggleDetails = function(e) {
				e.stopPropagation();
				var details = toast.querySelector('.grommunio-toast-details');
				if (details) {
					var isHidden = details.style.display === 'none';
					details.style.display = isHidden ? 'block' : 'none';
					detailsToggle.textContent = isHidden ? _('Hide Details') : _('Show Details');
					detailsToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
				}
			};
			detailsToggle.addEventListener('click', toggleDetails);
			detailsToggle.addEventListener('keydown', function(e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					toggleDetails(e);
				}
			});
		}

		// Copy details
		var copyBtn = toast.querySelector('.grommunio-toast-details-copy');
		if (copyBtn) {
			var copyDetails = function(e) {
				e.stopPropagation();
				var text = toast.querySelector('.grommunio-toast-details-text');
				if (text) {
					Zarafa.core.Util.copyToClipboard(text.textContent);
					copyBtn.textContent = _('Copied!');
					setTimeout(function() {
						copyBtn.textContent = _('Copy Details');
					}, 2000);
				}
			};
			copyBtn.addEventListener('click', copyDetails);
			copyBtn.addEventListener('keydown', function(e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					copyDetails(e);
				}
			});
		}

		// Click on toast body to dismiss non-persistent toasts
		if (toast._lifetime > 0) {
			toast.addEventListener('click', function() {
				self.dismissToast(toastId);
			});
		}

		// Pause auto-dismiss on hover (both JS timeout and CSS animation)
		if (toast._lifetime > 0) {
			toast.addEventListener('mouseenter', function() {
				if (toast._dismissTimer) {
					clearTimeout(toast._dismissTimer);
					toast._dismissTimer = null;
				}
				// Store remaining time based on progress bar state
				var bar = toast.querySelector('.grommunio-toast-progress-bar');
				if (bar) {
					var computed = window.getComputedStyle(bar);
					var transform = computed.getPropertyValue('transform');
					// Extract scaleX from the matrix, default to 1 if not parseable
					var scaleX = 1;
					if (transform && transform !== 'none') {
						var match = transform.match(/matrix\(([^,]+)/);
						if (match) {
							scaleX = parseFloat(match[1]);
						}
					}
					toast._remainingTime = Math.max(0, scaleX * toast._lifetime);
					bar.style.animationPlayState = 'paused';
				}
			});
			toast.addEventListener('mouseleave', function() {
				var bar = toast.querySelector('.grommunio-toast-progress-bar');
				if (bar) {
					bar.style.animationPlayState = 'running';
				}
				// Resume the JS timeout with remaining time
				var remaining = toast._remainingTime || toast._lifetime;
				if (remaining > 0) {
					toast._dismissTimer = setTimeout(function() {
						self.dismissToast(toastId);
					}, remaining);
				}
			});
		}

		// External listeners from config
		if (config.listeners) {
			for (var key in config.listeners) {
				if (key !== 'scope' && Ext.isFunction(config.listeners[key])) {
					(function(eventName, handler, scope) {
						toast.addEventListener(eventName, function(e) {
							handler.call(scope || toast, toast, e);
						});
					})(key, config.listeners[key], config.listeners.scope);
				}
			}
		}
	},

	/**
	 * Animate a toast into view.
	 * @param {HTMLElement} toast The toast element
	 * @private
	 */
	showToast: function(toast)
	{
		var ct = this.ensureContainer();
		ct.appendChild(toast);

		// Force reflow so the enter animation triggers
		toast.offsetHeight;
		toast.classList.add('grommunio-toast-visible');

		// Set up auto-dismiss
		if (toast._lifetime > 0) {
			var self = this;
			toast._dismissTimer = setTimeout(function() {
				self.dismissToast(toast._toastId);
			}, toast._lifetime);
		}
	},

	/**
	 * Dismiss and remove a toast by its ID.
	 * @param {String} toastId The toast ID
	 */
	dismissToast: function(toastId)
	{
		var record = this.activeToasts[toastId];
		if (!record) {
			return;
		}
		var toast = record.element;

		if (toast._dismissTimer) {
			clearTimeout(toast._dismissTimer);
			toast._dismissTimer = null;
		}

		toast.classList.remove('grommunio-toast-visible');
		toast.classList.add('grommunio-toast-exit');

		var self = this;
		var onEnd = function() {
			toast.removeEventListener('transitionend', onEnd);
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
			delete self.activeToasts[toastId];
		};

		toast.addEventListener('transitionend', onEnd);

		// Fallback in case transitionend doesn't fire
		setTimeout(onEnd, 400);
	},

	/**
	 * Immediately dismiss all active toasts.
	 * @private
	 */
	dismissAll: function()
	{
		var ids = [];
		for (var id in this.activeToasts) {
			if (this.activeToasts.hasOwnProperty(id)) {
				ids.push(id);
			}
		}
		for (var i = 0; i < ids.length; i++) {
			this.dismissToastImmediate(ids[i]);
		}
	},

	/**
	 * Remove a toast immediately without animation.
	 * @param {String} toastId The toast ID
	 * @private
	 */
	dismissToastImmediate: function(toastId)
	{
		var record = this.activeToasts[toastId];
		if (!record) {
			return;
		}
		var toast = record.element;
		if (toast._dismissTimer) {
			clearTimeout(toast._dismissTimer);
			toast._dismissTimer = null;
		}
		if (toast.parentNode) {
			toast.parentNode.removeChild(toast);
		}
		delete this.activeToasts[toastId];
	},

	/**
	 * @inheritdoc
	 */
	notify: function(category, title, message, config)
	{
		config = config || {};
		var severity = this.getSeverity(category);

		// Handle destroy requests
		if (config.reference && config.destroy) {
			var refId = config.reference._toastId || config.reference;
			this.dismissToast(refId);
			return;
		}

		// Handle update requests
		if (config.reference && config.update) {
			var refId = config.reference._toastId || config.reference;
			var existing = this.activeToasts[refId];
			if (existing) {
				var titleEl = existing.element.querySelector('.grommunio-toast-title');
				var msgEl = existing.element.querySelector('.grommunio-toast-message');
				if (titleEl && title) {
					titleEl.textContent = title;
				}
				if (msgEl && message) {
					msgEl.textContent = message;
				}
				return config.reference;
			}
		}

		// Dismiss any existing toasts so the new one replaces them
		this.dismissAll();

		var toast = this.buildToastElement(severity, title, message, config);
		this.bindToastEvents(toast, config);
		this.activeToasts[toast._toastId] = { element: toast, category: category };
		this.showToast(toast);

		return toast;
	}
});

Zarafa.onReady(function() {
	container.getNotifier().registerPlugin('toast', new Zarafa.core.ui.notifier.ToastPlugin());
});
