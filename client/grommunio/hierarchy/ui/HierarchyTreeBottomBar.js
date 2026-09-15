/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.ui');

/**
 * @class Grommunio.hierarchy.ui.HierarchyTreeBottomBar
 * @extends Ext.Container
 * @xtype grommunio.hierarchybottombar
 */
Grommunio.hierarchy.ui.HierarchyTreeBottomBar = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Grommunio.hierarchy.data.SharedFolderTypes} defaultSelectedSharedFolderType The default
	 * type of Shared Folder that is selected in the dialog that will be opened.
	 */
	defaultSelectedSharedFolderType: null,

	/**
	 * @cfg {String} buttonText The text that should be displayed on the button to open shared folders.
	 */
	buttonText: _('Open Shared Folders'),

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		var buttonText = Ext.util.Format.htmlEncode(config.buttonText || this.buttonText);

		Ext.applyIf(config, {
			cls: 'grommunio-hierarchy-treepanel-bottombar',
			layout:'table',
			defaultSelectedSharedFolderType: Grommunio.hierarchy.data.SharedFolderTypes['ALL'],

			items: [{
				cls: 'grommunio-hierarchy-treepanel-footer-opensharedfolder',
				xtype: 'button',
				tooltip: buttonText + Grommunio.core.KeyMapMgr.formatShortcutHint('Alt + S', false),
				text: buttonText + ' + ',
				handler: this.openSharedFolder.createDelegate(this)
			}]
		});

		Grommunio.hierarchy.ui.HierarchyTreeBottomBar.superclass.constructor.call(this, config);
	},

	/**
	 * Called when the button to open Shared Folders is pressed. It will open the dialog to let the
	 * user decide on what folder to open. This function is called within the scope of the
	 * {@link Grommunio.hierarchy.ui.HierarchyTreeBottomBar}.
	 * @param {Ext.Button} button, The Button
	 * @param {Ext.EventObject} event The click event
	 */
	openSharedFolder: function(button, event){
		Grommunio.hierarchy.Actions.openSharedFolderContent(this.defaultSelectedSharedFolderType);
	}
});

Ext.reg('grommunio.hierarchytreebottombar', Grommunio.hierarchy.ui.HierarchyTreeBottomBar);
