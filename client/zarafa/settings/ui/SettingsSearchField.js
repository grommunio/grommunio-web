Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsSearchField
 * @extends Ext.form.TriggerField
 * @xtype zarafa.settingssearchfield
 *
 * Filters the settings by the texts they show: widget titles, field
 * labels, checkbox labels, buttons and combo options. Categories without
 * a match disappear from the tab list, widgets without a match are hidden
 * and the matching labels of the active category are highlighted.
 */
Zarafa.settings.ui.SettingsSearchField = Ext.extend(Ext.form.TriggerField, {
	/**
	 * @cfg {Zarafa.settings.SettingsContext} context The settings context.
	 */
	context: undefined,

	/**
	 * One entry per category: the category, its tab and the units
	 * (direct children of the category) with the texts they contain.
	 * Built on the first search.
	 * @property
	 * @type Array
	 * @private
	 */
	index: undefined,

	/**
	 * The elements which currently carry the highlight class.
	 * @property
	 * @type Array
	 * @private
	 */
	hits: undefined,

	/**
	 * The lowercased words of the current search, empty when not searching.
	 * @property
	 * @type Array
	 * @private
	 */
	words: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls: 'k-settings-search',
			triggerClass: 'k-settings-search-clear',
			emptyText: _('Search settings'),
			enableKeyEvents: true
		});

		Zarafa.settings.ui.SettingsSearchField.superclass.constructor.call(this, config);

		this.hits = [];
		this.words = [];
		this.searchTask = new Ext.util.DelayedTask(this.search, this);

		this.on('keyup', this.onSearchKeyUp, this);
		if (this.context) {
			this.mon(this.context, 'viewchange', this.onViewChange, this, { delay: 1 });
		}
	},

	/**
	 * Adds the search icon and the accessibility attributes.
	 * @private
	 */
	onRender: function()
	{
		Zarafa.settings.ui.SettingsSearchField.superclass.onRender.apply(this, arguments);

		this.wrap.addClass('k-settings-search-wrap');
		this.wrap.createChild({ tag: 'span', cls: 'k-settings-search-icon' }, this.el);
		this.el.set({
			'aria-label': _('Search settings'),
			'data-bwignore': 'true',
			'data-lpignore': 'true',
			'data-1p-ignore': 'true'
		});
		this.trigger.set({ title: _('Clear search') });
		this.trigger.setDisplayed(false);

		this.status = this.wrap.createChild({
			tag: 'div',
			cls: 'k-settings-search-status',
			'aria-live': 'polite'
		});
	},

	/**
	 * Ext shrinks the input by its padding and the wrapper to input plus
	 * trigger; size both to the width the layout hands out.
	 * @param {Number} w The width
	 * @param {Number} h The height
	 * @private
	 */
	onResize: function(w, h)
	{
		Zarafa.settings.ui.SettingsSearchField.superclass.onResize.call(this, w, h);

		if (Ext.isNumber(w)) {
			this.wrap.setWidth(w);
			this.el.setStyle('width', (w - this.wrap.getFrameWidth('lr') - this.getTriggerWidth()) + 'px');
		}
	},

	/**
	 * Returns the panel showing the category tabs.
	 * @return {Zarafa.settings.ui.SettingsCategoryPanel} The tab panel
	 * @private
	 */
	getTabPanel: function()
	{
		return this.findParentByType('zarafa.settingsmainpanel').findByType('zarafa.settingscategorypanel')[0];
	},

	/**
	 * Returns the panel holding the categories.
	 * @return {Zarafa.settings.ui.SettingsCategoryWidgetPanel} The widget panel
	 * @private
	 */
	getWidgetPanel: function()
	{
		return this.findParentByType('zarafa.settingsmainpanel').findByType('zarafa.settingscategorywidgetpanel')[0];
	},

	/**
	 * Escape clears the search, Enter jumps to the first category with
	 * a match, everything else searches after a short pause.
	 * @param {Ext.form.Field} field This field
	 * @param {Ext.EventObject} e The key event
	 * @private
	 */
	onSearchKeyUp: function(field, e)
	{
		if (e.getKey() === e.ESC) {
			this.clear();
		} else if (e.getKey() === e.ENTER) {
			this.searchTask.cancel();
			this.search();
			this.showFirstMatch();
		} else {
			this.searchTask.delay(150);
		}
	},

	/**
	 * The trigger clears the search.
	 * @private
	 */
	onTriggerClick: function()
	{
		this.clear();
		this.focus();
	},

	/**
	 * Clears the field and restores all categories and widgets.
	 */
	clear: function()
	{
		this.searchTask.cancel();
		this.setValue('');
		this.search();
	},

	/**
	 * Collects the texts of every category once.
	 * @private
	 */
	buildIndex: function()
	{
		var tabs = this.getTabPanel().items;

		this.index = [];
		this.getWidgetPanel().items.each(function(category) {
			var entry = {
				category: category,
				tab: tabs.find(function(tab) {
					return tab.isTabForId && tab.isTabForId(category.id);
				}),
				units: []
			};

			category.items.each(function(unit) {
				var texts = [];
				this.collectTexts(unit, texts);
				entry.units.push({
					cmp: unit,
					texts: texts,
					all: Ext.pluck(texts, 'text').join(' ')
				});
			}, this);

			this.index.push(entry);
		}, this);
	},

	/**
	 * Adds the texts shown by a component and its children.
	 * @param {Ext.Component} cmp The component
	 * @param {Array} texts The collected texts
	 * @private
	 */
	collectTexts: function(cmp, texts)
	{
		var own = [];

		Ext.each(['title', 'fieldLabel', 'boxLabel', 'text'], function(prop) {
			if (Ext.isString(cmp[prop]) && cmp[prop]) {
				own.push(cmp[prop]);
			}
		});
		if (cmp instanceof Ext.form.DisplayField && Ext.isString(cmp.value)) {
			own.push(cmp.value);
		} else if (Ext.isString(cmp.html) && !cmp.items) {
			own.push(cmp.html);
		}
		if (cmp instanceof Ext.form.ComboBox && cmp.store && cmp.displayField && cmp.store.getCount() <= 50) {
			cmp.store.each(function(record) {
				var value = record.get(cmp.displayField);
				if (Ext.isString(value)) {
					own.push(value);
				}
			});
		}

		if (own.length) {
			texts.push({ cmp: cmp, text: Ext.util.Format.stripTags(own.join(' ')).toLowerCase() });
		}

		if (cmp.items && cmp.items.each) {
			cmp.items.each(function(child) {
				this.collectTexts(child, texts);
			}, this);
		}
	},

	/**
	 * Applies the current value: hides the tabs without a match, filters and
	 * highlights the active category and switches to the first category with
	 * matches when the active one has none. Widgets of other categories are
	 * only touched once they are shown, as hidden widgets do not render.
	 * @private
	 */
	search: function()
	{
		var term = String(this.getValue() || '').toLowerCase();
		var words = term.split(/\s+/).filter(Boolean);
		var active = this.getWidgetPanel().getLayout().activeItem;
		var first, activeEntry, total = 0;

		if (!this.index) {
			this.buildIndex();
		}
		this.words = words;
		this.trigger.setDisplayed(words.length > 0);

		Ext.each(this.index, function(entry) {
			entry.count = 0;
			Ext.each(entry.units, function(unit) {
				unit.match = words.length > 0 && words.every(function(word) {
					return unit.all.indexOf(word) !== -1;
				});
				if (unit.match) {
					entry.count++;
				}
				if (!words.length) {
					this.setUnitVisible(unit, true);
				}
			}, this);

			total += entry.count;
			if (entry.count && !first) {
				first = entry;
			}
			if (entry.category === active) {
				activeEntry = entry;
			}
			this.updateTab(entry, words.length ? entry.count : -1);
		}, this);

		this.status.update(!words.length ? '' : total ? String.format(ngettext('{0} setting matches', '{0} settings match', total), total) : _('No settings match'));
		this.status[total || !words.length ? 'removeClass' : 'addClass']('k-settings-search-status-empty');

		this.applyToCategory(activeEntry);
		if (words.length && first && activeEntry && !activeEntry.count && !this.context.getModel().hasChanges()) {
			this.context.setView(first.category.id);
		}
	},

	/**
	 * Hides the units without a match in a shown category and highlights the rest.
	 * @param {Object} entry The index entry of the category
	 * @private
	 */
	applyToCategory: function(entry)
	{
		if (!entry) {
			return;
		}

		Ext.each(entry.units, function(unit) {
			this.setUnitVisible(unit, !this.words.length || unit.match);
		}, this);
		entry.category.doLayout();
		this.highlight(entry);
	},

	/**
	 * Switches to the first category with matches.
	 * @private
	 */
	showFirstMatch: function()
	{
		var first;

		Ext.each(this.index, function(entry) {
			if (entry.count) {
				first = entry;
				return false;
			}
		});
		if (first) {
			this.context.setView(first.category.id);
		}
	},

	/**
	 * Hides or shows a unit, remembering which ones the search hid so
	 * widgets hidden for other reasons stay hidden.
	 * @param {Object} unit The index entry of the unit
	 * @param {Boolean} visible True to show the unit
	 * @private
	 */
	setUnitVisible: function(unit, visible)
	{
		if (!visible && !unit.cmp.hidden) {
			unit.cmp.hide();
			unit.hid = true;
		} else if (visible && unit.hid) {
			unit.cmp.show();
			unit.hid = false;
		}
	},

	/**
	 * Hides a tab without matches and shows the number of matches on the others.
	 * @param {Object} entry The index entry of the category
	 * @param {Number} count The number of matching units, -1 when not searching
	 * @private
	 */
	updateTab: function(entry, count)
	{
		var tab = entry.tab;
		if (!tab || !tab.rendered) {
			return;
		}

		var badge = tab.el.child('.k-settings-tab-count');
		if (count > 0) {
			if (!badge) {
				badge = tab.el.createChild({ tag: 'span', cls: 'k-settings-tab-count' });
			}
			badge.update(String(count));
		} else if (badge) {
			badge.remove();
		}

		if (count === 0 && !tab.hidden) {
			tab.hide();
			entry.tabHid = true;
		} else if (count !== 0 && entry.tabHid) {
			tab.show();
			entry.tabHid = false;
		}
	},

	/**
	 * Highlights the labels of the matching components in a category.
	 * @param {Object} entry The index entry of the category
	 * @private
	 */
	highlight: function(entry)
	{
		var words = this.words;

		Ext.each(this.hits, function(el) {
			el.removeClass('k-settings-hit');
		});
		this.hits = [];

		if (!entry || !words.length) {
			return;
		}

		Ext.each(entry.units, function(unit) {
			if (!unit.match) {
				return;
			}
			Ext.each(unit.texts, function(text) {
				var matches = words.some(function(word) {
					return text.text.indexOf(word) !== -1;
				});
				if (matches) {
					Ext.each(this.getHitElements(text.cmp), function(el) {
						el.addClass('k-settings-hit');
						this.hits.push(el);
					}, this);
				}
			}, this);
		}, this);
	},

	/**
	 * Returns the elements which show the texts of a component.
	 * @param {Ext.Component} cmp The component
	 * @return {Ext.Element[]} The elements to highlight
	 * @private
	 */
	getHitElements: function(cmp)
	{
		var els = [];

		if (!cmp.rendered) {
			return els;
		}
		if (cmp instanceof Ext.form.Field) {
			if (cmp.label) {
				els.push(cmp.label);
			}
			if (cmp instanceof Ext.form.Checkbox && cmp.wrap) {
				els.push(cmp.wrap.child('.x-form-cb-label'));
			} else if (cmp instanceof Ext.form.DisplayField) {
				els.push(cmp.el);
			}
		} else if (cmp instanceof Ext.Panel && cmp.header) {
			els.push(cmp.header);
		} else if (cmp instanceof Ext.Button && cmp.btnEl) {
			els.push(cmp.btnEl);
		}

		return els.filter(Boolean);
	},

	/**
	 * Filters and highlights a category shown while searching.
	 * @private
	 */
	onViewChange: function()
	{
		if (!this.words.length || !this.index) {
			return;
		}

		var active = this.getWidgetPanel().getLayout().activeItem;
		Ext.each(this.index, function(entry) {
			if (entry.category === active) {
				this.applyToCategory(entry);
				return false;
			}
		}, this);
	},

	/**
	 * @private
	 */
	onDestroy: function()
	{
		this.searchTask.cancel();
		Zarafa.settings.ui.SettingsSearchField.superclass.onDestroy.apply(this, arguments);
	}
});

Ext.reg('zarafa.settingssearchfield', Zarafa.settings.ui.SettingsSearchField);
