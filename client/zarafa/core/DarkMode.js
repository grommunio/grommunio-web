Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.DarkMode
 * @singleton
 *
 * Manages the dark mode state for grommunio Web.
 * Supports three modes: 'light', 'dark', 'system' (follows OS preference).
 * Uses data-theme attribute on body element for CSS targeting.
 */
Zarafa.core.DarkMode = {
	/**
	 * The current dark mode setting: 'light', 'dark', or 'system'
	 * @property
	 * @type String
	 */
	mode: 'light',

	/**
	 * The resolved theme: 'light' or 'dark' (after resolving 'system')
	 * @property
	 * @type String
	 */
	resolvedTheme: 'light',

	/**
	 * MediaQueryList for prefers-color-scheme
	 * @property
	 * @type MediaQueryList
	 * @private
	 */
	mediaQuery: null,

	/**
	 * Initialize the dark mode system.
	 * Reads the saved preference and applies it.
	 */
	init: function()
	{
		this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		this.mediaQuery.addEventListener('change', this.onSystemThemeChange.bind(this));

		// Read saved mode from settings
		var savedMode = container.getSettingsModel().get('zarafa/v1/main/dark_mode');
		this.mode = savedMode || 'light';

		this.apply(true);
	},

	/**
	 * Set the dark mode and apply it.
	 * @param {String} mode One of 'light', 'dark', 'system'
	 * @param {Boolean} save Whether to save to settings (default true)
	 */
	setMode: function(mode, save)
	{
		if (mode !== 'light' && mode !== 'dark' && mode !== 'system') {
			mode = 'light';
		}
		this.mode = mode;
		this.apply();

		if (save !== false) {
			container.getSettingsModel().beginEdit();
			container.getSettingsModel().set('zarafa/v1/main/dark_mode', mode);
			container.getSettingsModel().endEdit();
		}

		this.syncSettingsCombo(mode);
		this.syncToolbarButton(mode);
	},

	/**
	 * Sync the Appearance combo in the settings panel if it is currently rendered.
	 * @param {String} mode The new mode value
	 * @private
	 */
	syncSettingsCombo: function(mode)
	{
		var combo = Ext.getCmp('darkmode-combo');
		if (combo) {
			combo.setValue(mode);
		}
	},

	/**
	 * Sync the dark mode toolbar button icon and tooltip if it is currently rendered.
	 * @param {String} mode The new mode value
	 * @private
	 */
	syncToolbarButton: function(mode)
	{
		var btn = Ext.getCmp('mainmenu-button-darkmode');
		if (btn && btn.getEl()) {
			var tabbar = btn.findParentByType('zarafa.maintabbar');
			if (tabbar) {
				btn.getEl().setStyle('backgroundImage', 'url(\'' + tabbar.getDarkModeIcon(mode) + '\')');
				btn.setTooltip(tabbar.getDarkModeTooltip(mode));
			}
		}
	},

	/**
	 * Get the current mode setting.
	 * @return {String} 'light', 'dark', or 'system'
	 */
	getMode: function()
	{
		return this.mode;
	},

	/**
	 * Check if dark mode is currently active (after resolving 'system').
	 * @return {Boolean}
	 */
	isDark: function()
	{
		return this.resolvedTheme === 'dark';
	},

	/**
	 * Apply the current mode to the DOM.
	 * @param {Boolean} initial True during first init (skip editor updates)
	 * @private
	 */
	apply: function(initial)
	{
		var previousTheme = this.resolvedTheme;

		if (this.mode === 'system') {
			this.resolvedTheme = this.mediaQuery.matches ? 'dark' : 'light';
		} else {
			this.resolvedTheme = this.mode;
		}

		// Set dark mode class on body for CSS targeting
		// Using class instead of data-attribute for maximum CSS compatibility
		document.body.classList.remove('dark-mode', 'dark-mode-system');
		if (this.resolvedTheme === 'dark') {
			document.body.classList.add('dark-mode');
		}
		if (this.mode === 'system') {
			document.body.classList.add('dark-mode-system');
		}

		// Update OnlyOffice integration
		var ooTheme = this.resolvedTheme === 'dark'
			? '{"id":"theme-dark","type":"dark"}'
			: '{"id":"theme-light","type":"light"}';
		window.localStorage.setItem('ui-theme', ooTheme);
		window.localStorage.setItem('ui-theme-id',
			this.resolvedTheme === 'dark' ? 'theme-dark' : 'theme-light');

		// Update TinyMCE editors if theme changed (skip on first init)
		if (!initial && previousTheme !== this.resolvedTheme) {
			this.updateTinyMCE();
		}

		// Always set up mail preview observer (even on init) so new iframes get dark styles
		this.updateMailPreview();
	},

	/**
	 * Handler for system color scheme changes.
	 * Only acts when mode is 'system'.
	 * @private
	 */
	onSystemThemeChange: function()
	{
		if (this.mode === 'system') {
			this.apply();
		}
	},

	/**
	 * Update all active TinyMCE 8 editor instances to match the current theme.
	 * Swaps skin CSS links in the main document and content CSS inside editor iframes.
	 * @private
	 */
	updateTinyMCE: function()
	{
		if (typeof tinymce === 'undefined' || !tinymce.get) {
			return;
		}

		var isDark = this.isDark();

		// Swap UI skin CSS links in the main document
		var links = document.querySelectorAll('link[href*="/skins/ui/"]');
		for (var i = 0; i < links.length; i++) {
			var href = links[i].href;
			if (isDark) {
				links[i].href = href.replace('/oxide/', '/oxide-dark/');
			} else {
				links[i].href = href.replace('/oxide-dark/', '/oxide/');
			}
		}

		// Update content CSS inside each editor iframe
		// tinymce.get() returns an array in TinyMCE 8
		var editors = tinymce.get();
		if (!editors || !editors.length) {
			return;
		}
		for (var ei = 0; ei < editors.length; ei++) {
			var editor = editors[ei];
			if (!editor || !editor.getDoc) {
				continue;
			}
			try {
				var doc = editor.getDoc();
				if (!doc) {
					continue;
				}
				var contentLinks = doc.querySelectorAll('link[href*="/skins/content/"]');
				for (var j = 0; j < contentLinks.length; j++) {
					var ch = contentLinks[j].href;
					if (isDark) {
						contentLinks[j].href = ch.replace('/default/', '/dark/');
					} else {
						contentLinks[j].href = ch.replace('/dark/', '/default/');
					}
				}

				// Inject dark/light mode style into editor iframe body
				var existing = doc.getElementById('grommunio-dark-editor');
				if (existing) {
					existing.parentNode.removeChild(existing);
				}
				if (doc.head) {
					var style = doc.createElement('style');
					style.id = 'grommunio-dark-editor';
					if (isDark) {
						style.textContent =
							'body { background-color: #1e1e1e !important; color: #e0e0e0 !important; }' +
							'body * { color: inherit; }';
					} else {
						style.textContent =
							'body { background-color: #ffffff !important; color: #000000 !important; }';
					}
					doc.head.appendChild(style);
				}
			} catch (e) {
				// Editor may not be fully initialized yet
			}
		}
	},

	/**
	 * Update mail preview iframes with dark mode handling.
	 * Uses smart CSS filter inversion that preserves images.
	 * @private
	 */
	updateMailPreview: function()
	{
		var isDark = this.isDark();
		var iframes = document.querySelectorAll('.preview-iframe');

		for (var i = 0; i < iframes.length; i++) {
			this.applyDarkToIframe(iframes[i], isDark);

			// Listen for future content loads in this iframe
			if (!iframes[i]._darkModeListener) {
				iframes[i]._darkModeListener = true;
				var self = this;
				iframes[i].addEventListener('load', function() {
					self.applyDarkToIframe(this, self.isDark());
				});
			}
		}

		// Observe DOM for new preview iframes being added
		if (!this._previewObserver) {
			var self = this;
			this._previewObserver = new MutationObserver(function() {
				var dark = self.isDark();
				var newIframes = document.querySelectorAll('.preview-iframe');
				for (var j = 0; j < newIframes.length; j++) {
					self.applyDarkToIframe(newIframes[j], dark);
					if (!newIframes[j]._darkModeListener) {
						newIframes[j]._darkModeListener = true;
						newIframes[j].addEventListener('load', function() {
							self.applyDarkToIframe(this, self.isDark());
						});
					}
				}
			});
			this._previewObserver.observe(document.body, { childList: true, subtree: true });
		}
	},

	/**
	 * Apply or remove dark mode styles to/from a preview iframe.
	 * Uses CSS filter inversion for dark mode: invert(1) flips brightness
	 * while hue-rotate(180deg) preserves original hues. Images and media
	 * are re-inverted so photos and logos appear in their original colors.
	 * Emails that are already dark-themed are detected by luminance analysis
	 * and left untouched (only the background is adjusted to match the theme).
	 * @param {HTMLIFrameElement} iframe
	 * @param {Boolean} isDark
	 * @private
	 */
	applyDarkToIframe: function(iframe, isDark)
	{
		try {
			var doc = iframe.contentDocument || iframe.contentWindow.document;
			if (!doc || !doc.body) {
				return;
			}

			var existing = doc.getElementById('grommunio-dark-preview');
			if (existing) {
				existing.parentNode.removeChild(existing);
			}

			// Clean up any JS-applied background from previous invocation
			if (doc.body.style.getPropertyValue('--grommunio-dark-bg')) {
				doc.body.style.removeProperty('background-color');
				doc.body.style.removeProperty('--grommunio-dark-bg');
			}

			if (!doc.head) {
				return;
			}

			var style = doc.createElement('style');
			style.id = 'grommunio-dark-preview';

			var scrollbarCss = isDark
				? '* { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }'
				: '* { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }';

			if (isDark) {
				var luminance = this.getEmailLuminance(doc);

				if (luminance < 0.2) {
					// Already dark-themed email — just harmonize background
					style.textContent = scrollbarCss +
						'html { background-color: #1e1e1e !important; }';
				} else {
					// Light email — apply smart CSS filter inversion.
					// #e1e1e1 is the pre-inversion value that maps to exactly
					// #1e1e1e (--dm-bg-paper) after invert(1).
					style.textContent = scrollbarCss +
						'html {' +
						'  filter: invert(1) hue-rotate(180deg);' +
						'  background-color: #e1e1e1 !important;' +
						'  min-height: 100%;' +
						'}' +
						// Re-invert media so images/videos show original colors.
						// invert(1) applied twice is the identity function.
						'img, video, canvas, svg,' +
						'[style*="background-image"] {' +
						'  filter: invert(1) hue-rotate(180deg) !important;' +
						'}' +
						// Media nested inside a re-inverted background-image
						// container must not be re-inverted again (that would
						// cause a triple inversion = one net inversion).
						'[style*="background-image"] img,' +
						'[style*="background-image"] video,' +
						'[style*="background-image"] canvas,' +
						'[style*="background-image"] svg {' +
						'  filter: none !important;' +
						'}';

					this.adjustBodyBackground(doc);
				}
			} else {
				style.textContent = scrollbarCss;
			}

			doc.head.appendChild(style);
		} catch (e) {
			// Cross-origin iframe
		}
	},

	/**
	 * Calculate the perceived luminance of the email's background color.
	 * Checks the body first, then falls back to the first wrapper element
	 * (table or div), since many HTML emails set their background there.
	 * @param {Document} doc The iframe document
	 * @return {Number} Luminance between 0.0 (black) and 1.0 (white)
	 * @private
	 */
	getEmailLuminance: function(doc)
	{
		try {
			if (!doc.defaultView || !doc.body) {
				return 1.0;
			}

			var bg = doc.defaultView.getComputedStyle(doc.body).backgroundColor;

			// Transparent body — check the first wrapper element
			if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
				var wrapper = doc.body.querySelector('table, div');
				if (wrapper) {
					bg = doc.defaultView.getComputedStyle(wrapper).backgroundColor;
				}
				if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
					return 1.0;
				}
			}

			return this.parseLuminance(bg);
		} catch (e) {
			return 1.0;
		}
	},

	/**
	 * Parse a CSS rgb/rgba color string and return its relative luminance
	 * (Rec. 709 coefficients).
	 * @param {String} color CSS color like 'rgb(255, 255, 255)'
	 * @return {Number} Luminance between 0.0 and 1.0, or 1.0 on parse failure
	 * @private
	 */
	parseLuminance: function(color)
	{
		var m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
		if (!m) {
			return 1.0;
		}
		var r = parseInt(m[1], 10) / 255;
		var g = parseInt(m[2], 10) / 255;
		var b = parseInt(m[3], 10) / 255;
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	},

	/**
	 * Set the email body background to the pre-inversion value (#e1e1e1)
	 * when it is white or transparent, so that after invert(1) it becomes
	 * exactly #1e1e1e — matching the dark theme seamlessly.
	 * @param {Document} doc The iframe document
	 * @private
	 */
	adjustBodyBackground: function(doc)
	{
		try {
			if (!doc.defaultView || !doc.body) {
				return;
			}
			var bg = doc.defaultView.getComputedStyle(doc.body).backgroundColor;
			if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' ||
				this.parseLuminance(bg) > 0.9) {
				doc.body.style.backgroundColor = '#e1e1e1';
				// Mark so we can clean up when switching back to light mode
				doc.body.style.setProperty('--grommunio-dark-bg', '1');
			}
		} catch (e) {
			// Ignore
		}
	}
};
