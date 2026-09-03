Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.CommandPalette
 * @extends Ext.Window
 * @xtype zarafa.commandpalette
 *
 * A search box over the views, folders, settings pages and the "new item"
 * actions of the main toolbar, opened with Ctrl+K.
 */
Zarafa.core.ui.CommandPalette = Ext.extend(Ext.Window, {
	/**
	 * @cfg {Number} maxResults The number of results shown for a query.
	 */
	maxResults: 15,

	/**
	 * @property {Array} commands All commands as objects with a text,
	 * a group, an optional iconCls, a browse flag and a run function.
	 */
	commands: undefined,

	/**
	 * @property {Array} results The commands currently listed.
	 */
	results: undefined,

	/**
	 * @property {Number} selected The index in {@link #results} of the highlighted command.
	 */
	selected: 0,

	/**
	 * @property {String} lastQuery The query the list was built for.
	 */
	lastQuery: '',

	/**
	 * @property {HTMLElement} returnFocusTo The element focused before the palette opened.
	 */
	returnFocusTo: undefined,

	/**
	 * @property {Object} viewIcons Icons for the views without a default folder.
	 */
	viewIcons: {
		settings: 'icon_cogwheel',
		filescontext: 'icon_folder_note'
	},

	/**
	 * @property {Object} iconOverrides Icon classes replaced in the palette, keyed
	 * by the original class. The files glyphs are a stack of pages which does not
	 * survive the small size.
	 */
	iconOverrides: {
		icon_files: 'icon_folder_note',
		icon_files_category: 'icon_folder_note'
	},

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		this.returnFocusTo = document.activeElement;
		this.listId = Ext.id();
		this.searchField = new Ext.form.TextField({
			cls: 'k-command-palette-field',
			enableKeyEvents: true,
			emptyText: _('Search folders, views, settings and actions'),
			listeners: {
				keydown: this.onKeyDown,
				keyup: this.onKeyUp,
				scope: this
			}
		});
		this.resultList = new Ext.BoxComponent({
			autoEl: {
				tag: 'div',
				id: this.listId,
				cls: 'k-command-palette-list',
				role: 'listbox',
				'aria-label': _('Results')
			}
		});
		this.hint = new Ext.BoxComponent({
			autoEl: {
				tag: 'div',
				cls: 'k-command-palette-hint-bar',
				html: Ext.util.Format.htmlEncode(_('Arrow keys or Tab select, Enter opens, Esc closes'))
			}
		});

		Ext.applyIf(config, {
			xtype: 'zarafa.commandpalette',
			cls: 'k-command-palette',
			width: 560,
			autoHeight: true,
			closable: false,
			resizable: false,
			draggable: false,
			modal: true,
			plain: true,
			border: false,
			shadow: false,
			items: [ this.searchField, this.resultList, this.hint ],
			keys: [{
				key: Ext.EventObject.ESC,
				fn: this.close,
				scope: this
			}]
		});

		Zarafa.core.ui.CommandPalette.superclass.constructor.call(this, config);
	},

	/**
	 * Adds the accessibility attributes, hooks the result list and
	 * collects the commands.
	 * @private
	 */
	afterRender: function()
	{
		Zarafa.core.ui.CommandPalette.superclass.afterRender.apply(this, arguments);

		this.el.set({ role: 'dialog', 'aria-label': _('Command palette') });
		this.searchField.el.set({
			role: 'combobox',
			'aria-autocomplete': 'list',
			'aria-expanded': 'true',
			'aria-controls': this.listId,
			'aria-label': _('Command palette'),
			// keep password managers from decorating the field
			autocomplete: 'off',
			'data-bwignore': 'true',
			'data-1p-ignore': 'true',
			'data-lpignore': 'true',
			'data-form-type': 'other'
		});

		this.mon(this.resultList.el, 'click', this.onListClick, this, { delegate: '.k-command-palette-item' });
		this.mon(this.resultList.el, 'mouseover', this.onListMouseOver, this, { delegate: '.k-command-palette-item' });

		this.commands = this.collectCommands();
		this.search('');
	},

	/**
	 * Gives the focus back to the element which had it before the palette opened.
	 * @private
	 */
	onDestroy: function()
	{
		var el = this.returnFocusTo;
		if (el && Ext.isFunction(el.focus) && document.body.contains(el)) {
			el.focus();
		}
		this.returnFocusTo = undefined;
		Zarafa.core.ui.CommandPalette.superclass.onDestroy.apply(this, arguments);
	},

	/**
	 * Places the window near the top of the viewport and focuses the field.
	 * @private
	 */
	afterShow: function()
	{
		Zarafa.core.ui.CommandPalette.superclass.afterShow.apply(this, arguments);

		var viewWidth = Ext.lib.Dom.getViewWidth();
		this.setPagePosition(Math.max(8, Math.round((viewWidth - this.getWidth()) / 2)), 96);
		if (this.mask) {
			this.mon(this.mask, 'click', this.close, this);
		}
		this.searchField.focus(false, 50);
	},

	/**
	 * @return {Array} The commands available in the palette
	 * @private
	 */
	collectCommands: function()
	{
		var commands = [];
		this.addViews(commands);
		this.addNewItems(commands);
		this.addSettings(commands);
		this.addTools(commands);
		this.addFolders(commands);
		return commands;
	},

	/**
	 * Adds the tabs of the main menu.
	 * @param {Array} commands The list to add to
	 * @private
	 */
	addViews: function(commands)
	{
		var tabbar = Ext.getCmp('zarafa-mainmenu');
		if (!tabbar) {
			return;
		}

		tabbar.items.each(function(tab) {
			if (!(tab instanceof Zarafa.core.ui.MainTab) || tab.hidden || !tab.context) {
				return;
			}
			var context = container.getContextByName(tab.context);
			var model = context ? context.getModel() : undefined;
			var folder = model && Ext.isFunction(model.getDefaultFolder) ? model.getDefaultFolder() : undefined;
			var iconCls = this.viewIcons[tab.context] || (folder ? Zarafa.common.ui.IconClass.getIconClass(folder) : '');
			commands.push({
				group: _('Views'),
				text: tab.text,
				iconCls: iconCls,
				run: function() {
					tab.selectContext();
				}
			});
		}, this);
	},

	/**
	 * Adds the entries of the "New" menu of the main toolbar.
	 * @param {Array} commands The list to add to
	 * @private
	 */
	addNewItems: function(commands)
	{
		var items = container.populateInsertionPoint('main.maintoolbar.new.item', Ext.getCmp('zarafa-maintoolbar')) || [];
		items = Zarafa.core.Util.sortArray(items, 'ASC', 'newMenuIndex');
		items = Zarafa.core.Util.uniqueArray(items, 'text');

		Ext.each(items, function(item) {
			if (!item || !Ext.isFunction(item.handler) || Ext.isEmpty(item.text)) {
				return;
			}
			commands.push({
				group: _('New'),
				text: item.text,
				iconCls: item.iconCls,
				run: function() {
					item.handler.call(item.scope || item, item);
				}
			});
		});
	},

	/**
	 * Adds the settings categories, or a single entry for the settings
	 * when their panel has not been created yet.
	 * @param {Array} commands The list to add to
	 * @private
	 */
	addSettings: function(commands)
	{
		var context = container.getContextByName('settings');
		if (!context) {
			return;
		}

		var tabs = Ext.ComponentMgr.all.filterBy(function(cmp) {
			return cmp instanceof Zarafa.settings.ui.SettingsCategoryTab;
		});
		var panel = Ext.ComponentMgr.all.filterBy(function(cmp) {
			return cmp instanceof Zarafa.settings.ui.SettingsCategoryWidgetPanel;
		}).first();

		if (!panel || tabs.getCount() === 0) {
			commands.push({
				group: _('Settings'),
				text: _('Settings'),
				iconCls: 'icon_cogwheel',
				run: function() {
					container.switchContext(context);
				}
			});
			return;
		}

		tabs.each(function(tab) {
			var category = tab.category;
			if (tab.hidden || !category || Ext.isEmpty(tab.title)) {
				return;
			}
			commands.push({
				group: _('Settings'),
				text: tab.title,
				iconCls: tab.iconCls,
				run: function() {
					if (container.getCurrentContext() !== context) {
						if (!panel.rendered) {
							context.defaultActiveTab = panel.items.indexOf(category);
						}
						container.switchContext(context);
					}
					if (panel.rendered) {
						context.setView(category.getId());
					}
				}
			});
		});
	},

	/**
	 * Adds the address book, the appearance switches and the logout.
	 * @param {Array} commands The list to add to
	 * @private
	 */
	addTools: function(commands)
	{
		commands.push({
			group: _('Tools'),
			text: _('Address Book'),
			iconCls: 'icon_small_addressbook',
			run: function() {
				Zarafa.addressbook.Actions.openAddressBook();
			}
		});

		var dark = Zarafa.core.DarkMode.isDark();
		commands.push({
			group: _('Appearance'),
			text: dark ? _('Switch to light mode') : _('Switch to dark mode'),
			run: function() {
				Zarafa.core.DarkMode.setMode(dark ? 'light' : 'dark');
			}
		});

		var compact = document.body.classList.contains('k-density-compact');
		commands.push({
			group: _('Appearance'),
			text: compact ? _('Comfortable list spacing') : _('Compact list spacing'),
			run: function() {
				container.getSettingsModel().set('zarafa/v1/main/density', compact ? 'comfortable' : 'compact');
			}
		});

		if (Ext.getCmp('mainmenu-button-logout')) {
			commands.push({
				group: _('Account'),
				text: _('Logout'),
				run: function() {
					container.logout();
				}
			});
		}
	},

	/**
	 * Adds every folder of the opened stores. Folders are only listed
	 * when the user types, the other commands are browsable.
	 * @param {Array} commands The list to add to
	 * @private
	 */
	addFolders: function(commands)
	{
		var folders = container.getHierarchyStore().getSortedFolders(function(folder) {
			return !folder.isIPMSubTree() && !folder.isFavoritesRootFolder() && !folder.isFavoritesFolder() &&
				(!folder.isSearchFolder() || folder.isTodoListFolder());
		});

		Ext.each(folders, function(folder) {
			commands.push({
				group: _('Folders'),
				text: folder.getFullyQualifiedDisplayName(),
				iconCls: Zarafa.common.ui.IconClass.getIconClass(folder),
				browse: false,
				run: function() {
					container.selectFolder(folder);
				}
			});
		});
	},

	/**
	 * Filters the commands for the given query and renders the result.
	 * @param {String} query The text typed by the user
	 * @private
	 */
	search: function(query)
	{
		query = Ext.util.Format.trim(query || '').toLowerCase();

		var results;
		if (Ext.isEmpty(query)) {
			results = this.commands.filter(function(command) {
				return command.browse !== false;
			});
		} else {
			results = [];
			Ext.each(this.commands, function(command) {
				var score = this.score(command.text, query);
				if (score > 0) {
					results.push({ command: command, score: score });
				}
			}, this);
			results.sort(function(a, b) {
				return b.score - a.score;
			});
			results = results.map(function(result) {
				return result.command;
			});
			results = results.slice(0, this.maxResults);
		}

		this.results = results;
		this.selected = 0;
		this.renderResults();
	},

	/**
	 * @param {String} text The command text
	 * @param {String} query The lower case query
	 * @return {Number} 4 for a prefix, 3 for a word start, 2 for a substring,
	 * 1 for a subsequence and 0 for no match
	 * @private
	 */
	score: function(text, query)
	{
		var lower = text.toLowerCase();
		var index = lower.indexOf(query);
		if (index === 0) {
			return 4;
		}
		if (index > 0) {
			return lower.charAt(index - 1) === ' ' ? 3 : 2;
		}

		var pos = 0;
		for (var i = 0; i < lower.length && pos < query.length; i++) {
			if (lower.charAt(i) === query.charAt(pos)) {
				pos++;
			}
		}
		return pos === query.length ? 1 : 0;
	},

	/**
	 * @private
	 */
	renderResults: function()
	{
		var html = [];
		var encode = Ext.util.Format.htmlEncode;

		if (this.results.length === 0) {
			html.push('<div class="k-command-palette-empty">' + encode(_('No matching commands')) + '</div>');
		}

		Ext.each(this.results, function(command, index) {
			html.push(String.format(
				'<div class="k-command-palette-item" role="option" id="{0}" aria-selected="false" data-index="{1}">' +
					'<span class="k-command-palette-icon {2}"></span>' +
					'<span class="k-command-palette-text">{3}</span>' +
					'<span class="k-command-palette-hint">{4}</span>' +
				'</div>',
				this.listId + '-' + index, index, encode(this.iconOverrides[command.iconCls] || command.iconCls || ''), encode(command.text), encode(command.group)));
		}, this);

		this.resultList.el.update(html.join(''));
		this.classifyIcons();
		this.updateSelection();
	},

	/**
	 * Marks every icon as a mask, which follows the text colour, or as an
	 * image, which the dark mode inverts like the iconset images elsewhere.
	 * @private
	 */
	classifyIcons: function()
	{
		var icons = this.resultList.el.query('.k-command-palette-icon');
		for (var i = 0; i < icons.length; i++) {
			var style = window.getComputedStyle(icons[i]);
			var mask = style.maskImage || style.webkitMaskImage;
			icons[i].classList.add(mask && mask !== 'none' ? 'k-command-palette-icon-mask' : 'k-command-palette-icon-image');
		}
	},

	/**
	 * Marks {@link #selected} in the list and for assistive technology.
	 * @private
	 */
	updateSelection: function()
	{
		var items = this.resultList.el.query('.k-command-palette-item');
		for (var i = 0; i < items.length; i++) {
			items[i].setAttribute('aria-selected', i === this.selected ? 'true' : 'false');
		}

		var current = items[this.selected];
		this.searchField.el.set({ 'aria-activedescendant': current ? current.id : '' });
		if (current) {
			Ext.fly(current).scrollIntoView(this.resultList.el);
		}
	},

	/**
	 * @param {Number} delta The number of entries to move the selection by
	 * @private
	 */
	move: function(delta)
	{
		if (Ext.isEmpty(this.results)) {
			return;
		}
		if (Math.abs(delta) > 1) {
			this.select(Math.max(0, Math.min(this.results.length - 1, this.selected + delta)));
		} else {
			this.select((this.selected + delta + this.results.length) % this.results.length);
		}
	},

	/**
	 * @param {Number} index The entry to highlight
	 * @private
	 */
	select: function(index)
	{
		if (Ext.isEmpty(this.results)) {
			return;
		}
		this.selected = index;
		this.updateSelection();
	},

	/**
	 * Closes the palette and runs the highlighted command.
	 * @private
	 */
	runSelected: function()
	{
		var command = this.results[this.selected];
		if (!command) {
			return;
		}
		this.close();
		command.run();
	},

	/**
	 * @param {Ext.form.TextField} field The search field
	 * @param {Ext.EventObject} e The keydown event
	 * @private
	 */
	onKeyDown: function(field, e)
	{
		switch (e.getKey()) {
			case e.DOWN:
				e.stopEvent();
				this.move(1);
				break;
			case e.UP:
				e.stopEvent();
				this.move(-1);
				break;
			case e.TAB:
				e.stopEvent();
				this.move(e.shiftKey ? -1 : 1);
				break;
			case e.PAGE_DOWN:
				e.stopEvent();
				this.move(5);
				break;
			case e.PAGE_UP:
				e.stopEvent();
				this.move(-5);
				break;
			case e.HOME:
			case e.END:
				// only when the field is empty, otherwise the caret moves
				if (Ext.isEmpty(field.getRawValue())) {
					e.stopEvent();
					this.select(e.getKey() === e.HOME ? 0 : this.results.length - 1);
				}
				break;
			case e.ENTER:
				e.stopEvent();
				this.runSelected();
				break;
		}
	},

	/**
	 * @param {Ext.form.TextField} field The search field
	 * @param {Ext.EventObject} e The keyup event
	 * @private
	 */
	onKeyUp: function(field, e)
	{
		var value = field.getRawValue();
		if (value !== this.lastQuery) {
			this.lastQuery = value;
			this.search(value);
		}
	},

	/**
	 * @param {Ext.EventObject} e The mouseover event
	 * @param {HTMLElement} target The hovered entry
	 * @private
	 */
	onListMouseOver: function(e, target)
	{
		var index = parseInt(target.getAttribute('data-index'), 10);
		if (index !== this.selected) {
			this.selected = index;
			this.updateSelection();
		}
	},

	/**
	 * @param {Ext.EventObject} e The click event
	 * @param {HTMLElement} target The clicked entry
	 * @private
	 */
	onListClick: function(e, target)
	{
		e.stopEvent();
		this.selected = parseInt(target.getAttribute('data-index'), 10);
		this.runSelected();
	}
});

/**
 * Opens the palette, or closes the one which is open.
 * @static
 */
Zarafa.core.ui.CommandPalette.toggle = function()
{
	var current = Zarafa.core.ui.CommandPalette.current;
	if (current) {
		current.close();
		return;
	}

	current = Zarafa.core.ui.CommandPalette.current = new Zarafa.core.ui.CommandPalette();
	current.on('destroy', function() {
		Zarafa.core.ui.CommandPalette.current = undefined;
	});
	current.show();
};

Ext.reg('zarafa.commandpalette', Zarafa.core.ui.CommandPalette);
