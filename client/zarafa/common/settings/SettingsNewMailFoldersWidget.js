Ext.namespace('Zarafa.common.settings');

/**
 * @class Zarafa.common.settings.SettingsNewMailFoldersWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsnewmailfolderswidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} which restricts the new mail
 * notification to a selection of folders.
 */
Zarafa.common.settings.SettingsNewMailFoldersWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	/**
	 * @cfg {String} scopeSetting The setting which holds the folder scope.
	 */
	scopeSetting: 'zarafa/v1/main/notifier/info/newmail/folders/scope',

	/**
	 * @cfg {String} selectedSetting The setting which holds the selected folders.
	 */
	selectedSetting: 'zarafa/v1/main/notifier/info/newmail/folders/selected',

	/**
	 * Settings model instance which will be used to get current settings
	 * @property
	 * @type Zarafa.settings.SettingsModel
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('New Mail Notifications'),
			xtype: 'zarafa.settingsnewmailfolderswidget',
			items: this.createPanelItems()
		});

		Zarafa.common.settings.SettingsNewMailFoldersWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Returns an object which will be used to create items for this settings widget
	 * @return {Array} Array containing configuration objects of child items
	 * @private
	 */
	createPanelItems: function()
	{
		return [{
			xtype: 'radiogroup',
			hideLabel: true,
			columns: 1,
			ref: 'scopeGroup',
			items: [
				{ boxLabel: _('All folders'), inputValue: 'all', name: 'newmailfolderscope' },
				{ boxLabel: _('Only my own mailbox'), inputValue: 'own', name: 'newmailfolderscope' },
				{ boxLabel: _('Only the folders I choose'), inputValue: 'selected', name: 'newmailfolderscope' }
			],
			listeners: {
				change: this.onScopeChange,
				scope: this
			}
		}, {
			xtype: 'container',
			ref: 'folderContainer',
			hidden: true,
			layout: 'hbox',
			height: 160,
			style: 'margin-top: 6px;',
			items: [{
				xtype: 'grid',
				ref: '../folderGrid',
				flex: 1,
				height: 160,
				border: true,
				viewConfig: {
					forceFit: true,
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No folders selected, no new mail notification is shown.') + '</div>'
				},
				store: new Ext.data.JsonStore({
					fields: ['entryid', 'display_name'],
					data: []
				}),
				columns: [{
					dataIndex: 'display_name',
					header: _('Folder'),
					renderer: Ext.util.Format.htmlEncode
				}],
				selModel: new Ext.grid.RowSelectionModel({
					singleSelect: true,
					listeners: {
						selectionchange: this.onFolderSelectionChange,
						scope: this
					}
				})
			}, {
				xtype: 'container',
				width: 110,
				style: 'margin-left: 6px;',
				defaults: { width: 100, style: 'margin-bottom: 6px;' },
				items: [{
					xtype: 'button',
					text: _('Add') + '...',
					handler: this.onAddFolder,
					scope: this
				}, {
					xtype: 'button',
					text: _('Remove'),
					ref: '../../removeFolderBtn',
					disabled: true,
					handler: this.onRemoveFolder,
					scope: this
				}]
			}]
		}];
	},

	/**
	 * Event handler for a change of the folder scope. Shows the folder list
	 * only when the user picked a selection of folders.
	 * @param {Ext.form.RadioGroup} group The radio group which fired the event
	 * @param {Ext.form.Radio} radio The selected radio button
	 * @private
	 */
	onScopeChange: function(group, radio)
	{
		if (!radio) {
			return;
		}

		this.folderContainer.setVisible(radio.inputValue === 'selected');
		this.doLayout();

		if (this.model && this.model.get(this.scopeSetting) !== radio.inputValue) {
			this.model.set(this.scopeSetting, radio.inputValue);
		}
	},

	/**
	 * Event handler for a selection change in the folder list. The remove button
	 * only applies to a selected folder.
	 * @private
	 */
	onFolderSelectionChange: function(selectionModel)
	{
		this.removeFolderBtn.setDisabled(!selectionModel.hasSelection());
	},

	/**
	 * Event handler for the 'Add' button. Opens the folder selection dialog.
	 * @private
	 */
	onAddFolder: function()
	{
		Zarafa.hierarchy.Actions.openFolderSelectionContent({
			IPMFilter: 'IPF.Note',
			hideTodoList: true,
			callback: this.onFolderSelected,
			scope: this
		});
	},

	/**
	 * Callback of the folder selection dialog. Adds the folder to the list
	 * unless it is already in there.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The selected folder
	 * @private
	 */
	onFolderSelected: function(folder)
	{
		if (!folder) {
			return;
		}

		var store = this.folderGrid.getStore();
		var entryid = folder.get('entryid');
		if (store.findExact('entryid', entryid) === -1) {
			store.loadData([{ entryid: entryid, display_name: folder.getFullyQualifiedDisplayName() }], true);
			this.saveFolders();
		}
	},

	/**
	 * Event handler for the 'Remove' button. Removes the selected folder from the list.
	 * @private
	 */
	onRemoveFolder: function()
	{
		var record = this.folderGrid.getSelectionModel().getSelected();
		if (record) {
			this.folderGrid.getStore().remove(record);
			this.saveFolders();
		}
	},

	/**
	 * Write the folders which are in the list into the settings.
	 * @private
	 */
	saveFolders: function()
	{
		if (!this.model) {
			return;
		}

		var entryids = [];
		this.folderGrid.getStore().each(function(record) {
			entryids.push(record.get('entryid'));
		});

		this.model.set(this.selectedSetting, entryids.join(';'));
	},

	/**
	 * Update the view with the new values of the settings model.
	 *
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to display
	 */
	update: function(settingsModel)
	{
		this.model = settingsModel;

		var scope = settingsModel.get(this.scopeSetting) || 'all';
		this.scopeGroup.setValue(scope);
		this.folderContainer.setVisible(scope === 'selected');

		var hierarchyStore = container.getHierarchyStore();
		var selected = settingsModel.get(this.selectedSetting) || '';
		var data = [];

		Ext.each(selected.split(';'), function(entryid) {
			if (Ext.isEmpty(entryid)) {
				return;
			}

			// A folder which no longer exists is kept in the list, so it is not
			// silently dropped from the settings when a store is not opened.
			var folder = hierarchyStore.getFolder(entryid);
			data.push({
				entryid: entryid,
				display_name: folder ? folder.getFullyQualifiedDisplayName() : _('Unknown folder')
			});
		});

		this.folderGrid.getStore().loadData(data);
		this.removeFolderBtn.setDisabled(true);
		this.doLayout();
	}

	// The scope and the folder list are written to the settings model as soon
	// as they change, so there is nothing to collect in updateSettings. Reading
	// the radio group there would reset the scope of a user who never opened
	// this category, as an unrendered group has no value.
});

Ext.reg('zarafa.settingsnewmailfolderswidget', Zarafa.common.settings.SettingsNewMailFoldersWidget);
