/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy');

/**
 * @class Grommunio.hierarchy.HierarchyContext
 * @extends Grommunio.core.Context
 */
Grommunio.hierarchy.HierarchyContext = Ext.extend(Grommunio.core.Context, {
	/*
	 * @constructor
	 * @param config
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			hasToolbar: false,
			hasContentPanel: false
		});

		Grommunio.hierarchy.HierarchyContext.superclass.constructor.call(this, config);

		// Register hierarchy specific dialog types
		Grommunio.core.data.SharedComponentType.addProperty('hierarchy.dialog.folderselection');
		Grommunio.core.data.SharedComponentType.addProperty('hierarchy.dialog.folderproperties');
		Grommunio.core.data.SharedComponentType.addProperty('hierarchy.dialog.foldersize');
		Grommunio.core.data.SharedComponentType.addProperty('hierarchy.dialog.opensharedfolder');
		Grommunio.core.data.SharedComponentType.addProperty('hierarchy.dialog.brokenfiles');
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * This will bid on a dialog.crate or dialog.view for a record with a
	 * message class set to IPM or IPM.Note.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		switch (type) {
			case Grommunio.core.data.SharedComponentType['common.create']:
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.core.data.MAPIRecord) {
					if (record.get('object_type') == Grommunio.core.mapi.ObjectType.MAPI_FOLDER && !record.isSearchFolder()) {
						bid = 1;
					}
				}
				break;
			case Grommunio.core.data.SharedComponentType['hierarchy.dialog.folderselection']:
			case Grommunio.core.data.SharedComponentType['hierarchy.dialog.folderproperties']:
			case Grommunio.core.data.SharedComponentType['hierarchy.dialog.foldersize']:
			case Grommunio.core.data.SharedComponentType['hierarchy.dialog.opensharedfolder']:
			case Grommunio.core.data.SharedComponentType['hierarchy.dialog.brokenfiles']:
				bid = 1;
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
				component = Grommunio.hierarchy.dialogs.CreateFolderContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['hierarchy.dialog.folderselection']:
				component = Grommunio.hierarchy.dialogs.FolderSelectionContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['hierarchy.dialog.folderproperties']:
				component = Grommunio.hierarchy.dialogs.FolderPropertiesContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['hierarchy.dialog.foldersize']:
				component = Grommunio.hierarchy.dialogs.FolderSizeContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['hierarchy.dialog.opensharedfolder']:
				component = Grommunio.hierarchy.dialogs.SharedFolderContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				component = Grommunio.hierarchy.ui.ContextMenu;
				break;
			case Grommunio.core.data.SharedComponentType['hierarchy.dialog.brokenfiles']:
				component = Grommunio.hierarchy.dialogs.BrokenFilesContentPanel;
				break;
		}
		return component;
	}
});

Grommunio.onReady(function() {
	container.registerContext(new Grommunio.core.ContextMetaData({
		name: 'hierarchy',
		allowUserVisible: false,
		pluginConstructor: Grommunio.hierarchy.HierarchyContext
	}));
});
