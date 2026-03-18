Ext.ns('Zarafa.common.searchfield.ui');

/**
 * @class Zarafa.common.searchfield.ui.SearchDropdownPanel
 * @extends Ext.Panel
 *
 * A dropdown panel shown below the search field on focus. Provides quick access
 * to recent search history, KQL filter fields and folder scope selection.
 */
Zarafa.common.searchfield.ui.SearchDropdownPanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Zarafa.common.searchfield.ui.SearchTextField} searchTextField
	 * The parent search text field that owns this dropdown.
	 */
	searchTextField: undefined,

	/**
	 * @cfg {Zarafa.common.searchfield.ui.SearchFolderCombo} searchFolderCombo
	 * The folder combo for folder scope selection.
	 */
	searchFolderCombo: undefined,

	/**
	 * The currently highlighted history row index (-1 = none).
	 * @property
	 * @type Number
	 */
	historyIndex: -1,

	/**
	 * The localStorage key for search history.
	 * @property
	 * @type String
	 */
	historyStorageKey: 'grommunio_search_history',

	/**
	 * Maximum number of history entries to keep.
	 * @property
	 * @type Number
	 */
	historyMax: 25,

	/**
	 * The available KQL filter definitions.
	 * @property
	 * @type Array
	 */
	filterFields: [
		{ key: 'subject', label: _('Subject') },
		{ key: 'from', label: _('From') },
		{ key: 'to', label: _('To') },
		{ key: 'cc', label: _('Cc') },
		{ key: 'bcc', label: _('Bcc') },
		{ key: 'body', label: _('Body') },
		{ key: 'attachment', label: _('Attachment') },
		{ key: 'category', label: _('Category') },
		{ key: 'unread', label: _('Unread'), value: 'true' }
	],

	/**
	 * Message type options for the dropdown.
	 * @property
	 * @type Array
	 */
	typeOptions: [
		{ value: 'mail', label: _('Mails') },
		{ value: 'appointment', label: _('Appointments') },
		{ value: 'contact', label: _('Contacts') },
		{ value: 'task', label: _('Tasks') },
		{ value: 'note', label: _('Notes') }
	],

	/**
	 * Date range options for the dropdown.
	 * @property
	 * @type Array
	 */
	dateOptions: [
		{ value: 'past_week', label: _('Past week') },
		{ value: 'past_two_weeks', label: _('Past 2 weeks') },
		{ value: 'past_month', label: _('Past month') },
		{ value: 'past_six_month', label: _('Past 6 month') },
		{ value: 'past_year', label: _('Past year') }
	],

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			floating: true,
			shadow: false,
			border: false,
			cls: 'k-search-dropdown',
			renderTo: Ext.getBody(),
			hidden: true,
			autoHeight: true,
			width: 340
		});

		Zarafa.common.searchfield.ui.SearchDropdownPanel.superclass.constructor.call(this, config);
	},

	/**
	 * @override
	 */
	onRender: function(ct, position)
	{
		Zarafa.common.searchfield.ui.SearchDropdownPanel.superclass.onRender.call(this, ct, position);
		this.buildDropdownContent();
	},

	// =================================================================
	// Search history (localStorage)
	// =================================================================

	/**
	 * Loads search history from localStorage.
	 * Each entry: { query: String, tokens: Array, virtualTokens: Array, time: Number }
	 * @return {Array}
	 */
	getHistory: function()
	{
		try {
			var raw = window.localStorage.getItem(this.historyStorageKey);
			if (raw) {
				var entries = JSON.parse(raw);
				if (Ext.isArray(entries)) {
					return entries;
				}
			}
		} catch (e) {}
		return [];
	},

	/**
	 * Saves search history to localStorage.
	 * @param {Array} entries
	 * @private
	 */
	saveHistory: function(entries)
	{
		try {
			window.localStorage.setItem(this.historyStorageKey,
				JSON.stringify(entries.slice(0, this.historyMax)));
		} catch (e) {}
	},

	/**
	 * Adds a search to the history. Deduplicates by query string.
	 * @param {String} query The KQL query string
	 * @param {Array} tokens All token objects
	 * @param {Array} virtualTokens Virtual-only tokens
	 */
	addToHistory: function(query, tokens, virtualTokens)
	{
		if (!query && (!tokens || !tokens.length)) {
			return;
		}

		// Build a display string from all tokens for history rendering
		var display = this.buildDisplayString(tokens);
		if (!display) {
			return;
		}

		var entries = this.getHistory();

		// Remove existing entry with same display string (case-insensitive)
		var lowerDisplay = display.toLowerCase();
		entries = entries.filter(function(e) {
			return (e.display || e.query || '').toLowerCase() !== lowerDisplay;
		});

		// Add to front
		entries.unshift({
			query: query || '',
			display: display,
			tokens: tokens || [],
			virtualTokens: virtualTokens || [],
			time: Date.now()
		});

		// Cap at max
		this.saveHistory(entries);
	},

	/**
	 * Builds a human-readable display string from tokens.
	 * @param {Array} tokens
	 * @return {String}
	 * @private
	 */
	buildDisplayString: function(tokens)
	{
		if (!tokens || !tokens.length) {
			return '';
		}
		var tf = this.searchTextField;
		var parts = [];
		for (var i = 0; i < tokens.length; i++) {
			var t = tokens[i];
			if (t.type === 'filter') {
				var label = (tf && tf.filterLabels && tf.filterLabels[t.key]) || t.key;
				if (t.value) {
					var valLabels = tf && tf.valueLabels && tf.valueLabels[t.key];
					var valLabel = (valLabels && valLabels[t.value]) || t.value;
					parts.push(label + ': ' + valLabel);
				} else {
					parts.push(label);
				}
			} else if (t.type === 'operator') {
				parts.push(t.key);
			} else if (t.type === 'text') {
				parts.push(t.value);
			}
		}
		return parts.join(' ');
	},

	/**
	 * Removes a history entry by index.
	 * @param {Number} index
	 */
	removeHistoryEntry: function(index)
	{
		var entries = this.getHistory();
		if (index >= 0 && index < entries.length) {
			entries.splice(index, 1);
			this.saveHistory(entries);
			this.updateHistory();
		}
	},

	// =================================================================
	// Dropdown content building
	// =================================================================

	/**
	 * Builds the HTML content for the dropdown panel.
	 * @private
	 */
	buildDropdownContent: function()
	{
		var html = '<div class="k-search-dropdown-inner">';
		var enc = Ext.util.Format.htmlEncode;
		var i;

		// Recent searches section (populated dynamically)
		html += '<div class="k-search-dropdown-section k-search-history-section" id="' + this.getId() + '-history" style="display:none">';
		html += '<div class="k-search-dropdown-header">' + enc(_('Recent searches')) + '</div>';
		html += '<div class="k-search-history-list" role="listbox" aria-label="' + enc(_('Recent searches')) + '" id="' + this.getId() + '-history-list"></div>';
		html += '</div>';

		// Filter fields section
		html += '<div class="k-search-dropdown-section">';
		html += '<div class="k-search-dropdown-header">' + enc(_('Filter by')) + '</div>';
		html += '<div class="k-search-dropdown-filters">';
		for (i = 0; i < this.filterFields.length; i++) {
			var f = this.filterFields[i];
			html += '<span class="k-search-filter-option" role="option" tabindex="-1" data-filter-key="' + f.key + '"';
			if (f.value) {
				html += ' data-filter-value="' + enc(f.value) + '"';
			}
			html += '>';
			html += '<span class="k-search-filter-label">' + enc(f.label) + '</span>';
			html += '</span>';
		}
		html += '</div>';
		html += '</div>';

		// Message type + operators section (combined)
		html += '<div class="k-search-dropdown-section">';
		html += '<div class="k-search-dropdown-header">' + enc(_('Show')) + ' / ' + enc(_('Operators')) + '</div>';
		html += '<div class="k-search-dropdown-filters">';
		for (i = 0; i < this.typeOptions.length; i++) {
			var t = this.typeOptions[i];
			html += '<span class="k-search-filter-option k-search-type-option" role="option" tabindex="-1" data-filter-key="type" data-filter-value="' + t.value + '">';
			html += '<span class="k-search-filter-label">' + enc(t.label) + '</span>';
			html += '</span>';
		}
		// Inline separator + operators
		html += '<span class="k-search-dropdown-sep"></span>';
		html += '<span class="k-search-operator-option" role="option" tabindex="-1" data-operator="AND">' + enc(_('AND')) + '</span>';
		html += '<span class="k-search-operator-option" role="option" tabindex="-1" data-operator="OR">' + enc(_('OR')) + '</span>';
		html += '<span class="k-search-operator-option" role="option" tabindex="-1" data-operator="NOT">' + enc(_('NOT')) + '</span>';
		html += '</div>';
		html += '</div>';

		// Date range section
		html += '<div class="k-search-dropdown-section">';
		html += '<div class="k-search-dropdown-header">' + enc(_('Date')) + '</div>';
		html += '<div class="k-search-dropdown-filters">';
		for (i = 0; i < this.dateOptions.length; i++) {
			var d = this.dateOptions[i];
			html += '<span class="k-search-filter-option k-search-date-option" role="option" tabindex="-1" data-filter-key="date" data-filter-value="' + d.value + '">';
			html += '<span class="k-search-filter-label">' + enc(d.label) + '</span>';
			html += '</span>';
		}
		html += '</div>';
		html += '</div>';

		// Folder scope section
		html += '<div class="k-search-dropdown-section k-search-dropdown-folder-section">';
		html += '<div class="k-search-dropdown-header">' + enc(_('Search in')) + '</div>';
		html += '<div class="k-search-dropdown-folders" role="listbox" aria-label="' + enc(_('Search in')) + '" id="' + this.getId() + '-folders"></div>';
		html += '</div>';

		html += '</div>';

		this.body.update(html);

		// Bind click handlers
		this.body.on('click', this.onFilterClick, this, { delegate: '.k-search-filter-option' });
		this.body.on('click', this.onOperatorClick, this, { delegate: '.k-search-operator-option' });
		this.body.on('click', this.onFolderClick, this, { delegate: '.k-search-folder-option' });
		this.body.on('click', this.onHistoryClick, this, { delegate: '.k-search-history-row' });
		this.body.on('click', this.onHistoryRemoveClick, this, { delegate: '.k-search-history-remove' });
	},

	/**
	 * Updates the recent searches section in the dropdown.
	 */
	updateHistory: function()
	{
		var sectionEl = Ext.get(this.getId() + '-history');
		var listEl = Ext.get(this.getId() + '-history-list');
		if (!sectionEl || !listEl) {
			return;
		}

		var entries = this.getHistory();
		this.historyIndex = -1;

		if (!entries.length) {
			sectionEl.setDisplayed(false);
			return;
		}

		var enc = Ext.util.Format.htmlEncode;
		var html = '';
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			var display = entry.display || entry.query || '';
			html += '<div class="k-search-history-row" role="option" tabindex="-1" data-history-index="' + i + '">';
			html += '<span class="k-search-history-icon" aria-hidden="true"></span>';
			html += '<span class="k-search-history-text">' + enc(display) + '</span>';
			html += '<span class="k-search-history-remove" role="button" tabindex="-1" aria-label="' + enc(_('Remove')) + '" data-history-index="' + i + '">&times;</span>';
			html += '</div>';
		}

		listEl.update(html);
		sectionEl.setDisplayed(true);
	},

	/**
	 * Moves the keyboard highlight in the history list.
	 * @param {Number} direction 1 for down, -1 for up
	 * @return {Boolean} true if a row was highlighted
	 */
	moveHistoryHighlight: function(direction)
	{
		var listEl = Ext.get(this.getId() + '-history-list');
		if (!listEl) {
			return false;
		}
		var rows = listEl.dom.querySelectorAll('.k-search-history-row');
		if (!rows.length) {
			return false;
		}

		// Clear current highlight
		if (this.historyIndex >= 0 && this.historyIndex < rows.length) {
			Ext.fly(rows[this.historyIndex]).removeClass('k-search-history-active');
		}

		// Compute new index
		var newIndex = this.historyIndex + direction;
		if (newIndex < -1) {
			newIndex = rows.length - 1; // wrap to bottom
		} else if (newIndex >= rows.length) {
			newIndex = -1; // wrap past top = deselect
		}

		this.historyIndex = newIndex;

		if (this.historyIndex >= 0 && this.historyIndex < rows.length) {
			var row = rows[this.historyIndex];
			Ext.fly(row).addClass('k-search-history-active');
			// Scroll into view if needed
			row.scrollIntoView({ block: 'nearest' });
			return true;
		}
		return false;
	},

	/**
	 * Returns the currently highlighted history entry, or null.
	 * @return {Object|null}
	 */
	getHighlightedEntry: function()
	{
		if (this.historyIndex < 0) {
			return null;
		}
		var entries = this.getHistory();
		return entries[this.historyIndex] || null;
	},

	/**
	 * Resets the history highlight to none.
	 */
	resetHistoryHighlight: function()
	{
		if (this.historyIndex >= 0) {
			var listEl = Ext.get(this.getId() + '-history-list');
			if (listEl) {
				var rows = listEl.dom.querySelectorAll('.k-search-history-row');
				if (this.historyIndex < rows.length) {
					Ext.fly(rows[this.historyIndex]).removeClass('k-search-history-active');
				}
			}
		}
		this.historyIndex = -1;
	},

	/**
	 * Handler for clicking a history row.
	 * @param {Ext.EventObject} e
	 * @param {HTMLElement} target
	 * @private
	 */
	onHistoryClick: function(e, target)
	{
		// Don't trigger if the remove button was clicked
		if (Ext.fly(e.getTarget()).hasClass('k-search-history-remove')) {
			return;
		}
		var el = Ext.fly(target);
		if (!el.hasClass('k-search-history-row')) {
			el = el.findParent('.k-search-history-row', 3, true);
		}
		if (!el) {
			return;
		}
		var idx = parseInt(el.getAttribute('data-history-index'), 10);
		var entries = this.getHistory();
		if (idx >= 0 && idx < entries.length) {
			this.applyHistoryEntry(entries[idx]);
		}
	},

	/**
	 * Handler for clicking the remove button on a history row.
	 * @param {Ext.EventObject} e
	 * @param {HTMLElement} target
	 * @private
	 */
	onHistoryRemoveClick: function(e, target)
	{
		e.stopEvent();
		var el = Ext.fly(target);
		if (!el.hasClass('k-search-history-remove')) {
			return;
		}
		var idx = parseInt(el.getAttribute('data-history-index'), 10);
		this.removeHistoryEntry(idx);
	},

	/**
	 * Applies a history entry to the search field and triggers search.
	 * @param {Object} entry
	 */
	applyHistoryEntry: function(entry)
	{
		if (!entry || !this.searchTextField) {
			return;
		}

		var tf = this.searchTextField;

		// Restore tokens directly
		tf.tokens = [];
		if (entry.tokens && entry.tokens.length) {
			for (var i = 0; i < entry.tokens.length; i++) {
				tf.tokens.push({
					type: entry.tokens[i].type,
					key: entry.tokens[i].key || '',
					value: entry.tokens[i].value || ''
				});
			}
		}

		// Clear the tail input
		if (tf.tailInputEl) {
			tf.tailInputEl.dom.value = '';
		}

		tf.renderTokens();
		tf.syncHiddenInput();
		tf.fireEvent('chipchange', tf, tf.getFilterChips());

		this.hide();

		// Trigger search
		tf.onTriggerClick();
	},

	/**
	 * Updates the folder list in the dropdown based on the SearchFolderCombo store.
	 */
	updateFolders: function()
	{
		var foldersEl = Ext.get(this.getId() + '-folders');
		if (!foldersEl || !this.searchFolderCombo) {
			return;
		}

		var store = this.searchFolderCombo.getStore();
		var currentValue = this.searchFolderCombo.getValue();
		var html = '';

		store.each(function(record) {
			var value = record.get('value');
			var name = Ext.util.Format.htmlEncode(record.get('name'));
			var isActive = (value === currentValue) ? ' k-active' : '';

			if (value === 'other') {
				html += '<div class="k-search-folder-option k-search-folder-other' + isActive + '" role="option" tabindex="-1"' + (isActive ? ' aria-selected="true"' : '') + ' data-folder-value="other">';
				html += '<span class="k-search-folder-icon icon_folder_browse" aria-hidden="true"></span>';
				html += '<span>' + name + '</span>';
				html += '</div>';
			} else {
				html += '<div class="k-search-folder-option' + isActive + '" role="option" tabindex="-1"' + (isActive ? ' aria-selected="true"' : '') + ' data-folder-value="' + Ext.util.Format.htmlEncode(value) + '">';
				html += '<span class="k-search-folder-icon icon_folder_small" aria-hidden="true"></span>';
				html += '<span>' + name + '</span>';
				if (isActive) {
					html += '<span class="k-search-folder-check" aria-hidden="true">&#10003;</span>';
				}
				html += '</div>';
			}
		}, this);

		foldersEl.update(html);
	},

	/**
	 * Handler for clicking a filter option in the dropdown.
	 * @param {Ext.EventObject} e The event
	 * @param {HTMLElement} target The target element
	 * @private
	 */
	onFilterClick: function(e, target)
	{
		var el = Ext.fly(target);
		if (!el.hasClass('k-search-filter-option')) {
			el = el.findParent('.k-search-filter-option', 3, true);
		}
		if (el) {
			var filterKey = el.getAttribute('data-filter-key');
			var filterValue = el.getAttribute('data-filter-value');
			if (filterKey) {
				this.searchTextField.insertFilter(filterKey, filterValue || '');
			}
		}
	},

	/**
	 * Handler for clicking an operator option (AND/OR) in the dropdown.
	 * @param {Ext.EventObject} e The event
	 * @param {HTMLElement} target The target element
	 * @private
	 */
	onOperatorClick: function(e, target)
	{
		var el = Ext.fly(target);
		if (!el.hasClass('k-search-operator-option')) {
			el = el.findParent('.k-search-operator-option', 3, true);
		}
		if (el) {
			var operator = el.getAttribute('data-operator');
			if (operator) {
				this.searchTextField.insertOperator(operator);
			}
		}
	},

	/**
	 * Handler for clicking a folder option in the dropdown.
	 * @param {Ext.EventObject} e The event
	 * @param {HTMLElement} target The target element
	 * @private
	 */
	onFolderClick: function(e, target)
	{
		var el = Ext.fly(target);
		if (!el.hasClass('k-search-folder-option')) {
			el = el.findParent('.k-search-folder-option', 3, true);
		}
		if (!el) {
			return;
		}

		var folderValue = el.getAttribute('data-folder-value');
		if (!folderValue) {
			return;
		}

		if (folderValue === 'other') {
			this.hide();
			Zarafa.advancesearch.Actions.openSelectSearchFolderDialog({
				searchFolderCombo: this.searchFolderCombo,
				model: this.searchFolderCombo.model
			});
		} else {
			var store = this.searchFolderCombo.getStore();
			var recordIndex = store.find('value', folderValue);
			if (recordIndex !== -1) {
				var record = store.getAt(recordIndex);
				this.searchFolderCombo.setValue(folderValue);
				this.searchFolderCombo.fireEvent('select', this.searchFolderCombo, record, recordIndex);
			}
			this.updateFolders();
		}

		this.searchTextField.focus();
	},

	/**
	 * Shows the dropdown aligned below the search field.
	 * @param {Ext.Element} alignEl The element to align below
	 */
	showBelow: function(alignEl)
	{
		if (!this.rendered) {
			this.render(Ext.getBody());
		}

		this.alignEl = alignEl;
		this.updateHistory();
		this.updateFolders();
		this.syncSize();

		this.show();
		this.el.alignTo(alignEl, 'tl-bl', [-4, 1]);
		this.el.setStyle('z-index', '20000');

		if (!this.resizeBound) {
			this.resizeBound = true;
			if (window.ResizeObserver) {
				this.resizeObserver = new ResizeObserver(this.onAlignElResize.createDelegate(this));
				this.resizeObserver.observe(alignEl.dom);
			} else {
				Ext.EventManager.onWindowResize(this.onAlignElResize, this);
			}
		}
	},

	/**
	 * Syncs dropdown width with the alignment element.
	 * @private
	 */
	syncSize: function()
	{
		if (!this.alignEl) {
			return;
		}
		var width = this.alignEl.getWidth() + 3;
		if (width > 280) {
			this.setWidth(width);
		}
	},

	/**
	 * Handler called when the alignment element or window resizes.
	 * Re-syncs dropdown width and position.
	 * @private
	 */
	onAlignElResize: function()
	{
		if (!this.isVisible() || !this.alignEl) {
			return;
		}
		this.syncSize();
		this.el.alignTo(this.alignEl, 'tl-bl', [-4, 1]);
	},

	/**
	 * @override
	 */
	beforeDestroy: function()
	{
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
		Zarafa.common.searchfield.ui.SearchDropdownPanel.superclass.beforeDestroy.call(this);
	}
});
