/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook.ui');

/**
 * @class Grommunio.addressbook.ui.AddressBookPanel
 * @extends Grommunio.addressbook.ui.AddressBookMainPanel
 * @xtype grommunio.addressbookpanel
 */
Grommunio.addressbook.ui.AddressBookPanel = Ext.extend(Grommunio.addressbook.ui.AddressBookMainPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.addressbookpanel',
			cls: 'k-addressbookpanel'
		});

		// Call parent constructor
		Grommunio.addressbook.ui.AddressBookPanel.superclass.constructor.call(this, config);

		this.on('afterlayout', this.onAfterLayout, this, { single: true });
	},

	/**
	 * Event handler which is triggered when the layout
	 * for the {@link Ext.Panel panel} has been completed.
	 * @private
	 */
	onAfterLayout: function()
	{
		this.mon(this.getGridPanel(), 'rowdblclick', this.onAddressBookRowDblClick, this);
		this.mon(this.getGridPanel(), 'rowcontextmenu', this.onAddressBookRowContextMenu, this);
	},

	/**
	 * Event handler which is triggered when the user doubleclicks on a
	 * row within the {@link Ext.grid.GridPanel gridpanel}. This will open
	 * a {@link Grommunio.core.ui.ContentPanel contentpanel} containing the details of the user/group.
	 * @param {Ext.grid.GridPanel} grid The grid on which the user doubleclicked
	 * @param {Number} rowIndex the row on which was doubleclicked
	 * @param {Ext.EventObject} event The event information
	 * @private
	 */
	onAddressBookRowDblClick: function(grid, rowIndex, event)
	{
		var records = grid.getStore().getAt(rowIndex);
		Grommunio.addressbook.Actions.openDetailsContent(records);
	},

	/**
	 * Event handler which is triggered when the user rightclicks
	 * on a row in the {@link Ext.grid.GridPanel gridpanel}. This will
	 * open a {@link Grommunio.core.ui.menu.ConditionalMenu contextmenu}
	 * for the selected row.
	 * @param {Ext.grid.GridPanel} grid The grid on which the user clicked
	 * @param {Number} rowIndex the row on which was doubleclicked
	 * @param {Ext.EventObject} event The event information
	 * @private
	 */
	onAddressBookRowContextMenu: function(grid, rowIndex, event)
	{
		var sm = grid.getSelectionModel();

		if (sm.hasSelection()) {
			// Some records were selected...
			if (!sm.isSelected(rowIndex)) {
				// But none of them was the record on which the
				// context menu was invoked. Reset selection.
				sm.clearSelections();
				sm.selectRow(rowIndex);
			}
		} else {
			// No records were selected,
			// select row on which context menu was invoked
			sm.selectRow(rowIndex);
		}

		var selectedFolder = this.getSelectedFolderRecord();
		Grommunio.core.data.UIFactory.openDefaultContextMenu(sm.getSelections(), {
			position: event.getXY(),
			dialog: this.dialog,
			selectedFolderType: selectedFolder.get('type')
		});
	}
});

Ext.reg('grommunio.addressbookpanel', Grommunio.addressbook.ui.AddressBookPanel);
