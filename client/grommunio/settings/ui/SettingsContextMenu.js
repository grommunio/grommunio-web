Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsContextMenu
 * @extends Grommunio.core.ui.menu.ConditionalMenu
 * @xtype grommunio.settingscontextmenu
 */
Grommunio.settings.ui.SettingsContextMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.settings.tree.contextmenu.actions
	 * @param {Grommunio.settings.ui.SettingsContextMenu} contextmenu This contextmenu
	 */

	/**
	 * @cfg {Grommunio.settings.SettingsModel} settingsModel The settingsModel on which
	 * to work with the settings.
	 */
	settingsModel: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var isRoot = false;
		var isEditable = false;
		if (config.records) {
			if (Array.isArray(config.records)) {
				config.records = config.records[0];
			}

			isRoot = Ext.isDefined(config.records.isRoot) && config.records.isRoot;
			isEditable = config.records.isEditable();
		}

		Ext.applyIf(config, {
			settingsModel: container.getSettingsModel(),
			items: [{
				xtype: 'grommunio.conditionalitem',
				text: _('Edit setting'),
				hidden: isRoot || !isEditable,
				handler: this.onEditSetting,
				scope: this
			},{
				xtype: 'grommunio.conditionalitem',
				text: _('Restore to defaults'),
				hidden: isRoot,
				handler: this.onRestoreSettings,
				scope: this
			},{
				xtype: 'grommunio.conditionalitem',
				text: _('Delete settings'),
				hidden: isRoot,
				handler: this.onDeleteSettings,
				scope: this
			},{
				xtype: 'menuseparator'
			},
			container.populateInsertionPoint('context.settings.tree.contextmenu.actions', this)
			]
		});

		Grommunio.settings.ui.SettingsContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler when the "Edit Setting" option was selected.
	 * This will enable the {@link Grommunio.settings.ui.SettingsTreeNode#startEdit editor}.
	 * @private
	 */
	onEditSetting: function()
	{
		this.records.startEdit();
	},

	/**
	 * Event handler when the "Restore default" option was selected.
	 * This will {@link Grommunio.settings.SettingsModel#restore restore the default values} of the settings.
	 * @private
	 */
	onRestoreSettings: function()
	{
		this.settingsModel.restore(this.records.id);
	},

	/**
	 * Event handler when the "Delete settings" option was selected.
	 * This will {@link Grommunio.settings.SettingsModel#remove remove} settings.
	 * @private
	 */
	onDeleteSettings: function()
	{
		this.settingsModel.remove(this.records.id);
	}

});

Ext.reg('grommunio.settingscontextmenu', Grommunio.settings.ui.SettingsContextMenu);
