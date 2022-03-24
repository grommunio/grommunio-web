Ext.namespace('Zarafa.plugins.files.context');

/**
 * @class Zarafa.plugins.files.FilesContextModel
 * @extends Zarafa.core.ContextModel
 *
 * This class will instantiate a new {@link Zarafa.plugins.files.data.FilesRecordStore files store} object.
 */
Zarafa.plugins.files.FilesContextModel = Ext.extend(Zarafa.core.ContextModel, {

	/**
	 * @cfg {Zarafa.plugins.files.data.BackendStore} backendStore which
	 * contains {@link Zarafa.plugins.files.data.FilesBackendRecord backend} records.
	 */
	backendStore: undefined,

	/**
	 * @cfg {@link Zarafa.plugins.files.data.FilesHierarchyStore FilesHierarchyStore} holds
	 * {@link Zarafa.plugins.files.data.FilesStoreRecord FilesStoreRecord} as records, which defines store information
	 * of all opened stores.
	 */
	hierarchyStore: undefined,

	/**
	 * @cfg {@link Zarafa.plugins.files.data.AccountStore AccountStore} holds
	 * {@link Zarafa.plugins.files.data.AccountRecord AccountRecord} as records,
	 */
	accountStore: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object.
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			statefulRecordSelection: true
		});

		if(!Ext.isDefined(config.hierarchyStore)) {
			config.hierarchyStore = new Zarafa.plugins.files.data.FilesHierarchyStore();
		}

		if (!Ext.isDefined(config.store)) {
			config.store = new Zarafa.plugins.files.data.FilesRecordStore(config);
		}

		if(!Ext.isDefined(config.backendStore)) {
			config.backendStore = new Zarafa.plugins.files.data.BackendStore();
		}

		Zarafa.plugins.files.FilesContextModel.superclass.constructor.call(this, config);

		// Hook an event handler to the 'load' event of the
		// hierarchyStore. Call the event handler directly
		// in case the hierarchy has already been loaded.
		var hierarchyStore = this.getHierarchyStore();
		hierarchyStore.on('load', this.onHierarchyLoad, this);
		this.onHierarchyLoad(hierarchyStore);

		if (this.accountStore) {
			this.accountStore.on({
				'write' : this.updateAccountStore,
				scope : this
			});
		}
	},

	/**
	 * Event handler triggered when {@link Zarafa.plugins.files.data.AccountStore AccountStore} has been
	 * updated. it will load the the {@link Zarafa.plugins.files.data.FilesHierarchyStore FilesHierarchyStore} to update the
	 * {@link Zarafa.plugins.files.ui.Tree Tree}.
	 */
	updateAccountStore : function()
	{
		this.hierarchyStore.load();
	},

	/**
	 * Create a new {@link Zarafa.plugins.files.data.FilesRecord FilesRecord}.
	 *
	 * @param {String} parentid id of the parent folder
	 * @return {Zarafa.plugins.files.data.FilesRecord} The new {@link Zarafa.plugins.files.data.FilesRecord FilesRecord}.
	 */
	createRecord: function (parentid) {
		parentid = parentid || "/";

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Files', {
			store_entryid : "files",
			parent_entryid: parentid
		});
		record.store = this.getStore();
		return record;
	},

	/**
	 * Update the current preview {@link Zarafa.core.data.IPMRecord}
	 * This will fire the event {@link #previewrecordchange}.
	 *
	 * @param {mixed} record The record which is set as preview or false to refresh the old record
	 * @param {Boolean} refresh (optinal) true to just refresh the old record
	 */
	setPreviewRecord: function (record, refresh) {
		if (container.getCurrentContext().getName() === "filescontext") {
			var previewPanel = Zarafa.plugins.files.data.ComponentBox.getPreviewPanel();
			var panelConstructor;

			if (refresh && this.previewRecord) {

				panelConstructor = container.getSharedComponent(Zarafa.core.data.SharedComponentType['common.preview'], this.previewRecord);

				previewPanel.removeAll();
				if (Ext.isDefined(panelConstructor)) {
					previewPanel.add(new panelConstructor());
					previewPanel.doLayout();
					previewPanel.fileinfo.update(this.previewRecord);
				}

			} else if (this.previewRecord !== record) {
				this.previewRecord = record;

				if (Ext.isDefined(record)) {
					panelConstructor = container.getSharedComponent(Zarafa.core.data.SharedComponentType['common.preview'], record);

					if (Ext.isDefined(panelConstructor) && previewPanel.fileinfo instanceof panelConstructor) {
						previewPanel.fileinfo.update(record);
					} else {

						previewPanel.removeAll();
						if (panelConstructor) {
							previewPanel.add(new panelConstructor());
							previewPanel.doLayout();
							previewPanel.fileinfo.update(record);
						}
					}
				} else {
					previewPanel.removeAll();
				}
			}
		}
	},

	/**
	 * Resume the loading actions again if {@link #suspendLoading}.
	 * This will allow the {@link #load} function to use the {@link #store}
	 * again to send requests to the server. This will also call {@link #load}
	 * with the last options that were given to it while being suspended.
	 *
	 * @param {Boolean} discard Discard the calls to load while being suspended.
	 */
	resumeLoading : function(discard)
	{
		if (this.suspended === true) {
			this.suspended = false;
			if (discard !== false) {
				var defaultFolder = this.getDefaultFolder();
				if (Ext.isDefined(defaultFolder)) {
					var options = Ext.apply({}, {
						folder : this.getDefaultFolder()
					});
					this.store.load(options);
				}
			}
			delete this.suspendData;
		}
	},

	/**
	 * Function used to get the {@link Zarafa.plugins.files.data.FilesHierarchyStore FilesHierarchyStore}
	 * @return {Zarafa.plugins.files.data.FilesHierarchyStore} return the {@link Zarafa.plugins.files.data.FilesHierarchyStore FilesHierarchyStore}
	 */
	getHierarchyStore: function ()
	{
		if(!this.hierarchyStore) {
			this.hierarchyStore = new Zarafa.plugins.files.data.FilesHierarchyStore();
		}
		return this.hierarchyStore;
	},

	/**
	 * Removes a folder from the selected folder list.
	 * This function automatically causes the store to
	 * reload its contents. This method triggers the
	 * {@link #folderchange} event if the folder was previously in the list.
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord} folder folder to remove.
	 * @return {Zarafa.plugins.files.data.FilesFolderRecord} the folder if it was removed,
	 * or undefined otherwise (i.e. it was not in the folder list).
	 */
	removeFolder : function(folder)
	{
		var localFolder = this.getFolder(folder.get('entryid'));

		if (!Ext.isDefined(localFolder)) {
			var isParentFolderOfSelectedFolder = folder.isParentFolderOfSelectedFolder(this.getDefaultFolder());
			if (isParentFolderOfSelectedFolder === true) {
				this.folders.remove(this.getDefaultFolder());
				this.setParentFolderToDefaultFolder(folder);
			} else {
				return undefined;
			}
		} else {
			// Remove the folder from the list.
			this.folders.remove(localFolder);
			this.setParentFolderToDefaultFolder(localFolder);
		}

		this.onFolderChange(this, this.folders);

		// Fire 'folderchange' event.
		this.fireEvent('folderchange', this, this.folders);

		this.load();

		return localFolder;
	},

	/**
	 * Helper function which used to push the parent folder of currently selected into {@link #folders} array.
	 * If parent folder is undefined than it will push the {@link #defaultFolder} into {@link #folders} array.
	 *
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord} folder The folder which is going to be deleted.
	 */
	setParentFolderToDefaultFolder : function(folder)
	{
		// A ContextModel must always have at least
		// 1 folder loaded. When the last folder is
		// being unloaded, load the parent or default folder again.
		if (Ext.isEmpty(this.folders)) {
			var parentFolder = folder.getParentFolder();
			if (parentFolder) {
				this.folders.push(parentFolder);
			} else {
				this.folders.push(this.defaultFolder);
			}
		}
	},

	/**
	 * Event handler which is executed right before the {@link #folderchange}
	 * event is fired. This allows subclasses to update the folders.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event.
	 * @param {Array} folders selected folders as an array of {@link Zarafa.plugins.files.data.FilesFolderRecord Folder} objects.
	 * @private
	 */
	onFolderChange : Ext.emptyFn,

	/**
	 * Sets {@link #defaultFolder default folder} for the particular {@link Zarafa.core.Context context}.
	 * This will help while opening new item dialog from other contexts
	 * e.g. Create new Contact from Inbox, at this moment we need {@link #defaultFolder} to create the item.
	 *
	 * When the {@link Zarafa.core.Context context} was opened without any folders,
	 * this also means we can now {@link #addFolder load} the {@link #defaultFolder}.
	 *
	 * @param {Zarafa.plugins.files.data.FilesHierarchyStore} store that holds hierarchy data.
	 * @private
	 */
	onHierarchyLoad : function (hierarchyStore) {
		this.defaultFolder = hierarchyStore.getFolder("#R#");

		// If we haven't any folders yet. We should obtain
		// the previously used folders or the default folder.
		var openfolders = [];

		if (!Ext.isEmpty(this.last_used_folders)) {
			for (var key in this.last_used_folders) {
				var store = hierarchyStore.getById(key);
				if (!store) {
					continue;
				}

				var folders = store.getSubStore('folders');
				var statefolders = this.last_used_folders[key];
				for (var i = 0; i < statefolders.length; i++) {
					var folder = folders.getById(statefolders[i]);
					if (!folder) {
						continue;
					}

					openfolders.push(folder);
				}
			}
		}

		if (Ext.isEmpty(openfolders) && this.defaultFolder) {
			openfolders.push(this.defaultFolder);
		}

		this.setFolders(openfolders);
	}
});
