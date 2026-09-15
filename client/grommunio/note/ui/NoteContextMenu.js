/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.note.ui');

/**
 * @class Grommunio.note.ui.NoteContextMenu
 * @extends Grommunio.core.ui.menu.ConditionalMenu
 * @xtype grommunio.notecontextmenu
 */
Grommunio.note.ui.NoteContextMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.note.contextmenu.actions
	 * Insertion point for adding actions menu items into the context menu
	 * @param {Grommunio.note.ui.NoteContextMenu} contextmenu This contextmenu
	 */
	/**
	 * @insert context.note.contextmenu.options
	 * Insertion point for adding options menu items into the context menu
	 * @param {Grommunio.note.ui.NoteContextMenu} contextmenu This contextmenu
	 */

	/**
	 * @cfg {Grommunio.core.data.IPMRecord[]} The records on which this context menu acts
	 */
	records: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		if (config.records) {
			if (!Array.isArray(config.records)) {
				config.records = [ config.records ];
			}
		}

		Ext.applyIf(config, {
			items: [
				this.createContextActionItems(config.records),
				{ xtype: 'menuseparator' },
				container.populateInsertionPoint('context.note.contextmenu.actions', this),
				{ xtype: 'menuseparator' },
				container.populateInsertionPoint('context.note.contextmenu.options', this),
				{ xtype: 'menuseparator' },
				this.createOptionsMenuItem()
			],
			defaults: {
				xtype: 'grommunio.conditionalitem',
				hideOnDisabled: false
			}
		});

		Grommunio.note.ui.NoteContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create the Action context menu items
	 * @param {Grommunio.core.data.IPMRecord{}} The records on which this menu acts
	 * @return {Grommunio.core.ui.menu.ConditionalItem[]} The list of Action context menu items
	 * @private
	 */
	createContextActionItems: function(records)
	{
		return [{
			text: _('Open'),
			iconCls: 'icon_open',
			scope: this,
			handler: this.onContextItemOpen,
			singleSelectOnly: true
		}, {
			text: _('Copy/Move'),
			iconCls: 'icon_copy',
			scope: this,
			handler: this.onCopyMove
		}, {
			text: _('Print'),
			iconCls: 'icon_print',
			scope: this,
			handler: this.onContextItemPrint,
			singleSelectOnly: true
		}, {
			xtype: 'menuseparator'
		}, {
			text: _('Categories'),
			cls: 'k-unclickable',
			iconCls: 'icon_categories',
			hideOnClick: false,
			menu: {
				xtype: 'grommunio.categoriescontextmenu',
				records: records
			}
		}, {
			xtype: 'menuseparator'
		}, {
			text: _('Delete'),
			iconCls: 'icon_delete',
			scope: this,
			handler: this.onContextItemDelete
		}];
	},

	/**
	 * Open the {@link Grommunio.common.dialogs.CopyMoveContentPanel CopyMoveContentPanel} for copying
	 * or moving the currently selected notes.
	 * @private
	 */
	onCopyMove: function()
	{
		Grommunio.common.Actions.openCopyMoveContent(this.records);
	},

	/**
	 * Event handler which is called when the user selects the 'Open'
	 * item in the context menu. This will open the item in a new dialog.
	 * @private
	 */
	onContextItemOpen: function()
	{
		Grommunio.note.Actions.openNoteContent(this.records);
	},

	/**
	 * Event handler which is called when the user selects the 'Email message'
	 * item in the context menu. This will open a new mail dialog.
	 * @private
	 */
	onContextItemEmail: function()
	{
		Grommunio.note.Actions.openNoteEmailContent(this.records);
	},

	/**
	 * Event handler which is called when the user selects the 'Categories'
	 * item in the context menu. This will open {@link Grommunio.common.categories.dialogs.CategoriesContentPanel CategoriesContentPanel}.
	 * @private
	 */
	onContextItemCategories: function()
	{
		Grommunio.common.Actions.openCategoriesContent(this.records);
	},

	/**
	 * Create the Options menu entry.
	 * @return {Object} Menu item configuration
	 * @private
	 */
	createOptionsMenuItem: function()
	{
		return {
			text: _('Options'),
			iconCls: 'icon_cogwheel',
			scope: this,
			singleSelectOnly: true,
			handler: this.onContextItemOptions
		};
	},

	/**
	 * Open the options dialog for the selected record.
	 * @private
	 */
	onContextItemOptions: function()
	{
		Grommunio.note.Actions.openOptionsContent(this.records, {
			autoSave: true
		});
	},

	/**
	 * Event handler which is called when the user selects the 'Categories'
	 * item in the context menu. This will open {@link Grommunio.common.dialogs.CategoriesContentPanel CategoriesContentPanel}.
	 * @private
	 */
	onContextItemPrint: function()
	{
		Grommunio.common.Actions.openPrintDialog(this.records);
	},

	/**
	 * Event handler which is called when the user selects the 'Delete'
	 * item in the context menu. This will delete selected notes from view.
	 * @private
	 */
	onContextItemDelete: function()
	{
		Grommunio.common.Actions.deleteRecords(this.records);
	}
});

Ext.reg('grommunio.notecontextmenu', Grommunio.note.ui.NoteContextMenu);
