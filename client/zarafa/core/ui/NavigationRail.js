Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.NavigationRail
 * @extends Object
 *
 * Fills the collapsed navigation panel with a rail of folder buttons: the
 * favorites and the default folders of the current context. A button
 * selects its folder without opening the panel; the rest of the rail keeps
 * the slide-in behaviour of the collapsed panel.
 */
Zarafa.core.ui.NavigationRail = Ext.extend(Object, {
	/**
	 * @cfg {Zarafa.core.ui.NavigationPanel} panel The navigation panel.
	 */
	panel: undefined,

	/**
	 * The default folders shown per context, by context name.
	 * @property
	 * @type Object
	 */
	defaultFolders: {
		mail: ['inbox', 'drafts', 'outbox', 'sent', 'junk', 'wastebasket'],
		calendar: ['calendar'],
		contact: ['contact'],
		task: ['task', 'todolist'],
		note: ['note']
	},

	/**
	 * The folders behind the rail buttons, by button index.
	 * @property
	 * @type Array
	 * @private
	 */
	folders: undefined,

	/**
	 * The currently selected folders.
	 * @property
	 * @type Array
	 * @private
	 */
	selected: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(this, config);

		this.folders = [];
		this.selected = [];
		this.refreshTask = new Ext.util.DelayedTask(this.refresh, this);

		this.panel.on('collapse', this.onCollapse, this);
		this.panel.on('render', this.onPanelRender, this, { single: true });
		container.on('folderselect', this.onFolderSelect, this);
		container.on('contextswitch', this.scheduleRefresh, this);
		container.getHierarchyStore().on({
			load: this.scheduleRefresh,
			addFolder: this.scheduleRefresh,
			updateFolder: this.scheduleRefresh,
			removeFolder: this.scheduleRefresh,
			scope: this
		});
	},

	/**
	 * A panel restored in collapsed state fires no collapse event, so the
	 * rail is built after the first layout of the viewport.
	 * @private
	 */
	onPanelRender: function()
	{
		if (this.panel.ownerCt) {
			this.panel.ownerCt.on('afterlayout', this.onCollapse, this, { single: true });
		}
	},

	/**
	 * @return {Ext.layout.BorderLayout.Region} The west region holding the panel
	 * @private
	 */
	getRegion: function()
	{
		var ct = this.panel.ownerCt;
		return ct && ct.layout ? ct.layout.west : undefined;
	},

	/**
	 * Creates the rail inside the collapsed element and fills it.
	 * @private
	 */
	onCollapse: function()
	{
		var region = this.getRegion();
		if (!this.panel.collapsed || !region) {
			return;
		}

		if (!this.el) {
			this.el = region.getCollapsedEl().createChild({
				tag: 'nav',
				cls: 'k-nav-rail',
				'aria-label': _('Folders')
			});
			this.el.on('click', this.onClick, this);
		}
		this.refresh();
	},

	/**
	 * @private
	 */
	scheduleRefresh: function()
	{
		this.refreshTask.delay(100);
	},

	/**
	 * Rebuilds the buttons.
	 * @private
	 */
	refresh: function()
	{
		if (!this.el || !this.panel.collapsed) {
			return;
		}

		var html = [];
		var favorites = this.getFavorites();
		var defaults = this.getDefaults().filter(function(folder) {
			return !this.contains(favorites, folder);
		}, this);

		this.folders = [];
		this.addButtons(html, favorites);
		if (favorites.length && defaults.length) {
			html.push('<span class="k-nav-rail-sep"></span>');
		}
		this.addButtons(html, defaults);
		this.el.update(html.join(''));
	},

	/**
	 * @param {Array} html The markup being built
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folders The folders to add
	 * @private
	 */
	addButtons: function(html, folders)
	{
		Ext.each(folders, function(folder) {
			var name = Ext.util.Format.htmlEncode(folder.getFullyQualifiedDisplayName());
			var unread = folder.get('content_unread');
			var cls = 'k-nav-rail-item' + (this.contains(this.selected, folder) ? ' k-nav-rail-item-active' : '');

			// quick tips only look at the element under the mouse
			var tip = ' ext:qtip="' + name + '"';
			html.push('<button type="button" class="' + cls + '" data-index="' + this.folders.length + '"' + tip + ' aria-label="' + name + '">',
				'<span class="k-nav-rail-icon ' + Zarafa.common.ui.IconClass.getIconClass(folder) + '"' + tip + '></span>',
				unread > 0 ? '<span class="k-nav-rail-badge"' + tip + '>' + (unread > 99 ? '99+' : unread) + '</span>' : '',
				'</button>');
			this.folders.push(folder);
		}, this);
	},

	/**
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord[]} The favorite folders
	 * @private
	 */
	getFavorites: function()
	{
		var store = container.getHierarchyStore().getDefaultStore();
		var favorites = store ? store.getFavoritesStore() : undefined;

		return favorites ? favorites.getRange().filter(function(folder) {
			return !folder.isSearchFolder();
		}) : [];
	},

	/**
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord[]} The default folders of the current context
	 * @private
	 */
	getDefaults: function()
	{
		var context = container.getCurrentContext();
		var store = container.getHierarchyStore().getDefaultStore();
		var keys = context ? this.defaultFolders[context.getName()] : undefined;
		var folders = [];

		if (store && keys) {
			Ext.each(keys, function(key) {
				var folder = store.getDefaultFolder(key);
				if (folder) {
					folders.push(folder);
				}
			});
		}
		return folders;
	},

	/**
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folders The folders to search
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to find
	 * @return {Boolean} True when a folder with the same entryid is in the list
	 * @private
	 */
	contains: function(folders, folder)
	{
		return folders.some(function(other) {
			return Zarafa.core.EntryId.compareEntryIds(other.get('entryid'), folder.get('entryid'));
		});
	},

	/**
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord|Array} folders The selected folders
	 * @private
	 */
	onFolderSelect: function(folders)
	{
		this.selected = Ext.isArray(folders) ? folders : (folders ? [folders] : []);
		this.refresh();
	},

	/**
	 * Selects the folder of a clicked button; other clicks reach the
	 * collapsed element and slide the panel in.
	 * @param {Ext.EventObject} e The click event
	 * @private
	 */
	onClick: function(e)
	{
		var button = e.getTarget('.k-nav-rail-item', 4, true);
		if (!button) {
			return;
		}

		e.stopEvent();
		var folder = this.folders[parseInt(button.getAttribute('data-index'), 10)];
		if (folder) {
			container.selectFolder(folder);
		}
	}
});
