/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy');

/**
 * @class Grommunio.hierarchy.Actions
 * Hierarchy actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Grommunio.hierarchy.Actions = {
	/**
	 * Open the folder. This will check if the user has rights to open
	 * the given folder, and will call {@link Grommunio.core.Container#selectFolder}
	 * if that is the case. Otherwise if this is a shared store, it will ask
	 * if the store can be closed.
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord[]} folders folders to open either as an array of
	 * {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolder} objects or a single object.
	 */
	openFolder: function(folders)
	{
		var folder = Ext.isArray(folders) ? folders[0] : folders;
		// FIXME: We should determine which accessflag we exactly need
		// and check for that flag.
		if (folder.get('access') !== 0) {
			if (folder.isSearchFolder()) {
				var componentType = Grommunio.core.data.SharedComponentType['common.search'];
				Grommunio.core.data.UIFactory.openLayerComponent(componentType, [], {
					'searchFolder': folder,
					'title': folder.get("display_name")
				});
			} else {
				container.selectFolder(folders);
			}
		} else if (folder.isIPMSubTree() || folder.isSharedFolder()) {
			Ext.MessageBox.show({
				title: _('Insufficient permissions'),
				msg: (folder.isIPMSubTree()
					? _('Not enough permissions to open this store, do you want to remove it from the hierarchy?')
					:_('Not enough permissions to open this folder, do you want to remove it from the hierarchy?')),
				buttons: Ext.MessageBox.YESNO,
				fn: this.onFolderPermissionBox,
				scope: folder
			});
		} else {
			Ext.MessageBox.show({
				title: _('Insufficient Permissions'),
				msg: _('Not enough permissions to open this folder.'),
				buttons: Ext.MessageBox.OK
			});
		}
	},

	/**
	 * Swap a favorite for the folder it points at. A model which re-sorts its folders replaces
	 * the favorite instance by the original one, which the calendar view reads as a deselection.
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord/Grommunio.hierarchy.data.MAPIFolderRecord[]} folders The folders to resolve
	 * @return {Grommunio.hierarchy.data.MAPIFolderRecord/Grommunio.hierarchy.data.MAPIFolderRecord[]} The folders behind the favorites
	 */
	resolveFavorites: function(folders)
	{
		if (!Array.isArray(folders)) {
			return this.resolveFavorites([ folders ])[0];
		}

		var resolved = [];
		for (var i = 0, len = folders.length; i < len; i++) {
			var folder = folders[i];

			if (folder.isFavoritesFolder() && !folder.isSearchFolder()) {
				folder = folder.getOriginalRecordFromFavoritesRecord() || folder;
			}
			resolved.push(folder);
		}

		return resolved;
	},

	/**
	 * Event handler for the {@link Ext.MessageBox#show} which was opened by {@link #openFolder}.
	 * If the "yes" button was pressed, then the folder (the 'this' context for this function)
	 * will be removed from the hierarchy.
	 * @param {String} button The button which was pressed by the user
	 * @private
	 */
	onFolderPermissionBox: function(button)
	{
		if (button === 'yes') {
			if (this.isIPMSubTree()) {
				var store = container.getHierarchyStore();
				var mapistore = this.getMAPIStore();

				store.remove(mapistore);
				store.save(mapistore);
			} else {
				var store = this.store;

				store.remove(this);
				store.save(this);
			}
		}
	},

	/**
	 * Open a {@link Grommunio.common.dialogs.CreateFolderContent CreateFolderContent} for
	 * creating a new folder in the hierarchy.
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} parentFolder The parent folder underneath the new
	 * folder must be created by default.
	 * @param {Object} config (optional) Configuration object for opening the ContentPanel
	 */
	openCreateFolderContent: function(parentFolder, config)
	{
		if (!Ext.isDefined(parentFolder)) {
			// Find parentFolder based on currentContext opened
			parentFolder = container.getHierarchyStore().getDefaultFolder(container.getCurrentContext().getName());

			// Still not found then get default 'Inbox' folder
			if (!Ext.isDefined(parentFolder)) {
				parentFolder = container.getHierarchyStore().getDefaultFolder('inbox');
			}
		}

		// create new folderrecord and set 'parent_entryid'
		var record = Grommunio.core.data.RecordFactory.createRecordObjectByObjectType(Grommunio.core.mapi.ObjectType.MAPI_FOLDER, {
			'parent_entryid': parentFolder.get('entryid'),
			'store_entryid': parentFolder.get('store_entryid')
		});
		config = Ext.applyIf(config || {}, { parentFolder: parentFolder, manager: Ext.WindowMgr });
		Grommunio.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Opens a {@link Grommunio.hierarchy.dialogs.FolderPropertiesContentPanel FolderPropertiesContentPanel}
	 *
	 * @param {Grommunio.core.data.IPFRecord} record describing folder
	 * @param {Object} config (optional) Configuration object for creating the ContentPanel
	 */
	openFolderPropertiesContent: function(folder, config)
	{
		var componentType = Grommunio.core.data.SharedComponentType['hierarchy.dialog.folderproperties'];
		config = Ext.applyIf(config || {}, {
			manager: Ext.WindowMgr
		});
		Grommunio.core.data.UIFactory.openLayerComponent(componentType, folder, config);
	},

	/**
	 * Opens a {@link Grommunio.hierarchy.dialogs.FolderSizeContentPanel FolderSizeContentPanel}
	 *
	 * @param {Grommunio.core.data.IPFRecord} record describing folder
	 * @param {Object} config (optional) Configuration object for creating the ContentPanel
	 */
	openFolderSizeContent: function(folder, config)
	{
		var componentType = Grommunio.core.data.SharedComponentType['hierarchy.dialog.foldersize'];
		config = Ext.applyIf(config || {}, {
			manager: Ext.WindowMgr
		});
		Grommunio.core.data.UIFactory.openLayerComponent(componentType, folder, config);
	},

	/**
	 * Opens a {@link Grommunio.hierarchy.dialogs.SharedFolderContentPanel SharedFolderContentPanel}
	 *
	 * @param {Grommunio.hierarchy.data.SharedFolderTypes} defaultSelectedFolderType default selected folder in combolist.
	 * @param {Object} config (optional) Configuration object for creating the ContentPanel
	 */
	openSharedFolderContent: function(defaultSelectedFolderType, config)
	{
		var componentType = Grommunio.core.data.SharedComponentType['hierarchy.dialog.opensharedfolder'];
		config = Ext.applyIf(config || {}, {
			defaultSelectedFolderType: defaultSelectedFolderType,
			modal: true
		});

		Grommunio.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Opens a {@link Grommunio.hierarchy.dialogs.FolderSelectionContentPanel FolderSelectionContentPanel}.
	 *
	 * @param {Object} config Configuration object for the content panel
	 */
	openFolderSelectionContent: function(config)
	{
		var componentType = Grommunio.core.data.SharedComponentType['hierarchy.dialog.folderselection'];
		config = Ext.applyIf(config || {}, {
			modal: true,
			folder: container.getHierarchyStore().getDefaultFolder('inbox')
		});

		Grommunio.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Append and update the browser tab title based on the unread counter of Inbox folder in hierarchy.
	 * This function will set and update title based on title_counter setting which resides
	 * in {@link Grommunio.settings.ui.SettingsDisplayWidget SettingsDisplayWidget}.
	 *
	 * @param {Grommunio.hierarchy.data.HierarchyStore} hierarchyStore to get unread mail count.
	 */
	setTitleCounter: function(hierarchyStore)
	{
		// First of all check if title counter plugin's setting available else check main settings.
		var titleCounterSetting = container.getSettingsModel().getOneOf('grommunio/v1/plugins/titlecounter/enable', 'grommunio/v1/main/title_counter/show');
		if (titleCounterSetting === true) {
      var title = container.getServerConfig().getWebappTitle();
      var unreadCounter = hierarchyStore.getDefaultFolder('inbox').get('content_unread');
      if (unreadCounter > 0) {
        title = '(' + unreadCounter + ') ' + title;
      }

      Ext.getDoc().dom.title = title;
    }
	},

	/**
	 * Empty a folder using batched deletion with progress notifications.
	 * Used for folders with many items (>= 500) to provide user feedback
	 * instead of a single long-running request that freezes the UI.
	 *
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder The folder to empty
	 * @param {Number} batchSize (optional) Number of items to delete per batch, defaults to 500
	 */
	emptyFolderBatched: function(folder, batchSize)
	{
		batchSize = batchSize || 500;
		var totalItems = folder.get('content_count') || 0;
		var deletedSoFar = 0;
		var folderName = Ext.util.Format.htmlEncode(folder.get('display_name'));

		// Show persistent progress notification
		var notifyRef = container.getNotifier().notify('info.emptyfolder',
			_('Empty folder'),
			String.format(_('Emptying {0}\u2026 (0%)'), folderName),
			{ persistent: true }
		);

		var sendBatch = function() {
			var responseHandler = new Grommunio.core.data.AbstractResponseHandler();
			responseHandler.doProgress = function(response) {
				deletedSoFar += response.deleted_count;

				if (response.done) {
					// Destroy persistent notification and show transient success
					container.getNotifier().notify('info.emptyfolder', null, null, {
						destroy: true,
						reference: notifyRef
					});
					container.getNotifier().notify('info.emptyfolder',
						_('Empty folder'),
						String.format(_('Successfully emptied {0}. ({1} items removed)'), folderName, deletedSoFar)
					);
				} else {
					// Update progress notification in-place
					var pct = totalItems > 0 ? Math.round(deletedSoFar / totalItems * 100) : 0;
					container.getNotifier().notify('info.emptyfolder',
						_('Empty folder'),
						String.format(_('Emptying {0}\u2026 ({1}%)'), folderName, pct),
						{ update: true, reference: notifyRef }
					);
					// Send next batch
					sendBatch();
				}
			};
			responseHandler.doFolders = function() {
				// Folder update is handled by the bus notification system
			};

			var request = container.getRequest();
			request.reset();
			request.addRequest(
				'hierarchymodule',
				'emptyfolder_batch',
				{
					entryid: folder.get('entryid'),
					store_entryid: folder.get('store_entryid'),
					parent_entryid: folder.get('parent_entryid'),
					batch_size: batchSize
				},
				responseHandler
			);
			request.send();
		};

		sendBatch();
	}
};
