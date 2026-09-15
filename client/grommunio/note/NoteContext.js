/*
 * #dependsFile client/grommunio/note/NoteContextModel.js
 */
Ext.namespace('Grommunio.note');

/**
 * @class Grommunio.note.NoteContext
 * @extends Grommunio.core.Context
 *
 * This class will be used as a controller between {@link Grommunio.note.NoteContextModel NoteContextModel}
 * and {@link Grommunio.note.ui.NoteMainPanel NoteMainPanel}
 * Context that handles displaying note type messages.
 */
Grommunio.note.NoteContext = Ext.extend(Grommunio.core.Context, {
	// Insertion points for this class
	/**
	 * @insert main.maintoolbar.view.note
	 * Insertion point for populating the main toolbar with a View button. This item is only visible
	 * when this context is active.
	 * @param {Grommunio.mail.NoteContext} context This context
	 */

	/**
	 * When searching, this property marks the {@link Grommunio.core.Context#getCurrentView view}
	 * which was used before {@link #onSearchStart searching started} the view was switched to
	 * {@link Grommunio.note.data.Views#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldView: undefined,

	/**
	 * When searching, this property marks the {@link Grommunio.core.Context#getCurrentViewMode viewmode}
	 * which was used before {@link #onSearchStart searching started} the viewmode was switched to
	 * {@link Grommunio.note.data.ViewModes#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldViewMode: undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			current_view: Grommunio.note.data.Views.ICON,
			current_view_mode: Grommunio.note.data.ViewModes.NORMAL
		});

		// The tab in the top tabbar
		this.registerInsertionPoint('main.maintabbar.left', this.createMainTab, this);

		// The "New Note" button which is available in all contexts
		this.registerInsertionPoint('main.maintoolbar.new.item', this.createNewNoteButton, this);

		Grommunio.note.NoteContext.superclass.constructor.call(this, config);

		// Add a tree control showing a list of note folders to the navigation panel.
		// The control will be shown when the user selects the note context from the button panel.
		this.registerInsertionPoint('navigation.center', this.createNoteNavigationPanel, this);

		// Show the notes which annotate a mail inside the mail preview.
		this.registerInsertionPoint('previewpanel.toolbar.detaillinks', this.getLinkedNoteDetailLinks, this);

		Grommunio.core.data.SharedComponentType.addProperty('note.dialog.options');
	},

	/**
	 * @return {Grommunio.note.NoteContextModel} The note context model
	 */
	getModel: function()
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Grommunio.note.NoteContextModel();
			this.model.on({
				'searchstart': this.onModelSearchStart,
				'searchstop': this.onModelSearchStop,
				scope: this
			});
		}
		return this.model;
	},

	/**
	 * Event handler for the {@link #model}#{@link Grommunio.core.ContextModel#searchstart searchstart} event.
	 * This will {@link #switchView switch the view} to {@link Grommunio.note.data.Views#SEARCH search mode}.
	 * The previously active {@link #getCurrentView view} will be stored in the {@link #oldView} and will
	 * be recovered when the {@link #onModelSearchStop search is stopped}.
	 * @param {Grommunio.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchStart: function(model)
	{
		if(this.getCurrentView() !== Grommunio.note.data.Views.SEARCH && this.getCurrentViewMode() !== Grommunio.note.data.ViewModes.SEARCH){
			this.oldView = this.getCurrentView();
			this.oldViewMode = this.getCurrentViewMode();
			this.switchView(Grommunio.note.data.Views.SEARCH, Grommunio.note.data.ViewModes.SEARCH);
		}
	},

	/**
	 * Event handler for the {@link #model}#{@link Grommunio.core.ContextModel#searchstop searchstop} event.
	 * This will {@link #switchView switch the view} to the {@link #oldView previous view}.
	 * @param {Grommunio.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchStop: function(model)
	{
		this.switchView(this.oldView, this.oldViewMode);
		delete this.oldView;
		delete this.oldViewMode;
	},

	/**
	 * bid to get selected on Mapi folder selection
	 */
	bid: function(folder)
	{
		// Bid 1 when the folder is of the IPF.StickyNote type.
		if (folder.isContainerClass('IPF.StickyNote', true)) {
			return 1;
		}

		return -1;
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		if (Array.isArray(record)) {
			record = record[0];
		}

		switch (type) {
			case Grommunio.core.data.SharedComponentType['common.create']:
			case Grommunio.core.data.SharedComponentType['common.view']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.isMessageClass('IPM.StickyNote', true)) {
					bid = 1;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.isMessageClass('IPM.StickyNote', true)) {
					bid = 1;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.printer.renderer']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.isMessageClass('IPM.StickyNote', true)) {
					bid = 1;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel']:
				if (record instanceof Grommunio.hierarchy.data.MAPIFolderRecord) {
					if (record.isContainerClass('IPF.StickyNote', true)) {
						bid = 1;
					}
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.get('object_type') === Grommunio.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass('IPM.StickyNote', true)) {
						bid = 1;
					}
				}
				break;
			case Grommunio.core.data.SharedComponentType['note.dialog.options']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.isMessageClass('IPM.StickyNote', true)) {
					bid = 1;
				}
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Grommunio.core.data.SharedComponentType['common.create']:
			case Grommunio.core.data.SharedComponentType['common.view']:
				component = Grommunio.note.dialogs.NoteEditContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				component = Grommunio.note.ui.NoteContextMenu;
				break;
			case Grommunio.core.data.SharedComponentType['note.dialog.options']:
				component = Grommunio.note.dialogs.NoteOptionsContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.printer.renderer']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.get('object_type') === Grommunio.core.mapi.ObjectType.MAPI_MESSAGE) {
					component = Grommunio.note.printer.NoteRenderer;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel']:
				component = Grommunio.note.attachitem.AttachNoteColumnModel;
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer']:
				component = Grommunio.note.attachitem.AttachNoteRenderer;
				break;
		}
		return component;
	},

	/**
	 * Creates the note tree that is shown when the user selects the note context from the
	 * button panel. It shows a tree of available note folders that can be checked and unchecked.
	 * @private
	 */
	createNoteNavigationPanel: function()
	{
		return {
			xtype: 'grommunio.contextnavigation',
			context: this,
			items: [{
				xtype: 'panel',
				id: 'grommunio-navigationpanel-notes-navigation',
				cls: 'grommunio-context-navigation-block',
				layout: 'fit',
				items: [{
					xtype: 'grommunio.hierarchytreepanel',
					id: 'grommunio-navigationpanel-notes-navigation-tree',
					model: this.getModel(),
					IPMFilter: 'IPF.StickyNote',
					contextFavorites: true,
					hideDeletedFolders: true,
					enableDD: true,
					enableItemDrop: true,
					deferredLoading: true,
					bbarConfig: {
						defaultSelectedSharedFolderType: Grommunio.hierarchy.data.SharedFolderTypes['NOTE'],
						buttonText: _('Open Shared Notes')
					}
				}]
			}]
		};
	},

	/**
	 * creates a context panel
	 * @return configuration for note context
	 * @private
	 */
	createContentPanel: function()
	{
		return {
			xtype: 'grommunio.notemainpanel',
			id: 'grommunio-mainpanel-contentpanel-notes',
			context: this
		};
	},

	/**
	 * Create "New Sticky Note" {@link Ext.menu.MenuItem item} for the "New item"
	 * {@link Ext.menu.Menu menu} in the {@link Grommunio.core.ui.MainToolbar toolbar}.
	 * This button should be shown in all {@link Grommunio.core.Context contexts} and
	 * is used to create a new Sticky Note.
	 *
	 * @return {Object} The menu item for creating a new Sticky Note item
	 */
	createNewNoteButton: function()
	{
		return {
			xtype: 'menuitem',
			id: 'grommunio-maintoolbar-newitem-note',
			tooltip: _('Sticky note') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + Alt + S', false),
			plugins: 'grommunio.menuitemtooltipplugin',
			text: _('Sticky note'),
			iconCls: 'icon_new_note',
			newMenuIndex: 5,
			context: 'note',
			handler: function()
			{
				Grommunio.note.Actions.openCreateNoteContent(this.getModel());
			},
			scope: this
		};
	},

	/**
	 * Returns the panel which shows the notes annotating the previewed mail, for the
	 * 'previewpanel.toolbar.detaillinks' insertion point.
	 *
	 * @return {Object} configuration object for {@link Grommunio.note.ui.LinkedNoteLinks}
	 */
	getLinkedNoteDetailLinks: function()
	{
		return {
			xtype: 'grommunio.linkednotelinks'
		};
	},

	/**
	 * Returns the buttons for the dropdown list of the Print button in the main toolbar. It will use the
	 * main.maintoolbar.print.note insertion point to allow other plugins to add their items at the end.
	 *
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarPrintButtons: function()
	{
		var items = container.populateInsertionPoint('main.toolbar.print.note', this) || [];

		var defaultItems = [{
			xtype: 'grommunio.conditionalitem',
			id: 'grommunio-maintoolbar-print-selectednote',
			overflowText: _('Print selected note'),
			iconCls: 'icon_print_note',
			tooltip: _('Print selected note') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + P', true),
			plugins: 'grommunio.menuitemtooltipplugin',
			text: _('Print selected note'),
			hideOnDisabled: false,
			singleSelectOnly: true,
			handler: this.onPrintSelected.createDelegate(this, [_('No note selected')], 2),
			scope: this
		}];

		return defaultItems.concat(items);
	},

	/**
	 * Returns the buttons for the dropdown list of the VIEW-button in the main toolbar. It will use the
	 * main.maintoolbar.view.note insertion point to allow other plugins to add their items at the end.
	 *
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarViewButtons: function()
	{
		var items = container.populateInsertionPoint('main.maintoolbar.view.note', this) || [];

		var defaultItems = [{
			id: 'grommunio-maintoolbar-view-notes-icons',
			text: _('Icons'),
			overflowText: _('Icons'),
			iconCls: 'icon_note_icon_view',
			valueView: Grommunio.note.data.Views.ICON,
			valueViewMode: Grommunio.note.data.ViewModes.NORMAL,
			valueDataMode: Grommunio.note.data.DataModes.ALL,
			handler: this.onContextSelectView,
			scope: this
		},{
			id: 'grommunio-maintoolbar-view-notes-list',
			text: _('List view'),
			overflowText: _('List view'),
			iconCls: 'icon_contact_list',
			valueView: Grommunio.note.data.Views.LIST,
			valueViewMode: Grommunio.note.data.ViewModes.NORMAL,
			valueDataMode: Grommunio.note.data.DataModes.ALL,
			handler: this.onContextSelectView,
			scope: this
		},{
			id: 'grommunio-maintoolbar-view-notes-listlastsevendays',
			text: _('List Last Seven Days'),
			overflowText: _('List Last Seven Days'),
			iconCls: 'icon_task_seven_days',
			valueView: Grommunio.note.data.Views.LIST,
			valueViewMode: Grommunio.note.data.ViewModes.NORMAL,
			valueDataMode: Grommunio.note.data.DataModes.LAST_7_DAYS,
			handler: this.onContextSelectView,
			scope: this
		}];

		return defaultItems.concat(items);
	},

	/**
	 * Event handler which is fired when one of the View buttons
	 * has been pressed. This will call {@link Grommunio.note.NoteContext#setView setView}
	 * to update the view.
	 * @param {Ext.Button} button The button which was pressed
	 * @private
	 */
	onContextSelectView: function(button)
	{
		this.getModel().setDataMode(button.valueDataMode);
		this.switchView(button.valueView, button.valueViewMode);
	},

	/**
	 * Adds a button to the top tab bar for this context.
	 * @return {Object} The button for the top tabbar
	 * @private
	 */
	createMainTab: function()
	{
		return {
			text: this.getDisplayName(),
			tabOrderIndex: 6,
			context: this.getName(),
			id: 'mainmenu-button-notes'
		};
	},

	/**
	 * Event handler which is executed right before the {@link #viewmodechange}
	 * event is fired. This will check which {@link Grommunio.note.data.ViewModes ViewMode}
	 * was applied and thus which kind of {@link Grommunio.core.ContextModel#groupBy grouping}
	 * must be applied to the {@link #model}.
	 *
	 * @param {Grommunio.core.Context} context The context which fired the event.
	 * @param {Mixed} newViewMode The selected View Mode.
	 * @param {Mixed} oldViewMode The previously selected View Mode.
	 * @private
	 */
	onViewModeChange: function(context, newViewMode, oldViewMode)
	{
		var model = this.getModel();

		switch (newViewMode) {
			case Grommunio.note.data.ViewModes.NORMAL:
			case Grommunio.note.data.ViewModes.SEARCH:
				model.clearGrouping();
				break;
			case Grommunio.note.data.ViewModes.GROUP_CATEGORY:
				model.groupBy('categories');
				break;
			case Grommunio.note.data.ViewModes.GROUP_COLOR:
				model.groupBy('color');
				break;
		}
	}
});

Grommunio.onReady(function() {
	container.registerContext(new Grommunio.core.ContextMetaData({
		name: 'note',
		displayName: _('Notes'),
		allowUserVisible: false,
		pluginConstructor: Grommunio.note.NoteContext
	}));
});
