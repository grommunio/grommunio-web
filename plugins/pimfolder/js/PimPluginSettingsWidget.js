Ext.namespace('Zarafa.plugins.pimfolder');

/**
 * @class Zarafa.plugins.pimfolder.PimPluginSettingsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.pimfoldersettingswidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for
 * configuring the settings of the plugin, which is basically only the
 * folder to move e-mails to.
 */
Zarafa.plugins.pimfolder.PimPluginSettingsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @cfg {Zarafa.plugins.pimfolder.PimPlugin} plugin The plugin which has registered this
	 * settings widget.
	 */
	plugin : undefined,

	/**
	 * Currently selected folder - reference kept around for
	 * convenience.
	 * 
	 * @property
	 * @type Zarafa.hierarchy.data.MAPIFolderRecord
	 * @private
	 */
	currentFolder: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{	
		config = config || {};

		Ext.applyIf(config, {
			title : _('Personal Inbox Management Settings'),
			xtype: 'panel',
			items: [{
				xtype: 'zarafa.compositefield',
				hideLabel: true,
				items: [{
					xtype: 'displayfield',
					autoWidth: true,
					ref: '../selectedFolderLabel'
				}, {
					xtype: 'button',
					text: _('Select another folder'),
					handler: this.onSelectFolder,
					scope: this
				}]
			}]
		});
		Zarafa.plugins.pimfolder.PimPluginSettingsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * User clicked on the button to select a different folder - open
	 * a folder selection dialog, with the currently configured
	 * folder selected.
	 * 
	 * @private
	 */
	onSelectFolder : function() {
		Zarafa.hierarchy.Actions.openFolderSelectionContent({
			callback: this.onFolderSelected,
			folder: this.currentFolder,
			scope: this
		});
	},

	/**
	 * Callback function: a folder was selected. Update the settings
	 * and the label.
	 * 
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The selected folder.
	 * @private
	 */
	onFolderSelected : function(folder) {
		var settingsModel = container.getSettingsModel();
		settingsModel.beginEdit();
		settingsModel.set('zarafa/v1/plugins/pimfolder/folder_entryid', folder.get('entryid'));
		settingsModel.set('zarafa/v1/plugins/pimfolder/store_entryid', folder.get('store_entryid'));
		settingsModel.endEdit();
		this.update(settingsModel);
	},

	/**
	 * Update the view with the new values of the settings
	 * model. Called when opening the settings widget or when a new
	 * folder is selected.
	 * 
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to display.
	 */
	update : function(settingsModel)
	{
		var displayName = _('(None)');
		this.currentFolder = this.plugin.getTargetFolder();

		if (this.currentFolder) {
			displayName = this.currentFolder.getFullyQualifiedDisplayName();
		}

		var value = String.format(_('E-mails are moved to {0}'), displayName);
		this.selectedFolderLabel.setValue(value);
		this.doLayout();
	}
});

Ext.reg('zarafa.pimfoldersettingswidget', Zarafa.plugins.pimfolder.PimPluginSettingsWidget);
