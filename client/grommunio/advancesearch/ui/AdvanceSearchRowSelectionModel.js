/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.advancesearch.ui');

/**
 * @class Grommunio.advancesearch.ui.AdvanceSearchRowSelectionModel
 * @extends Ext.grid.RowSelectionModel
 *
 * The {@link Grommunio.advancesearch.ui.MailRowSelectionModel MailRowSelectionModel}
 * is the {@link Ext.grid.RowSelectionModel RowSelectionModel} used in the
 * {@link Grommunio.advancesearch.ui.SearchGrid SearchGrid}.
 * It checks columns that have the preventRowSelection property and triggers actions depending on it.
 * See {@link #handleMouseDown}
 */
Grommunio.advancesearch.ui.AdvanceSearchRowSelectionModel = Ext.extend(Ext.grid.RowSelectionModel, {
	/**
	 * If one of the columns of interest is clicked, then the row should not be selected.
	 * Otherwise call original handler.
	 * 'cellmousedown' does not fire when drag&drop is installed on a component,
	 * otherwise it may have been possible to cancel selection from there by returning false.
	 *
	 * @param {Grommunio.advancesearch.ui.SearchGrid} grid The search grid from which the event came
	 * @param {Number} rowIndex Index of the row that was clicked
	 * @param {Ext.EventObject} event The mouse event
	 *
	 * @override
	 * @private
	 */
	handleMouseDown: function(grid, rowIndex, event)
	{
		// boolean to determine what we are going to do
		var preventRowSelection = false;
		if(event.target.className.indexOf('icon') !== -1){
			 preventRowSelection = true;
		}

		if (preventRowSelection !== true) {
			Grommunio.advancesearch.ui.AdvanceSearchRowSelectionModel.superclass.handleMouseDown.call(this, grid, rowIndex, event);
		}
	}
});

Ext.reg('grommunio.advancesearchrowselectionmodel', Grommunio.advancesearch.ui.AdvanceSearchRowSelectionModel);
