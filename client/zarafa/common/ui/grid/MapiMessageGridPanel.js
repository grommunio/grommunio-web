Ext.namespace('Zarafa.common.ui.grid');

/**
 * @class Zarafa.common.ui.grid.MapiMessageGrid
 * @extends Zarafa.common.ui.grid.GridPanel
 * @xtype zarafa.mapimessagegrid
 *
 * Grid for MAPI messages, like Notes, Mails, Appointments, Tasks, Contacts.
 * To handle specific action that are performed on MAPI messages grid, like keyboard controls.
 */
Zarafa.common.ui.grid.MapiMessageGrid = Ext.extend(Zarafa.common.ui.grid.GridPanel, {
	/* 
	 * @TODO :
	 * This grid is created only to handle keyboard events easily for
	 * Notes, Mails, Appointments, Tasks, Contacts.
	 * This allows 'grid.mapimessage' mapid to register common key events on
	 * above grids and handle them without code duplication.
	 * Grids like addressbookgrid, attachitemgrid, rulesgrid, remindergrid doesn't
	 * have common key mapping but extends Zarafa.common.ui.grid.GridPanel.
	 */
});

Ext.reg('zarafa.mapimessagegrid', Zarafa.common.ui.grid.MapiMessageGrid);
