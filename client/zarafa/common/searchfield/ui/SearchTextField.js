Ext.ns('Zarafa.common.searchfield.ui');

/**
 * @class Zarafa.common.searchfield.ui.SearchTextField
 * @extends Ext.form.TextField
 * @xtype zarafa.searchtextfield
 *
 * Token-based search input. The original {@code <input>} is hidden and replaced
 * by a composite container that renders KQL prefixes as visual chiplets with
 * inline value inputs. A tail input at the end accepts new text and auto-converts
 * KQL patterns (e.g. typing "from:") into chips.
 *
 * The hidden input always holds the full KQL query string so that
 * {@link #getValue} returns what the server expects.
 *
 * #dependsFile client/zarafa/common/searchfield/ui/SearchDropdownPanel.js
 */
Zarafa.common.searchfield.ui.SearchTextField = Ext.extend(Ext.form.TextField, {

	/**
	 * @cfg {String} searchIndicatorClass CSS class applied during active search.
	 */
	searchIndicatorClass: 'zarafa-tbar-loading',

	/**
	 * @cfg {Boolean} searchPanelRendered Whether the search content panel is open.
	 */
	searchPanelRendered: false,

	/**
	 * The dropdown panel instance.
	 * @property
	 * @type Zarafa.common.searchfield.ui.SearchDropdownPanel
	 */
	dropdownPanel: null,

	/**
	 * Whether the dropdown is being interacted with (prevents blur-hide).
	 * @property
	 * @type Boolean
	 */
	dropdownInteracting: false,

	/**
	 * Ordered array of token objects.
	 * Each token: { type: 'filter'|'operator'|'text', key: String, value: String }
	 * @property
	 * @type Array
	 */
	tokens: null,

	/**
	 * Index of the token currently being edited inline, or -1 if none.
	 * @property
	 * @type Number
	 */
	editingTokenIndex: -1,

	/**
	 * The visible container that replaces the hidden input.
	 * @property
	 * @type Ext.Element
	 */
	tokenWrapEl: null,

	/**
	 * The input at the end of the token container for new text.
	 * @property
	 * @type Ext.Element
	 */
	tailInputEl: null,

	/**
	 * Display labels for filter keys.
	 * @property
	 * @type Object
	 */
	filterLabels: null,

	/**
	 * Supported KQL field names.
	 * @property
	 * @type Array
	 */
	kqlFields: ['subject','from','to','cc','bcc','body','sender','attachment','category','unread','type','date'],

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(config, {
			validationEvent: false,
			validateOnBlur: false,
			cls: 'k-search-input',
			ref: 'searchTextField',
			enableKeyEvents: true
		});

		this.tokens = [];
		this.filterLabels = {
			'subject': _('Subject'),
			'from': _('From'),
			'to': _('To'),
			'cc': _('Cc'),
			'bcc': _('Bcc'),
			'body': _('Body'),
			'sender': _('Sender'),
			'attachment': _('Attachment'),
			'category': _('Category'),
			'unread': _('Unread'),
			'type': _('Type'),
			'date': _('Date')
		};

		this.addEvents(
			'beforestart',
			'start',
			'beforestop',
			'stop',
			/**
			 * @event chipchange
			 * Fired when filter/operator tokens are added or removed.
			 * @param {Zarafa.common.searchfield.ui.SearchTextField} field
			 * @param {Array} chips Current array of filter chip objects
			 */
			'chipchange'
		);

		Zarafa.common.searchfield.ui.SearchTextField.superclass.constructor.call(this, config);
	},

	/**
	 * @override
	 */
	initComponent: function()
	{
		Zarafa.common.searchfield.ui.SearchTextField.superclass.initComponent.call(this);
		this.on('afterrender', this.onAfterRenderSearch, this);
	},

	/**
	 * After the Ext field renders, hide its native input and build the
	 * composite token input on top of it.
	 * @private
	 */
	onAfterRenderSearch: function()
	{
		// Hide the native input — it becomes the KQL value store
		this.el.setDisplayed(false);

		// Build the visible token container as a sibling inside x-form-field-wrap
		this.tokenWrapEl = Ext.DomHelper.insertAfter(this.el.dom, {
			tag: 'div',
			cls: 'k-search-token-input',
			role: 'search',
			cn: [{
				tag: 'input',
				type: 'text',
				cls: 'k-search-tail-input',
				autocomplete: 'off',
				'aria-label': _('Search')
			},{
				tag: 'span',
				cls: 'k-search-submit-btn',
				title: _('Search'),
				role: 'button',
				'aria-label': _('Search'),
				html: '&#9166;'
			}]
		}, true);

		this.tailInputEl = this.tokenWrapEl.child('.k-search-tail-input');
		this.tailInputEl.set({ placeholder: _('Search\u2026') });

		// Search submit button
		this.submitBtnEl = this.tokenWrapEl.child('.k-search-submit-btn');
		this.submitBtnEl.on('click', function() {
			if (this.tailInputEl.dom.value.trim()) {
				this.commitTailInput();
			}
			this.hideDropdown();
			this.syncHiddenInput();
			this.fireEvent('chipchange', this, this.getFilterChips());
			var textValue = this.buildQuery().trim();
			var specialCharsFilter = /[#\$%\^\&*\)\(]/g;
			if (Ext.isEmpty(textValue) || textValue.match(specialCharsFilter)) {
				this.stopSearch();
			} else {
				this.onTriggerClick();
			}
		}, this);
		this.submitBtnEl.on('mousedown', function(e) { e.preventDefault(); }, this);
		this.submitBtnEl.set({ 'tabindex': '0' });
		this.submitBtnEl.on('keydown', function(e) {
			if (e.getKey() === e.ENTER || e.getKey() === e.SPACE) {
				e.preventDefault();
				this.submitBtnEl.fireEvent('click', e);
			}
		}, this);

		// Tail input events
		this.tailInputEl.on('focus', this.onSearchFocus, this);
		this.tailInputEl.on('blur', this.onSearchBlur, this);
		this.tailInputEl.on('keydown', this.onTailKeyDown, this);
		this.tailInputEl.on('input', this.onTailInput, this);

		// Click anywhere on the wrapper → focus tail (unless clicking a chip label, edit input, or submit)
		this.tokenWrapEl.on('click', function(e) {
			var t = Ext.fly(e.getTarget());
			if (!t.hasClass('k-search-chip-remove') &&
				!t.hasClass('k-search-chip-label') &&
				!t.hasClass('k-search-chip-edit') &&
				!t.hasClass('k-search-submit-btn')) {
				this.tailInputEl.focus();
			}
		}, this);

		// Create the dropdown panel
		this.dropdownPanel = new Zarafa.common.searchfield.ui.SearchDropdownPanel({
			searchTextField: this,
			searchFolderCombo: this.searchContainer.searchFolderCombo
		});

		// Prevent blur when interacting with the dropdown.
		// mousedown prevents the default focus-shift; we keep
		// dropdownInteracting true until the click handler has
		// finished and the focus has settled back inside the
		// token wrapper.
		// The panel is already rendered (renderTo: Ext.getBody()),
		// so bind directly on its element.
		this.dropdownPanel.el.on('mousedown', function(e) {
			e.preventDefault();
			this.dropdownInteracting = true;
		}, this);
		this.dropdownPanel.el.on('mouseup', function() {
			// Defer reset so that the click handler (which fires
			// after mouseup) can still run with the flag set.
			(function() {
				this.dropdownInteracting = false;
			}).defer(100, this);
		}, this);

		// If the hidden input already has a value (set via setValue before
		// afterrender), parse it into tokens now that the UI is ready.
		var existingValue = this.el.dom.value;
		if (existingValue) {
			this.tokens = this.parseQueryToTokens(existingValue);
			var remaining = this.getPlainTextRemainder(existingValue);
			this.renderTokens();
			if (this.tailInputEl) {
				this.tailInputEl.dom.value = remaining;
			}
			this.fireEvent('chipchange', this, this.getFilterChips());
		}
	},

	// ===================================================================
	// Value management
	// ===================================================================

	/**
	 * @override
	 * Returns the full KQL query from the hidden input.
	 */
	getValue: function()
	{
		return this.el ? this.el.dom.value : '';
	},

	/**
	 * @override
	 */
	getRawValue: function()
	{
		return this.el ? this.el.dom.value : '';
	},

	/**
	 * @override
	 * Parses the given value into tokens and renders them.
	 */
	setValue: function(v)
	{
		if (this.el) {
			this.el.dom.value = v || '';
		}
		if (this.tokenWrapEl) {
			this.tokens = this.parseQueryToTokens(v || '');
			var remaining = this.getPlainTextRemainder(v || '');
			this.renderTokens();
			if (this.tailInputEl) {
				this.tailInputEl.dom.value = remaining;
			}
			this.syncHiddenInput();
			this.fireEvent('chipchange', this, this.getFilterChips());
		}
		return this;
	},

	/**
	 * Returns an array of virtual token objects (type, date, unread)
	 * that aren't part of the KQL string but need to be transported.
	 * @return {Array}
	 */
	getVirtualTokens: function()
	{
		var result = [];
		for (var i = 0; i < this.tokens.length; i++) {
			var t = this.tokens[i];
			if (t.type !== 'filter') {
				continue;
			}
			var isVirtual = this.virtualFilterKeys.indexOf(t.key) !== -1;
			var isBooleanEmpty = this.booleanFilterKeys.indexOf(t.key) !== -1 && !t.value;
			if (isVirtual || isBooleanEmpty) {
				result.push({ type: 'filter', key: t.key, value: t.value });
			}
		}
		return result;
	},

	/**
	 * Merges virtual tokens into the current token array.
	 * Respects singleton and duplicate rules.
	 * @param {Array} virtualTokens
	 */
	applyVirtualTokens: function(virtualTokens)
	{
		if (!virtualTokens || !virtualTokens.length || !this.tokenWrapEl) {
			return;
		}
		// Batch insert — add tokens directly, then render+sync once
		for (var i = 0; i < virtualTokens.length; i++) {
			var vt = virtualTokens[i];
			var isSingleton = this.singletonFilterKeys.indexOf(vt.key) !== -1;

			// Check for existing token with same key
			var found = false;
			if (isSingleton) {
				for (var s = 0; s < this.tokens.length; s++) {
					if (this.tokens[s].type === 'filter' && this.tokens[s].key === vt.key) {
						this.tokens[s].value = vt.value || '';
						found = true;
						break;
					}
				}
			}

			// Check for duplicate: by key:value for value filters, by key alone for boolean filters
			if (!found) {
				var isBooleanKey = this.booleanFilterKeys.indexOf(vt.key) !== -1 && !vt.value;
				for (var d = 0; d < this.tokens.length; d++) {
					if (this.tokens[d].type === 'filter' && this.tokens[d].key === vt.key) {
						if (isBooleanKey || (vt.value && this.tokens[d].value === vt.value)) {
							found = true;
							break;
						}
					}
				}
			}

			if (!found) {
				var last = this.tokens.length > 0 ? this.tokens[this.tokens.length - 1] : null;
				if (last && last.type !== 'operator') {
					this.tokens.push({ type: 'operator', key: 'AND' });
				}
				this.tokens.push({ type: 'filter', key: vt.key, value: vt.value || '' });
			}
		}

		this.renderTokens();
		this.syncHiddenInput();
		this.fireEvent('chipchange', this, this.getFilterChips());
	},

	/**
	 * Virtual filter keys that are synced to toolbox panel controls
	 * rather than included in the KQL query string.
	 * @property
	 * @type Array
	 */
	virtualFilterKeys: ['unread', 'type', 'date'],

	/**
	 * Reconstructs the full KQL string from tokens + tail input.
	 * Virtual filter tokens (unread, type, date) are excluded since
	 * they are handled by the toolbox panel controls.
	 * @return {String}
	 */
	/**
	 * Filter keys that should be excluded from the KQL query when
	 * they have no value, because they are handled as boolean
	 * restrictions by the toolbox panel (e.g. "has attachments").
	 * @property
	 * @type Array
	 */
	booleanFilterKeys: ['attachment', 'unread'],

	buildQuery: function()
	{
		// First pass: mark virtual token indices
		var isVirtual = [];
		for (var i = 0; i < this.tokens.length; i++) {
			var t = this.tokens[i];
			var isVirtualKey = this.virtualFilterKeys.indexOf(t.key) !== -1;
			var isBooleanEmpty = t.type === 'filter' &&
				this.booleanFilterKeys.indexOf(t.key) !== -1 && !t.value;
			isVirtual[i] = (t.type === 'filter' && (isVirtualKey || isBooleanEmpty));
		}

		// Also mark operators that only connect virtual tokens
		for (var j = 0; j < this.tokens.length; j++) {
			if (this.tokens[j].type === 'operator') {
				var prevReal = false, nextReal = false;
				for (var p = j - 1; p >= 0; p--) {
					if (this.tokens[p].type !== 'operator') { prevReal = !isVirtual[p]; break; }
				}
				for (var n = j + 1; n < this.tokens.length; n++) {
					if (this.tokens[n].type !== 'operator') { nextReal = !isVirtual[n]; break; }
				}
				if (!prevReal || !nextReal) {
					isVirtual[j] = true;
				}
			}
		}

		// Second pass: build query from non-virtual tokens
		var parts = [];
		for (var k = 0; k < this.tokens.length; k++) {
			if (isVirtual[k]) {
				continue;
			}
			var tok = this.tokens[k];
			if (tok.type === 'filter') {
				var val = tok.value || '';
				if (val.indexOf(' ') !== -1) {
					val = '"' + val + '"';
				}
				parts.push(tok.key + ':' + val);
			} else if (tok.type === 'operator') {
				parts.push(tok.key);
			} else if (tok.type === 'text') {
				var tv = tok.value;
				if (tv.indexOf(' ') !== -1) {
					tv = '"' + tv + '"';
				}
				parts.push(tv);
			}
		}
		var tail = this.tailInputEl ? this.tailInputEl.dom.value.trim() : '';
		if (tail) {
			parts.push(tail);
		}
		return parts.join(' ');
	},

	/**
	 * Writes the current query into the hidden input and fires a
	 * synthetic DOM {@code input} event so external listeners
	 * (e.g. SearchToolBoxPanel) are notified.
	 * @private
	 */
	syncHiddenInput: function()
	{
		var query = this.buildQuery();
		this.el.dom.value = query;
		try {
			var evt = document.createEvent('Event');
			evt.initEvent('input', true, true);
			this.el.dom.dispatchEvent(evt);
		} catch (e) {}
	},

	// ===================================================================
	// Token parsing
	// ===================================================================

	/**
	 * Parses a KQL query string into an ordered array of tokens.
	 * Only field:value pairs and AND/OR operators become tokens;
	 * plain text is left for the tail input.
	 *
	 * @param {String} query
	 * @return {Array}
	 */
	parseQueryToTokens: function(query)
	{
		if (!query) {
			return [];
		}

		var tokens = [];
		var fieldsPattern = this.kqlFields.join('|');
		var regex = new RegExp(
			'\\b(' + fieldsPattern + '):(\"[^\"]*\"|\'[^\']*\'|\\S*)|\\b(AND|OR|NOT)\\b|(\"[^\"]*\"|\'[^\']*\')|\\S+', 'gi'
		);

		var match;
		while ((match = regex.exec(query)) !== null) {
			if (match[1]) {
				var key = match[1].toLowerCase();
				var val = match[2] || '';
				if (val.length >= 2 &&
					((val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') ||
					 (val.charAt(0) === "'" && val.charAt(val.length - 1) === "'"))) {
					val = val.substring(1, val.length - 1);
				}
				tokens.push({ type: 'filter', key: key, value: val });
			} else if (match[3]) {
				tokens.push({ type: 'operator', key: match[3].toUpperCase() });
			} else {
				var text = match[0];
				if (text.length >= 2 &&
					((text.charAt(0) === '"' && text.charAt(text.length - 1) === '"') ||
					 (text.charAt(0) === "'" && text.charAt(text.length - 1) === "'"))) {
					text = text.substring(1, text.length - 1);
				}
				tokens.push({ type: 'text', value: text });
			}
		}

		return tokens;
	},

	/**
	 * Returns remaining plain text not captured as tokens.
	 * With the new chip-based model, all text is captured as tokens.
	 * @param {String} query
	 * @return {String}
	 */
	getPlainTextRemainder: function()
	{
		return '';
	},

	// ===================================================================
	// Token rendering
	// ===================================================================

	/**
	 * Re-renders the entire token container from {@link #tokens}.
	 * Inserts implicit AND chips between adjacent non-operator tokens.
	 * @private
	 */
	renderTokens: function()
	{
		if (!this.tokenWrapEl || !this.tailInputEl) {
			return;
		}

		// Remove everything except the tail input and submit button
		var dom = this.tokenWrapEl.dom;
		var submitDom = this.submitBtnEl ? this.submitBtnEl.dom : null;
		var children = dom.childNodes;
		var toRemove = [];
		for (var i = 0; i < children.length; i++) {
			if (children[i] !== this.tailInputEl.dom && children[i] !== submitDom) {
				toRemove.push(children[i]);
			}
		}
		for (var j = 0; j < toRemove.length; j++) {
			dom.removeChild(toRemove[j]);
		}

		var insertBefore = this.tailInputEl.dom;

		for (var k = 0; k < this.tokens.length; k++) {
			var token = this.tokens[k];

			// Implicit AND between adjacent non-operator tokens
			if (k > 0 && token.type !== 'operator' && this.tokens[k - 1].type !== 'operator') {
				dom.insertBefore(this.createOperatorChipEl('AND', true), insertBefore);
			}

			if (this.editingTokenIndex === k) {
				// Render inline edit input instead of chip
				dom.insertBefore(this.createEditInput(token, k), insertBefore);
			} else if (token.type === 'filter') {
				dom.insertBefore(this.createFilterChipEl(token, k), insertBefore);
			} else if (token.type === 'operator') {
				dom.insertBefore(this.createOperatorChipEl(token.key, false, k), insertBefore);
			} else if (token.type === 'text') {
				dom.insertBefore(this.createTextChipEl(token, k), insertBefore);
			}
		}

		// Placeholder: only show when no tokens exist
		this.tailInputEl.set({
			placeholder: this.tokens.length > 0 ? '' : _('Search\u2026')
		});
	},

	/**
	 * Creates a chip DOM element for a filter token.
	 * Shows "Label: Value" in a single chip. Clicking the label
	 * enters inline edit mode (unless the filter is virtual/boolean).
	 * @private
	 */
	createFilterChipEl: function(token, index)
	{
		var isVirtual = this.virtualFilterKeys.indexOf(token.key) !== -1;
		var isBooleanEmpty = this.booleanFilterKeys.indexOf(token.key) !== -1 && !token.value;
		var isEditable = !isVirtual && !isBooleanEmpty;

		var chip = document.createElement('span');
		chip.className = 'k-search-chip' +
			((isVirtual || isBooleanEmpty) ? ' k-search-chip-value' : ' k-search-chip-filter');
		chip.setAttribute('data-token-index', index);

		var label = document.createElement('span');
		label.className = 'k-search-chip-label';
		var keyLabel = this.filterLabels[token.key] || token.key;
		if (token.value) {
			var valLabels = this.valueLabels[token.key];
			var valLabel = (valLabels && valLabels[token.value]) || token.value;
			label.textContent = keyLabel + ': ' + valLabel;
		} else {
			label.textContent = keyLabel;
		}
		chip.appendChild(label);

		var remove = document.createElement('span');
		remove.className = 'k-search-chip-remove';
		remove.textContent = '\u00d7';
		chip.appendChild(remove);

		chip.addEventListener('mousedown', function(e) { e.preventDefault(); });

		var self = this;
		remove.addEventListener('click', function(e) {
			e.stopPropagation();
			self.removeTokenAt(index);
		});

		if (isEditable) {
			label.style.cursor = 'text';
			label.addEventListener('click', function() {
				self.startEditToken(index);
			});
		}

		return chip;
	},

	/**
	 * Human-readable labels for virtual filter values.
	 * @property
	 * @type Object
	 */
	valueLabels: {
		'type': {
			'mail': _('Mails'),
			'appointment': _('Appointments'),
			'contact': _('Contacts'),
			'task': _('Tasks'),
			'note': _('Notes')
		},
		'date': {
			'past_week': _('Past week'),
			'past_two_weeks': _('Past 2 weeks'),
			'past_month': _('Past month'),
			'past_six_month': _('Past 6 month'),
			'past_year': _('Past year')
		},
		'unread': {
			'true': _('Yes')
		}
	},

	/**
	 * Creates a chip for a plain text token.
	 * Clicking the label enters inline edit mode.
	 * @param {Object} token
	 * @param {Number} index
	 * @return {HTMLElement}
	 * @private
	 */
	createTextChipEl: function(token, index)
	{
		var chip = document.createElement('span');
		chip.className = 'k-search-chip k-search-chip-text';
		chip.setAttribute('data-token-index', index);

		var label = document.createElement('span');
		label.className = 'k-search-chip-label';
		label.textContent = token.value;
		label.style.cursor = 'text';
		chip.appendChild(label);

		var remove = document.createElement('span');
		remove.className = 'k-search-chip-remove';
		remove.textContent = '\u00d7';
		chip.appendChild(remove);

		chip.addEventListener('mousedown', function(e) { e.preventDefault(); });

		var self = this;
		remove.addEventListener('click', function(e) {
			e.stopPropagation();
			self.removeTokenAt(index);
		});

		label.addEventListener('click', function() {
			self.startEditToken(index);
		});

		return chip;
	},

	/**
	 * Creates a chip DOM element for a boolean operator.
	 * @param {String} operator 'AND' or 'OR'
	 * @param {Boolean} implicit True for auto-inserted AND chips
	 * @private
	 */
	/**
	 * Operator cycle order for click-to-toggle.
	 * @property
	 * @type Array
	 */
	operatorCycle: ['AND', 'OR', 'NOT'],

	createOperatorChipEl: function(operator, implicit, tokenIndex)
	{
		var chip = document.createElement('span');
		chip.className = 'k-search-chip k-search-chip-operator';
		if (implicit) {
			chip.className += ' k-search-chip-implicit';
		}

		var label = document.createElement('span');
		label.className = 'k-search-chip-label';
		label.textContent = operator;
		label.style.cursor = 'pointer';
		label.title = _('Click to cycle: AND \u2192 OR \u2192 NOT');
		chip.appendChild(label);

		var self = this;

		// Click label to cycle operator (works for both implicit and explicit)
		label.addEventListener('click', function(e) {
			e.stopPropagation();
			var cur = label.textContent;
			var idx = self.operatorCycle.indexOf(cur);
			var next = self.operatorCycle[(idx + 1) % self.operatorCycle.length];
			label.textContent = next;

			if (implicit) {
				// Implicit AND → promote to explicit token
				// Find the right token index: count non-operator tokens before this chip
				var chipsBefore = chip.parentNode.querySelectorAll('.k-search-chip');
				var pos = Array.prototype.indexOf.call(chipsBefore, chip);
				// Find adjacent tokens and insert operator between them
				// Count visible tokens to find insertion point
				var tokenIdx = 0;
				var insertAt = -1;
				var nodes = chip.parentNode.childNodes;
				for (var n = 0; n < nodes.length; n++) {
					if (nodes[n] === chip) {
						insertAt = tokenIdx;
						break;
					}
					if (nodes[n].classList &&
						(nodes[n].classList.contains('k-search-chip') ||
						 nodes[n].classList.contains('k-search-chip-edit')) &&
						!nodes[n].classList.contains('k-search-chip-implicit')) {
						tokenIdx++;
					}
				}
				if (insertAt >= 0 && insertAt <= self.tokens.length) {
					self.tokens.splice(insertAt, 0, { type: 'operator', key: next });
					self.renderTokens();
					self.syncHiddenInput();
					self.fireEvent('chipchange', self, self.getFilterChips());
				}
			} else if (typeof tokenIndex === 'number') {
				self.tokens[tokenIndex].key = next;
				self.syncHiddenInput();
			}
		});

		// Explicit operator chips get a remove button
		if (!implicit && typeof tokenIndex === 'number') {
			var remove = document.createElement('span');
			remove.className = 'k-search-chip-remove';
			remove.textContent = '\u00d7';
			chip.appendChild(remove);

			remove.addEventListener('click', function(e) {
				e.stopPropagation();
				self.removeTokenAt(tokenIndex);
			});
		}

		chip.addEventListener('mousedown', function(e) { e.preventDefault(); });

		return chip;
	},

	/**
	 * Starts inline editing of a chip at the given token index.
	 * @param {Number} index
	 * @private
	 */
	startEditToken: function(index)
	{
		this.editingTokenIndex = index;
		this.renderTokens();
		var editInput = this.tokenWrapEl.dom.querySelector('.k-search-chip-edit');
		if (editInput) {
			editInput.focus();
			editInput.setSelectionRange(editInput.value.length, editInput.value.length);
		}
	},

	/**
	 * Creates an inline edit input that replaces a chip during editing.
	 * @param {Object} token The token being edited
	 * @param {Number} index Token index
	 * @return {HTMLElement}
	 * @private
	 */
	createEditInput: function(token, index)
	{
		var input = document.createElement('input');
		input.type = 'text';
		input.className = 'k-search-chip-edit';

		// Build raw representation for editing
		if (token.type === 'filter') {
			var val = token.value || '';
			if (val.indexOf(' ') !== -1) {
				val = '"' + val + '"';
			}
			input.value = token.key + ':' + val;
		} else if (token.type === 'text') {
			var tv = token.value || '';
			if (tv.indexOf(' ') !== -1) {
				tv = '"' + tv + '"';
			}
			input.value = tv;
		} else if (token.type === 'operator') {
			input.value = token.key;
		}

		input.style.width = Math.max(4, input.value.length + 1) + 'ch';

		var self = this;

		input.addEventListener('input', function() {
			input.style.width = Math.max(4, input.value.length + 1) + 'ch';
			// Auto-commit on closing quote
			var text = input.value;
			if (text.length >= 2) {
				var lastChar = text.charAt(text.length - 1);
				if ((lastChar === '"' || lastChar === "'") && !self.isInsideQuotes(text)) {
					self.commitEdit(index);
					self.tailInputEl.focus();
					return;
				}
			}
		});

		input.addEventListener('keydown', function(e) {
			if (e.keyCode === 13) { // Enter — commit and search
				e.preventDefault();
				self.commitEdit(index);
				self.tailInputEl.focus();
				// Trigger search after commit
				self.syncHiddenInput();
				self.fireEvent('chipchange', self, self.getFilterChips());
				self.onTriggerClick();
			} else if (e.keyCode === 9) { // Tab — commit and move to tail
				e.preventDefault();
				self.commitEdit(index);
				self.tailInputEl.focus();
			} else if (e.keyCode === 27) { // Escape — cancel
				e.preventDefault();
				self.cancelEdit();
			} else if (e.keyCode === 32) { // Space — commit if not in quotes
				if (!self.isInsideQuotes(input.value)) {
					e.preventDefault();
					self.commitEdit(index);
					self.tailInputEl.focus();
				}
			}
		});

		input.addEventListener('blur', function() {
			setTimeout(function() {
				if (self.editingTokenIndex === index) {
					self.commitEdit(index);
				}
			}, 100);
		});

		input.addEventListener('focus', function() { self.onSearchFocus(); });

		return input;
	},

	/**
	 * Commits the inline edit — parses the edit input text and updates the token.
	 * @param {Number} index Token index
	 * @private
	 */
	commitEdit: function(index)
	{
		if (this.editingTokenIndex !== index) {
			return;
		}

		var editInput = this.tokenWrapEl.dom.querySelector('.k-search-chip-edit');
		if (!editInput) {
			this.editingTokenIndex = -1;
			this.renderTokens();
			return;
		}

		var text = editInput.value.trim();
		this.editingTokenIndex = -1;

		if (!text) {
			this.removeTokenAt(index);
			return;
		}

		var parsed = this.parseInputText(text);
		this.tokens[index] = parsed;

		this.renderTokens();
		this.syncHiddenInput();
		this.fireEvent('chipchange', this, this.getFilterChips());
	},

	/**
	 * Cancels the inline edit — restores the chip unchanged.
	 * @private
	 */
	cancelEdit: function()
	{
		this.editingTokenIndex = -1;
		this.renderTokens();
		this.tailInputEl.focus();
	},

	/**
	 * Parses a single input text string into a token object.
	 * @param {String} text
	 * @return {Object} token
	 * @private
	 */
	parseInputText: function(text)
	{
		// Strip outer quotes
		var raw = text;
		if (raw.length >= 2 &&
			((raw.charAt(0) === '"' && raw.charAt(raw.length - 1) === '"') ||
			 (raw.charAt(0) === "'" && raw.charAt(raw.length - 1) === "'"))) {
			raw = raw.substring(1, raw.length - 1);
		}

		// Check for operator
		var upper = raw.toUpperCase();
		if (upper === 'AND' || upper === 'OR' || upper === 'NOT') {
			return { type: 'operator', key: upper };
		}

		// Check for field:value
		var colonIdx = raw.indexOf(':');
		if (colonIdx > 0) {
			var key = raw.substring(0, colonIdx).toLowerCase();
			if (this.kqlFields.indexOf(key) !== -1) {
				var value = raw.substring(colonIdx + 1);
				if (value.length >= 2 &&
					((value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
					 (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'"))) {
					value = value.substring(1, value.length - 1);
				}
				return { type: 'filter', key: key, value: value };
			}
		}

		// Plain text
		return { type: 'text', value: raw };
	},

	/**
	 * Checks whether the given text has unmatched quotes (i.e. cursor is inside quotes).
	 * @param {String} text
	 * @return {Boolean}
	 * @private
	 */
	isInsideQuotes: function(text)
	{
		var dq = 0, sq = 0;
		for (var i = 0; i < text.length; i++) {
			if (text.charAt(i) === '"') { dq++; }
			else if (text.charAt(i) === "'") { sq++; }
		}
		return (dq % 2 === 1) || (sq % 2 === 1);
	},

	/**
	 * Commits the current tail input text as one or more tokens.
	 * Called when Space, Tab, or closing quote triggers chip creation.
	 * @private
	 */
	commitTailInput: function()
	{
		var text = this.tailInputEl.dom.value.trim();
		if (!text) {
			return;
		}

		this.tailInputEl.dom.value = '';

		var parsed = this.parseInputText(text);
		this.tokens.push(parsed);

		this.renderTokens();
		this.syncHiddenInput();
		this.fireEvent('chipchange', this, this.getFilterChips());
	},

	// ===================================================================
	// Token manipulation
	// ===================================================================

	/**
	 * Removes the token at the given index, cleans up orphaned operators,
	 * and re-renders.
	 * @param {Number} index
	 * @param {Boolean} silent When true, suppress focus changes (used by panel sync)
	 */
	removeTokenAt: function(index, silent)
	{
		if (index < 0 || index >= this.tokens.length) {
			return;
		}

		this.tokens.splice(index, 1);

		// Clean up orphaned operators: leading operators, trailing operators,
		// and consecutive operators (keep the first one).
		this.cleanupOperators();

		this.renderTokens();
		this.syncHiddenInput();
		this.fireEvent('chipchange', this, this.getFilterChips());
		if (!silent) {
			this.focusTailSilent();
		}

		// If everything is empty, stop the active search to clear results
		if (this.tokens.length === 0 && !this.tailInputEl.dom.value.trim()) {
			this.stopSearch();
		}
	},

	/**
	 * Removes orphaned operators from the token array:
	 * - Leading operators (no filter/text before them)
	 * - Trailing operators (no filter/text after them)
	 * - Consecutive operators (keep first, remove rest)
	 * @private
	 */
	cleanupOperators: function()
	{
		// Remove leading operators
		while (this.tokens.length > 0 && this.tokens[0].type === 'operator') {
			this.tokens.splice(0, 1);
		}

		// Remove trailing operators
		while (this.tokens.length > 0 && this.tokens[this.tokens.length - 1].type === 'operator') {
			this.tokens.splice(this.tokens.length - 1, 1);
		}

		// Remove consecutive operators (keep first)
		for (var i = this.tokens.length - 1; i > 0; i--) {
			if (this.tokens[i].type === 'operator' && this.tokens[i - 1].type === 'operator') {
				this.tokens.splice(i, 1);
			}
		}
	},

	/**
	 * Filter keys where only one instance makes sense.
	 * A new insert replaces the existing one.
	 * @property
	 * @type Array
	 */
	singletonFilterKeys: ['date', 'unread'],

	/**
	 * Adds a new filter chip (called from the dropdown or panel sync).
	 * @param {String} filterKey
	 * @param {String} value Optional preset value for the filter
	 * @param {Boolean} silent When true, suppress focus changes (used by panel sync)
	 */
	insertFilter: function(filterKey, value, silent)
	{
		var isVirtual = this.virtualFilterKeys.indexOf(filterKey) !== -1;
		var isBooleanFilter = this.booleanFilterKeys.indexOf(filterKey) !== -1;

		// Singleton filters: replace existing token with same key
		if (this.singletonFilterKeys.indexOf(filterKey) !== -1) {
			for (var s = this.tokens.length - 1; s >= 0; s--) {
				if (this.tokens[s].type === 'filter' && this.tokens[s].key === filterKey) {
					this.tokens[s].value = value || '';
					this.renderTokens();
					this.syncHiddenInput();
					this.fireEvent('chipchange', this, this.getFilterChips());
					if (!silent) {
						this.focusTailSilent();
					}
					return;
				}
			}
		}

		// Duplicate prevention for value-based filters (e.g. type:mail)
		if (value && isVirtual) {
			for (var d = 0; d < this.tokens.length; d++) {
				if (this.tokens[d].type === 'filter' &&
					this.tokens[d].key === filterKey &&
					this.tokens[d].value === value) {
					return;
				}
			}
		}

		// For regular filters with no value from dropdown: put key: in tail for user to type value
		if (!isVirtual && !isBooleanFilter && !value && !silent) {
			this.tailInputEl.dom.value = filterKey + ':';
			this.tailInputEl.focus();
			var len = this.tailInputEl.dom.value.length;
			this.tailInputEl.dom.setSelectionRange(len, len);
			return;
		}

		// Auto-insert an explicit AND between adjacent non-operator tokens
		var last = this.tokens.length > 0 ? this.tokens[this.tokens.length - 1] : null;
		if (last && last.type !== 'operator') {
			this.tokens.push({ type: 'operator', key: 'AND' });
		}
		this.tokens.push({ type: 'filter', key: filterKey, value: value || '' });
		this.renderTokens();
		this.syncHiddenInput();
		this.fireEvent('chipchange', this, this.getFilterChips());
		if (!silent) {
			this.focusTailSilent();
		}
	},

	/**
	 * Adds a boolean operator chip (called from the dropdown).
	 * @param {String} operator 'AND' or 'OR'
	 */
	insertOperator: function(operator)
	{
		this.tokens.push({ type: 'operator', key: operator });
		this.renderTokens();
		this.syncHiddenInput();
		this.fireEvent('chipchange', this, this.getFilterChips());
		this.tailInputEl.focus();
	},

	/**
	 * Removes the first filter token that matches the given key.
	 * Called externally by SearchToolBoxPanel when a checkbox is unchecked.
	 * @param {String} filterKey
	 */
	removeFilterChip: function(filterKey, silent)
	{
		for (var i = this.tokens.length - 1; i >= 0; i--) {
			if (this.tokens[i].type === 'filter' && this.tokens[i].key === filterKey) {
				this.removeTokenAt(i, silent);
				return;
			}
		}
	},

	/**
	 * Checks if a filter chip is preceded by a NOT operator.
	 * @param {String} filterKey The filter key to check
	 * @return {Boolean} True if the filter is negated
	 */
	isFilterNegated: function(filterKey)
	{
		for (var i = 0; i < this.tokens.length; i++) {
			if (this.tokens[i].type === 'filter' && this.tokens[i].key === filterKey) {
				return (i > 0 &&
					this.tokens[i - 1].type === 'operator' &&
					this.tokens[i - 1].key === 'NOT');
			}
		}
		return false;
	},

	/**
	 * Removes the NOT operator before a filter chip, effectively
	 * un-negating it. The NOT becomes AND or is removed if at the start.
	 * @param {String} filterKey The filter key to un-negate
	 * @param {Boolean} silent When true, suppress focus changes
	 */
	removeFilterNegation: function(filterKey, silent)
	{
		for (var i = 0; i < this.tokens.length; i++) {
			if (this.tokens[i].type === 'filter' && this.tokens[i].key === filterKey) {
				if (i > 0 && this.tokens[i - 1].type === 'operator' &&
					this.tokens[i - 1].key === 'NOT') {
					// Change NOT to AND, or remove if it's the first operator
					if (i > 1) {
						this.tokens[i - 1].key = 'AND';
					} else {
						this.tokens.splice(i - 1, 1);
					}
					this.renderTokens();
					this.syncHiddenInput();
					this.fireEvent('chipchange', this, this.getFilterChips());
				}
				return;
			}
		}
	},

	/**
	 * Starts editing the last editable token.
	 * @private
	 */
	editLastToken: function()
	{
		for (var i = this.tokens.length - 1; i >= 0; i--) {
			var t = this.tokens[i];
			if (t.type === 'text' ||
				(t.type === 'filter' &&
				 this.virtualFilterKeys.indexOf(t.key) === -1 &&
				 !(this.booleanFilterKeys.indexOf(t.key) !== -1 && !t.value))) {
				this.startEditToken(i);
				return;
			}
		}
	},

	/**
	 * Focus the tail input without triggering the dropdown.
	 * Used by programmatic operations (chip sync, token removal).
	 * @private
	 */
	focusTailSilent: function()
	{
		this.suppressDropdown = true;
		this.tailInputEl.focus();
		this.suppressDropdown = false;
	},

	/**
	 * Returns an array of filter chip descriptors for external consumers.
	 * @return {Array} e.g. [{key:'from', label:'From', type:'filter'}, ...]
	 */
	getFilterChips: function()
	{
		var chips = [];
		for (var i = 0; i < this.tokens.length; i++) {
			if (this.tokens[i].type === 'filter') {
				// Check if preceded by a NOT operator
				var negated = (i > 0 &&
					this.tokens[i - 1].type === 'operator' &&
					this.tokens[i - 1].key === 'NOT');
				chips.push({
					key: this.tokens[i].key,
					value: this.tokens[i].value || '',
					label: this.filterLabels[this.tokens[i].key] || this.tokens[i].key,
					type: 'filter',
					negated: negated
				});
			}
		}
		return chips;
	},

	/**
	 * Returns active filter key strings.
	 * @return {Array}
	 */
	getActiveFilterKeys: function()
	{
		var keys = [];
		for (var i = 0; i < this.tokens.length; i++) {
			if (this.tokens[i].type === 'filter') {
				keys.push(this.tokens[i].key);
			}
		}
		return keys;
	},

	// ===================================================================
	// Tail input handling
	// ===================================================================

	/**
	 * Monitors the tail input for KQL patterns and auto-converts them
	 * to chips.
	 * @private
	 */
	onTailInput: function()
	{
		// Reset history highlight when user types
		if (this.dropdownPanel) {
			this.dropdownPanel.resetHistoryHighlight();
		}
		var text = this.tailInputEl.dom.value;

		// Auto-commit on closing quote
		if (text.length >= 2) {
			var lastChar = text.charAt(text.length - 1);
			if ((lastChar === '"' || lastChar === "'") && !this.isInsideQuotes(text)) {
				this.commitTailInput();
				return;
			}
		}

		// Auto-convert pasted content with multiple terms (contains spaces)
		if (text.indexOf(' ') !== -1 && text.indexOf(':') !== -1) {
			var parsed = this.parseQueryToTokens(text);
			if (parsed.length > 1) {
				this.tailInputEl.dom.value = '';
				for (var i = 0; i < parsed.length; i++) {
					this.tokens.push(parsed[i]);
				}
				this.renderTokens();
				this.syncHiddenInput();
				this.fireEvent('chipchange', this, this.getFilterChips());
				return;
			}
		}

		// Plain text — just sync the hidden input
		this.syncHiddenInput();
	},

	/**
	 * Handles special keys in the tail input.
	 * @private
	 */
	onTailKeyDown: function(e)
	{
		if (e.getKey() === Ext.EventObject.ENTER) {
			// If a history row is highlighted, apply it instead
			if (this.dropdownPanel && this.dropdownPanel.isVisible()) {
				var entry = this.dropdownPanel.getHighlightedEntry();
				if (entry) {
					e.preventDefault();
					this.dropdownPanel.applyHistoryEntry(entry);
					return;
				}
			}
			// Commit any uncommitted tail text first
			if (this.tailInputEl.dom.value.trim()) {
				this.commitTailInput();
			}
			this.hideDropdown();
			this.syncHiddenInput();
			this.fireEvent('chipchange', this, this.getFilterChips());
			var textValue = this.buildQuery().trim();
			var specialCharsFilter = /[#\$%\^\&*\)\(]/g;
			if (Ext.isEmpty(textValue) || textValue.match(specialCharsFilter)) {
				this.stopSearch();
			} else {
				this.onTriggerClick();
			}
		} else if (e.getKey() === Ext.EventObject.ESC) {
			this.hideDropdown();
		} else if (e.getKey() === Ext.EventObject.DOWN) {
			if (this.dropdownPanel && this.dropdownPanel.isVisible()) {
				e.preventDefault();
				this.dropdownPanel.moveHistoryHighlight(1);
			}
		} else if (e.getKey() === Ext.EventObject.UP) {
			if (this.dropdownPanel && this.dropdownPanel.isVisible()) {
				e.preventDefault();
				this.dropdownPanel.moveHistoryHighlight(-1);
			}
		} else if (e.getKey() === Ext.EventObject.TAB) {
			// Tab always commits current text as a chip
			if (this.tailInputEl.dom.value.trim()) {
				e.preventDefault();
				this.commitTailInput();
			}
		} else if (e.getKey() === 32) { // SPACE
			var tailText = this.tailInputEl.dom.value;
			if (tailText.trim() && !this.isInsideQuotes(tailText)) {
				e.preventDefault();
				this.commitTailInput();
			}
		} else if (e.getKey() === Ext.EventObject.BACKSPACE) {
			if (!this.tailInputEl.dom.value && this.tokens.length > 0) {
				e.preventDefault();
				this.removeTokenAt(this.tokens.length - 1);
			}
		} else if (e.getKey() === Ext.EventObject.LEFT) {
			if (this.tailInputEl.dom.selectionStart === 0 && this.tokens.length > 0) {
				e.preventDefault();
				this.editLastToken();
			}
		}
	},

	// ===================================================================
	// Focus / blur / dropdown
	// ===================================================================

	/**
	 * @private
	 */
	onSearchFocus: function()
	{
		if (this.tokenWrapEl) {
			this.tokenWrapEl.addClass('k-search-focused');
		}
		if (!this.suppressDropdown) {
			this.showDropdown();
		}
	},

	/**
	 * Hides the dropdown only if focus leaves the entire token container.
	 * @private
	 */
	onSearchBlur: function()
	{
		if (this.dropdownInteracting) {
			return;
		}
		// Defer so we can check if focus moved to another element
		// inside the same token wrapper (value input → tail, etc.)
		(function() {
			var active = document.activeElement;
			if (this.tokenWrapEl && this.tokenWrapEl.dom.contains(active)) {
				return;
			}
			if (this.tokenWrapEl) {
				this.tokenWrapEl.removeClass('k-search-focused');
			}
			this.hideDropdown();
		}).defer(50, this);
	},

	/**
	 * Shows the dropdown aligned below the token container.
	 */
	showDropdown: function()
	{
		if (this.dropdownPanel && this.tokenWrapEl) {
			this.dropdownPanel.showBelow(this.tokenWrapEl);
		}
	},

	/**
	 * Hides the search dropdown panel.
	 */
	hideDropdown: function()
	{
		if (this.dropdownInteracting) {
			return;
		}
		if (this.dropdownPanel) {
			this.dropdownPanel.resetHistoryHighlight();
			this.dropdownPanel.hide();
		}
	},

	// ===================================================================
	// Search actions
	// ===================================================================

	/**
	 * Stops the active search.
	 * @protected
	 */
	stopSearch: function()
	{
		if (this.fireEvent('beforestop', this) !== false) {
			this.hideMask();
			this.fireEvent('stop', this);
		}
	},

	/**
	 * Starts a search.
	 * @protected
	 */
	onTriggerClick: function()
	{
		if (this.fireEvent('beforestart', this) !== false) {
			if (Ext.isEmpty(this.getValue())) {
				this.focus();
				return false;
			}
			var searchFolder = this.searchContainer.searchFolderCombo.getValue();

			if (!container.getHierarchyStore().getFolder(searchFolder)) {
				Ext.MessageBox.show({
					title: _('Folder does not exist'),
					msg: _("The folder you are searching through no longer exists. Please select another folder"),
					buttons: Ext.MessageBox.OK
				});
				return false;
			}

			// Save search to history
			if (this.dropdownPanel) {
				this.dropdownPanel.addToHistory(
					this.getValue(),
					this.tokens.slice(0),
					this.getVirtualTokens()
				);
			}

			if (!this.searchPanelRendered) {
				var componentType = Zarafa.core.data.SharedComponentType['common.search'];
				Zarafa.core.data.UIFactory.openLayerComponent(componentType, [], {
					'searchText': this.getValue(),
					'virtualTokens': this.getVirtualTokens(),
					'parentSearchField': this,
					'parentSearchFolderCombo': this.searchContainer.searchFolderCombo
				});
			}

			if (this.tokenWrapEl) {
				this.tokenWrapEl.addClass(this.searchIndicatorClass);
			}
			this.fireEvent('start', this);
		}
	},

	/**
	 * Hides the loading indicator.
	 */
	hideMask: function()
	{
		if (this.tokenWrapEl) {
			this.tokenWrapEl.removeClass([this.searchIndicatorClass]);
		}
	},

	// ===================================================================
	// Overrides for layout compatibility
	// ===================================================================

	/**
	 * @override — focus the tail input, not the hidden field.
	 */
	focus: function()
	{
		if (this.tailInputEl) {
			this.tailInputEl.focus();
		}
	},

	/**
	 * @override — propagate width to the visible token container.
	 */
	setWidth: function(w)
	{
		Zarafa.common.searchfield.ui.SearchTextField.superclass.setWidth.call(this, w);
		if (this.tokenWrapEl) {
			this.tokenWrapEl.setWidth(w);
		}
		return this;
	},

	/**
	 * @override
	 */
	onDestroy: function()
	{
		if (this.dropdownPanel) {
			this.dropdownPanel.destroy();
			this.dropdownPanel = null;
		}
		if (this.tokenWrapEl) {
			this.tokenWrapEl.remove();
			this.tokenWrapEl = null;
		}
		Zarafa.common.searchfield.ui.SearchTextField.superclass.onDestroy.call(this);
	}
});

Ext.reg('zarafa.searchtextfield', Zarafa.common.searchfield.ui.SearchTextField);
