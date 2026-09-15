/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/KeyMapMgr.js
 */
Ext.namespace('Grommunio.common.dialogs');

/**
 * @class Grommunio.common.dialogs.KeyMapping
 * @extends Object
 *
 * The map of keys used in the Copy/Move Panel.
 * @singleton
 */
Grommunio.common.dialogs.CopyMovePanelKeyMapping = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor: function()
	{
		var keys = [{
			key: Ext.EventObject.ENTER,
			ctrl: false,
			alt: false,
			shift: false,
			stopEvent: true,
			handler: this.onMoveItems,
			enableGlobally: true,
			scope: this,
			basic: true
		}];

		Grommunio.core.KeyMapMgr.register('Grommunio.common.dialogs.CopyMovePanel', keys);
	},

	/**
	 * Event handler for the keydown event of the {@link Grommunio.core.KeyMap KeyMap} when the user wants to 
	 * move items.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Grommunio.common.dialogs.CopyMovePanel} copyMovePanel The panel on which the key event is fired.
	 */
	onMoveItems: function(key, event, copyMovePanel)
	{
		var folder = copyMovePanel.hierarchyTree.getSelectionModel().getSelectedNode().getFolder();
		copyMovePanel.onMove(copyMovePanel.record, folder);
	}
});

Grommunio.common.dialogs.CopyMovePanelKeyMapping = new Grommunio.common.dialogs.CopyMovePanelKeyMapping();
