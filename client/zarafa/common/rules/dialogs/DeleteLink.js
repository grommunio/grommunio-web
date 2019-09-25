Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.DeleteLink
 * @extends Zarafa.common.rules.dialogs.FolderSelectionLink
 * @xtype zarafa.deletelink
 *
 * Extension of the {@link Zarafa.common.rules.dialogs.FolderSelectionLink Folder Selection Link}
 * expecially for the {@link Zarafa.common.rules.data.ActionFlags#DELETE DELETE ActionFlag}.
 *
 * This will not show anything to the user, but during {@link #setAction} this will force
 * the {@link #actionFlag} to be {@link Zarafa.common.rules.data.ActionFlags#MOVE MOVE}
 * and the {@link #folder} to be set to the 'Deleted Items' folder.
 */
Zarafa.common.rules.dialogs.DeleteLink = Ext.extend(Zarafa.common.rules.dialogs.FolderSelectionLink, {

	/**
	 * Called when user clicks on a {@link Zarafa.common.rules.dialogs.FolderSelectionLink}
	 * It opens hierarchy folder selection dialog
	 * @param {Ext.DataView} dataView Reference to this object
	 * @param {Number} index The index of the target node
	 * @param {HTMLElement} node The target node
	 * @param {Ext.EventObject} evt The mouse event
	 * @protected
	 */
	onClick : function(dataView, index, node, evt)
	{
		// Don't perform any action
	},

	/**
	 * Apply an action onto the DataView, this will parse the action and show
	 * the contents in a user-friendly way to the user.
	 * @param {Zarafa.common.rules.data.ActionFlags} actionFlag The action type
	 * which identifies the exact type of the action.
	 * @param {Object} action The action to apply
	 */
	setAction : function(actionFlag, action)
	{
		// This component only handles the 'DELETE' action,
		// that equals the 'MOVE' action in combination
		// with the 'Deleted Items' folder.
		this.actionFlag = Zarafa.common.rules.data.ActionFlags.MOVE;
		this.action = action;
		this.isModified = !Ext.isDefined(action);

		var hierarchyStore = container.getHierarchyStore();
		var index = hierarchyStore.findExact('store_entryid', this.storeEntryId);

		this.folder = hierarchyStore.getAt(index).getDefaultFolder('wastebasket');
	},

	/**
	 * Update the contents of this dataview, this will apply the {@link #tpl} for
	 * the {@link #folder}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to show
	 */
	update : function(folder)
	{
		// Don't show anything
	}
});

Ext.reg('zarafa.deletelink', Zarafa.common.rules.dialogs.DeleteLink);
