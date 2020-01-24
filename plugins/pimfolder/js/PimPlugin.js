Ext.namespace('Zarafa.plugins.pimfolder');

/**
 * @class Zarafa.plugins.pimfolder.PimPlugin
 * @extends Zarafa.core.Plugin
 * 
 * This class represents the core functionality of the Personal Inbox
 * Manager plugin (or PIM-folder).  The user gets a new icon in the
 * context menu and in the preview panel, that allows him to move the
 * currently selected message to a preconfigured folder.  The
 * reasoning is that it's then possibly to quickly move e-mails to a
 * designated "archive" folder for working through incoming e-mail
 * faster.
 */
Zarafa.plugins.pimfolder.PimPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Called after constructor; registers insertion points in the
	 * preview panel and in the mail context menu.
	 * @protected
	 */
	initPlugin : function()
	{
		Zarafa.plugins.pimfolder.PimPlugin.superclass.initPlugin.apply(this, arguments);

		this.registerInsertionPoint('previewpanel.toolbar.right', this.makeAButtonInToolbarMenu, this);
		this.registerInsertionPoint('context.mail.contextmenu.options', this.makeAButtonInContextMenu, this);
		this.registerInsertionPoint('context.settings.category.plugins', this.createSettingsWidget, this);
	},

	/**
	 * Create a button in the mail context menu. The item text
	 * contains the name of the target folder. If no folder is
	 * configured (or the folder doesn't exist any longer), then the
	 * button is hidden.
	 * 
	 * @return {Ext.Button} Button instance
	 * @private
	 */
	makeAButtonInContextMenu : function ()
	{
		var folder = this.getTargetFolder();
		if (!folder) {
			return;
		}

		var displayName = folder.getFullyQualifiedDisplayName();
		return  [{
			xtype : 'zarafa.conditionalitem',
			tooltip : String.format(_('Move currently selected message(s) to {0}'), displayName),
			text : String.format(_('Move to {0}'), displayName),
			iconCls : 'icon_pim_setup',
			handler : this.moveSelectedMailsToFolder,
			scope : this
		}];
	},

	/**
	 * Create a button in the tool bar of the preview panel. The item
	 * text contains the name of the target folder. If no folder is
	 * configured (or the folder doesn't exist any longer), then the
	 * button is hidden.
	 *
	 * @return {Ext.Button} Button instance
	 * @private
	 */
	makeAButtonInToolbarMenu: function ()
	{
		var folder = this.getTargetFolder();
		if (!folder) {
			return;
		}

		var displayName = folder.getFullyQualifiedDisplayName();
		return {
			xtype : 'button',
			tooltip : String.format(_('Move current message to {0}'), displayName),
			overflowText : String.format(_('Move to {0}'), displayName),
			iconCls : 'icon_pim_setup',
			handler : this.moveOneMailToFolder,
			scope : this,
			plugins : ['zarafa.recordcomponentupdaterplugin'],
			update : function(record, contentReset)
			{
				this.records = [ record ];
			}
		};
	},

	/**
	 * Handler function for the mail context menu. This method allows
	 * moving multiple messages at once. Calls {@link @moveMailsToFolder}.
	 *
	 * @param {Ext.button} btn Reference to the context menu item.
	 * @private
	 */
	moveSelectedMailsToFolder : function(btn)
	{
		this.moveMailsToFolder(btn.parentMenu.records);
	},

	/**
	 * Handler function for the mail context menu. This method allows
	 * moving multiple messages at once. Calls {@link @moveMailsToFolder}.
	 * 
	 * @param {Ext.button} btn Reference to the tool bar button.
	 * @private
	 */
	moveOneMailToFolder : function(btn)
	{
		this.moveMailsToFolder(btn.records);
	},

	/**
	 * Move the given records to the configured folder.
	 * 
	 * @param {Ext.data.Record[]} records The selected e-mails in the list.
	 * @private
	 */
	moveMailsToFolder : function(records)
	{
		var folder = this.getTargetFolder();

		if (folder == undefined || records.length == 0) {
			return;
		}

		var store = undefined;
		Ext.each(records, function(record) {
			store = record.store;
			record.moveTo(folder);
		}, this);

		store.save(records);
	},

	/**
	 * Obtain the folder which was previously selected by the user from the {@link Zarafa.hierarchy.data.HierarchyStore}.
	 *
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} The selected folder
	 */
	getTargetFolder : function()
	{
		var settingsModel = container.getSettingsModel();
		var storeEntryId = settingsModel.get(this.getSettingsBase() + '/store_entryid');
		var folderEntryId = settingsModel.get(this.getSettingsBase() + '/folder_entryid');

		if (!Ext.isEmpty(storeEntryId) && !Ext.isEmpty(folderEntryId)) {
			var hierarchyStore = container.getHierarchyStore();
			var store = hierarchyStore.getById(storeEntryId);

			if (store) {
				return store.getFolderStore().getById(folderEntryId);
			}
		}
	},

	/**
	 * Return the instance of {@link Zarafa.plugins.pimfolder.PimPluginSettingsWidget}.
	 * 
	 * @return {Zarafa.plugins.pimfolder.PimPluginSettingswidget} An instance of the settings widget
	 * @private
	 */
	createSettingsWidget : function()
	{
		return {
			xtype : 'zarafa.pimfoldersettingswidget',
			plugin : this
		};
	}
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'pimfolder',
		displayName : _('Personal Inbox Manager'),
		pluginConstructor : Zarafa.plugins.pimfolder.PimPlugin
	}));
});
