/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.today');

/**
 * @class Grommunio.today.TodayContextModel
 * @extends Grommunio.core.ContextModel
 *
 * The aim of this model is to cause the root folder in the hierarchy to be selected when switching to the TodayContext
 * This is done by setting {@link Grommunio.core.ContextModel#defaultFolder}
 */
Grommunio.today.TodayContextModel = Ext.extend(Grommunio.core.ContextModel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			stateful: false
		});
		Grommunio.today.TodayContextModel.superclass.constructor.call(this, config);
	},

	/**
	 * Called during the {@link Grommunio.core.Context#disable disabling} of the {@link Grommunio.core.Context context}.
	 * This will {@link #stopSearch stop the search} and clear all data in the {@link #store}.
	 */
	disable: Ext.emptyFn,

	/**
	 * Sets the selected folder list directly.
	 * Fires the {@link #folderchange} event.
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord[]} folders selected folders as an array of
	 * {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolder} objects.
	 */
	setFolders: Ext.emptyFn,

	/**
	 * Returns the default {@link Grommunio.hierarchy.data.MAPIFolderRecord folder} which is
	 * used within the current selection of folders.
	 * @return {Grommunio.hierarchy.data.MAPIFolderRecord} The default folder
	 */
	getDefaultFolder: function()
	{
		if (!this.defaultFolder) {
			var store = container.getHierarchyStore().getDefaultStore();
			if (store) {
				this.defaultFolder = store.getSubtreeFolder();
			}
		}
		return this.defaultFolder;
	}
});
