/*
 * #dependsFile client/zarafa/note/NoteContextModel.js
 */
Ext.namespace('Zarafa.note');

/**
 * @class Zarafa.note.NoteContext
 * @extends Zarafa.core.Context
 *
 * This class will be used as a controller between {@link Zarafa.note.NoteContextModel NoteContextModel}
 * and {@link Zarafa.note.ui.NoteMainPanel NoteMainPanel}
 * Context that handles displaying note type messages.
 */
Zarafa.note.NoteContext = Ext.extend(Zarafa.core.Context, {
	// Insertion points for this class
	/**
	 * @insert main.maintoolbar.view.note
	 * Insertion point for populating the main toolbar with a View button. This item is only visible
	 * when this context is active.
	 * @param {Zarafa.mail.NoteContext} context This context
	 */

	/**
	 * When searching, this property marks the {@link Zarafa.core.Context#getCurrentView view}
	 * which was used before {@link #onSearchStart searching started} the view was switched to
	 * {@link Zarafa.note.data.Views#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldView : undefined,

	/**
	 * When searching, this property marks the {@link Zarafa.core.Context#getCurrentViewMode viewmode}
	 * which was used before {@link #onSearchStart searching started} the viewmode was switched to
	 * {@link Zarafa.note.data.ViewModes#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldViewMode : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			current_view : Zarafa.note.data.Views.ICON,
			current_view_mode : Zarafa.note.data.ViewModes.NORMAL
		});

		// The tab in the top tabbar
		this.registerInsertionPoint('main.maintabbar.left', this.createMainTab, this);

		// The "New Note" button which is available in all contexts
		this.registerInsertionPoint('main.maintoolbar.new.item', this.createNewNoteButton, this);

		Zarafa.note.NoteContext.superclass.constructor.call(this, config);

		// Add a tree control showing a list of note folders to the navigation panel.
		// The control will be shown when the user selects the note context from the button panel.
		this.registerInsertionPoint('navigation.center', this.createNoteNavigationPanel, this);
	},

	/**
	 * @return {Zarafa.note.NoteContextModel} the notet context model
	 */
	getModel : function()
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Zarafa.note.NoteContextModel();
			this.model.on({
				'searchstart' : this.onModelSearchStart,
				'searchstop' : this.onModelSearchStop,
				scope : this
			});
		}
		return this.model;
	},

	/**
	 * Event handler for the {@link #model}#{@link Zarafa.core.ContextModel#searchstart searchstart} event.
	 * This will {@link #switchView switch the view} to {@link Zarafa.note.data.Views#SEARCH search mode}.
	 * The previously active {@link #getCurrentView view} will be stored in the {@link #oldView} and will
	 * be recovered when the {@link #onModelSearchStop search is stopped}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchStart : function(model)
	{
		if(this.getCurrentView() !== Zarafa.note.data.Views.SEARCH && this.getCurrentViewMode() !== Zarafa.note.data.ViewModes.SEARCH){
			this.oldView = this.getCurrentView();
			this.oldViewMode = this.getCurrentViewMode();
			this.switchView(Zarafa.note.data.Views.SEARCH, Zarafa.note.data.ViewModes.SEARCH);
		}
	},

	/**
	 * Event handler for the {@link #model}#{@link Zarafa.core.ContextModel#searchstop searchstop} event.
	 * This will {@link #switchView switch the view} to the {@link #oldView previous view}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchStop : function(model)
	{
		this.switchView(this.oldView, this.oldViewMode);
		delete this.oldView;
		delete this.oldViewMode;
	},

	/**
	 * bid to get selected on Mapi folder selection
	 */
	bid : function(folder)
	{
		// Bid 1 when the folder is of the IPF.StickyNote type.
		if (folder.isContainerClass('IPF.StickyNote', true)) {
			return 1;
		}

		return -1;
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
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
			case Zarafa.core.data.SharedComponentType['common.create']:
			case Zarafa.core.data.SharedComponentType['common.view']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.isMessageClass('IPM.StickyNote', true)) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.isMessageClass('IPM.StickyNote', true)) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.printer.renderer']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.isMessageClass('IPM.StickyNote', true)) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel']:
				if (record instanceof Zarafa.hierarchy.data.MAPIFolderRecord) {
					if (record.isContainerClass('IPF.StickyNote', true)) {
						bid = 1;
					}
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass('IPM.StickyNote', true)) {
						bid = 1;
					}
				}
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.create']:
			case Zarafa.core.data.SharedComponentType['common.view']:
				component = Zarafa.note.dialogs.NoteEditContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				component = Zarafa.note.ui.NoteContextMenu;
				break;
			case Zarafa.core.data.SharedComponentType['common.printer.renderer']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
					component = Zarafa.note.printer.NoteRenderer;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel']:
				component = Zarafa.note.attachitem.AttachNoteColumnModel;
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer']:
				component = Zarafa.note.attachitem.AttachNoteRenderer;
				break;
		}
		return component;
	},

	/**
	 * Creates the note tree that is shown when the user selects the note context from the
	 * button panel. It shows a tree of available note folders that can be checked and unchecked.
	 * @private
	 */
	createNoteNavigationPanel : function()
	{
		return {
			xtype : 'zarafa.contextnavigation',
			context : this,
			items : [{
				xtype : 'panel',
				id: 'zarafa-navigationpanel-notes-navigation',
				cls: 'zarafa-context-navigation-block',
				layout: 'fit',
				items : [{
					xtype : 'zarafa.hierarchytreepanel',
					id: 'zarafa-navigationpanel-notes-navigation-tree',
					model: this.getModel(),
					IPMFilter: 'IPF.StickyNote',
					hideDeletedFolders : true,
					enableDD : true,
					enableItemDrop : true,
					deferredLoading : true,
					bbarConfig: {
						defaultSelectedSharedFolderType: Zarafa.hierarchy.data.SharedFolderTypes['NOTE'],
						buttonText : _('Open Shared Notes')
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
			xtype : 'zarafa.notemainpanel',
			id: 'zarafa-mainpanel-contentpanel-notes',
			context : this
		};
	},

	/**
	 * Create "New Sticky Note" {@link Ext.menu.MenuItem item} for the "New item"
	 * {@link Ext.menu.Menu menu} in the {@link Zarafa.core.ui.MainToolbar toolbar}.
	 * This button should be shown in all {@link Zarafa.core.Context contexts} and
	 * is used to create a new Sticky Note.
	 *
	 * @return {Object} The menu item for creating a new Sticky Note item
	 */
	createNewNoteButton: function()
	{
		return {
			xtype: 'menuitem',
			id: 'zarafa-maintoolbar-newitem-note',
			tooltip: _('Sticky note')+' (Ctrl + Alt + S)',
			plugins: 'zarafa.menuitemtooltipplugin',
			text: _('Sticky note'),
			iconCls: 'icon_new_note',
			newMenuIndex: 5,
			context: 'note',
			handler: function()
			{
				Zarafa.note.Actions.openCreateNoteContent(this.getModel());
			},
			scope: this
		};
	},

	/**
	 * Returns the buttons for the dropdown list of the Print button in the main toolbar. It will use the
	 * main.maintoolbar.print.note insertion point to allow other plugins to add their items at the end.
	 *
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarPrintButtons : function()
	{
		var items = container.populateInsertionPoint('main.toolbar.print.note', this) || [];

		var defaultItems = [{
			xtype: 'zarafa.conditionalitem',
			id: 'zarafa-maintoolbar-print-selectednote',
			overflowText: _('Print selected note'),
			iconCls: 'icon_print_note',
			tooltip: _('Print selected note') + ' (Ctrl + P)',
			plugins: 'zarafa.menuitemtooltipplugin',
			text: _('Print selected note'),
			hideOnDisabled: false,
			singleSelectOnly: true,
			handler: this.onPrintSelected,
			scope: this
		}];

		return defaultItems.concat(items);
	},

	/**
	 * Handler for printing the selected {@link Zarafa.core.data.MAPIRecord} record. Menu item is disabled if there is no record selected.
	 * Calls {@link Zarafa.common.Actions.openPrintDialog} openPrintDialog with the selected record.
	 * @private
	 */
	onPrintSelected : function()
	{
		var records = this.getModel().getSelectedRecords();
		if (Ext.isEmpty(records)) {
			Ext.MessageBox.alert(_('Print'), _('No note selected'));
			return;
		}
		Zarafa.common.Actions.openPrintDialog(records);
	},

	/**
	 * Returns the buttons for the dropdown list of the VIEW-button in the main toolbar. It will use the
	 * main.maintoolbar.view.note insertion point to allow other plugins to add their items at the end.
	 *
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarViewButtons : function()
	{
		var items = container.populateInsertionPoint('main.maintoolbar.view.note', this) || [];

		var defaultItems = [{
			id: 'zarafa-maintoolbar-view-notes-icons',
			text: _('Icons'),
			overflowText: _('Icons'),
			iconCls: 'icon_note_icon_view',
			valueView : Zarafa.note.data.Views.ICON,
			valueViewMode : Zarafa.note.data.ViewModes.NORMAL,
			valueDataMode : Zarafa.note.data.DataModes.ALL,
			handler : this.onContextSelectView,
			scope : this
		},{
			id: 'zarafa-maintoolbar-view-notes-list',
			text: _('List view'),
			overflowText: _('List view'),
			iconCls: 'icon_contact_list',
			valueView : Zarafa.note.data.Views.LIST,
			valueViewMode : Zarafa.note.data.ViewModes.NORMAL,
			valueDataMode : Zarafa.note.data.DataModes.ALL,
			handler : this.onContextSelectView,
			scope : this
		},{
			id: 'zarafa-maintoolbar-view-notes-listlastsevendays',
			text: _('List Last Seven Days'),
			overflowText: _('List Last Seven Days'),
			iconCls: 'icon_task_seven_days',
			valueView : Zarafa.note.data.Views.LIST,
			valueViewMode : Zarafa.note.data.ViewModes.NORMAL,
			valueDataMode : Zarafa.note.data.DataModes.LAST_7_DAYS,
			handler : this.onContextSelectView,
			scope : this
		}];

		return defaultItems.concat(items);
	},

	/**
	 * Event handler which is fired when one of the View buttons
	 * has been pressed. This will call {@link Zarafa.note.NoteContext#setView setView}
	 * to update the view.
	 * @param {Ext.Button} button The button which was pressed
	 * @private
	 */
	onContextSelectView : function(button)
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
	 * event is fired. This will check which {@link Zarafa.note.data.ViewModes ViewMode}
	 * was applied and thus which kind of {@link Zarafa.core.ContextModel#groupBy grouping}
	 * must be applied to the {@link #model}.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event.
	 * @param {Mixed} newViewMode The selected View Mode.
	 * @param {Mixed} oldViewMode The previously selected View Mode.
	 * @private
	 */
	onViewModeChange : function(context, newViewMode, oldViewMode)
	{
		var model = this.getModel();

		switch (newViewMode) {
			case Zarafa.note.data.ViewModes.NORMAL:
			case Zarafa.note.data.ViewModes.SEARCH:
				model.clearGrouping();
				break;
			case Zarafa.note.data.ViewModes.GROUP_CATEGORY:
				model.groupBy('categories');
				break;
			case Zarafa.note.data.ViewModes.GROUP_COLOR:
				model.groupBy('color');
				break;
		}
	}
});

Zarafa.onReady(function() {
	container.registerContext(new Zarafa.core.ContextMetaData({
		name : 'note',
		displayName: _('Notes'),
		allowUserVisible : false,
		pluginConstructor : Zarafa.note.NoteContext
	}));
});
