Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsPluginsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingspluginswidget
 *
 * The WebApp available plugins widgets
 */
Zarafa.settings.ui.SettingsPluginsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var store = new Ext.data.ArrayStore({
			fields : [{
				'name' : 'name'
			},{
				'name' : 'display_name'
			},{
				'name' : 'version'
			},{
				'name' : 'enabled',
				'type' : 'boolean'
			},{
				'name' : 'allow_disable',
				'type' : 'boolean'
			},{
				'name' : 'settings_base'
			}]
		});

		var plugins = container.getPluginsMetaData();
		var server = container.getServerConfig();
		var pluginsVersion = server.getPluginsVersion();
		var versionInfo;
		for (var i = 0, len = plugins.length; i < len; i++) {
			var plugin = plugins[i];
			if (!plugin.isPrivate()) {
				if( Ext.isEmpty(pluginsVersion[plugin.getName()]) ) {
					versionInfo = _('Unknown');
				} else {
					versionInfo = pluginsVersion[plugin.getName()];
				}

				store.add(new Ext.data.Record({
					'name' : plugin.getName(),
					'display_name' : plugin.getDisplayName(),
					'version' : versionInfo,
					'enabled' : plugin.isEnabled(),
					'allow_disable' : plugin.allowUserDisable,
					'settings_base' : plugin.getSettingsBase()
				}));
			}
		}

		store.sort('display_name', 'ASC');

		var model = new Ext.grid.CheckboxSelectionModel({
			checkOnly : true,
			header : '&#160;',
			renderer : this.onEnabledRenderer,
			// Disable grid traversal using key events because we are using grid selection to
			// indicate plugin's enable/disable state, so that shouldn't be modified
			// when traversing using up/down arrow keys
			onKeyPress : Ext.emptyFn,
			listeners: {
				rowselect : this.onRowSelect,
				rowdeselect : this.onRowDeselect,
				scope: this
			}
		});

		Ext.applyIf(config, {
			title : _('Available plugins'),
			layout : 'fit',
			items : [{
				xtype : 'panel',
				border : false,
				cls : 'zarafa-settings-pluginavailable',
				ref: 'pluginsPanel',
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack  : 'start'
				},
				items : [{
					xtype : 'displayfield',
					value : _('The following plugins are available in the WebApp. It is possible to select and/or deselect different plugins to indicate which plugins should be enabled. When any plugin is enabled or disabled, the WebApp must be reloaded in order for the changes to take effect.'),
					fieldClass : 'zarafa-settings-widget-extrainfo',
					ref : 'extrainfo',
					height: 50
				},{
					xtype: 'grid',
					border: true,
					flex : 1,
					enableHdMenu: false,
					deferRowRender:false,
					autoExpandColumn: 'display_name',
					cls: 'k-settings-plugingrid',
					ref: '../pluginsGrid',
					viewConfig: {
						forceFit: true,
						emptyText : '<div class=\'emptytext\'>' + _('No plugins available') + '</div>'
					},
					store: store,
					columns: [model, {
						id : 'display_name',
						header  : _('Display Name'),
						dataIndex: 'display_name',
						headerCls: 'k-unsortable',
						sortable: false,
						renderer : this.onDisplayNameRenderer
					},{
						id : 'display_name',
						header  : _('Version'),
						dataIndex: 'version',
						headerCls: 'k-unsortable',
						sortable: false
					}],
					selModel: model
				}],
				listeners : {
					scope: this,
					resize : this.onResizePluginsPanel
				}
			}]
		});

		Zarafa.settings.ui.SettingsPluginsWidget.superclass.constructor.call(this, config);
		this.pluginsGrid.on('rowclick', this.onRowClick, this);
	},

	/**
	 * Event handler for the resize event of the plugins panel. Will calculate the correct size of the
	 * extrainfo textfield and trigger a layout refresh.
	 * @param {Ext.panel} pluginsPanel The panel that contains the extrainfo textfield and the grid
	 * with the plugins.
	 */
	onResizePluginsPanel : function(pluginsPanel)
	{
		// First set the size of the extrainfo field to auto, so we can calculate the auto height
		// and then set that height on the component specifically
		var el = pluginsPanel.extrainfo.getEl();
		el.setHeight('auto');
		var height = el.getHeight();
		pluginsPanel.extrainfo.setHeight(height);
		pluginsPanel.extrainfo.height = height;

		// Now trigger a layout refresh to have the grid rendered with the correct height
		pluginsPanel.doLayout();
	},

	/**
	 * Event handler is called when user clicks on row of grid.
	 * Function toggles plugin selection.
	 * @param {Ext.grid.GridPanel} grid grid panel object.
	 * @param {Number} rowIndex The index of the row which was double clicked
	 * @param {Ext.EventObject} eventObj object of the event.
	 * @private
	 */
	onRowClick : function(grid, rowIndex, eventObj)
	{
		grid.getView().focusRow(rowIndex);

		var model = grid.getSelectionModel();
		var store = grid.getStore();
		var record = store.getAt(rowIndex);

		// Here it will check selected plugins is not default plugin.
		// user could not disable default plugin.
		if(!record.get('allow_disable')) {
			return;
		}

		if(!record.get('enabled')) {
			model.selectRow(rowIndex, true);
		} else {
			model.deselectRow(rowIndex);
		}
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.model = settingsModel;
		var selModel = this.pluginsGrid.getSelectionModel();
		var store = this.pluginsGrid.getStore();
		var records = [];

		store.each(function(plugin) {
			// Only update the 'enabled' property if the plugin is allowed
			// to be disabled. If not, then the 'enabled' flag cannot have
			// been changed.
			if (plugin.get('allow_disable')) {
				plugin.set('enabled', settingsModel.get(plugin.get('settings_base') + '/enable'));
			}

			// If the plugin is enabled, add it to the list of
			// records which is going to be selected.
			if (plugin.get('enabled')) {
				records.push(plugin);
			}
		});

		// Disable events, as we don't want our own
		// event handlers for 'selectrow' and 'deselectrow'
		// to be fired during update.
		selModel.suspendEvents(false);
		selModel.selectRecords(records);
		selModel.resumeEvents();
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		var store = this.pluginsGrid.getStore();

		settingsModel.beginEdit();

		store.each(function(plugin) {
			if (plugin.get('allow_disable')) {
				settingsModel.set(plugin.get('settings_base') + '/enable', plugin.get('enabled'));
			}
		});

		settingsModel.endEdit();
	},

	/**
	 * Render the display name in the cell.
	 * This will generate an additional <span> element, if this is a non-editable row
	 * which serves as replacement for the "Enabled" column
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	onDisplayNameRenderer : function(value, p, record)
	{
		value = Ext.util.Format.htmlEncode(value);

		if (!record.get('allow_disable')) {
			// Add CSS class that this plugin cannot be disabled
			p.css += ' zarafa-settings-pluginavailable-fixed';
			// Add message that this plugin cannot be disabled
			if ( record.get('enabled') === true ){
				value += ' <span>' + _('This plugin cannot be disabled') + '</span>';
			} else {
				value += ' <span>' + _('This plugin cannot be enabled') + '</span>';
			}
		}

		return value;
	},

	/**
	 * Render the 'enabled' property in the cell.
	 * This will make itself invisible if this is a non-editable row.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	onEnabledRenderer : function(value, p, record)
	{
		if (record.get('allow_disable')) {
			return Ext.grid.CheckboxSelectionModel.prototype.renderer.apply(this, arguments);
		} else {
			// Add CSS class that this plugin cannot be disabled
			p.css += ' zarafa-settings-pluginavailable-fixed';
			return '';
		}
	},

	/**
	 * Event handler which is fired when the row has been selected by the user.
	 * This will toggle the 'enabled' property on the passed record, and update
	 * the {@link #model settings}.
	 * @param {Ext.grid.CheckboxSelectionModel} model The model which fired the event
	 * @param {Number} index The index which was selected
	 * @param {Ext.data.Record} record The record which was selected
	 * @private
	 */
	onRowSelect : function(model, index, record)
	{
		record.set('enabled', true);
		this.model.set(record.get('settings_base') + '/enable', true);
		this.model.requiresReload = true;
	},

	/**
	 * Event handler which is fired when the row has been deselected by the user.
	 * This will toggle the 'enabled' property on the passed record, and update
	 * the {@link #model settings}.
	 * @param {Ext.grid.CheckboxSelectionModel} model The model which fired the event
	 * @param {Number} index The index which was selected
	 * @param {Ext.data.Record} record The record which was selected
	 * @private
	 */
	onRowDeselect : function(model, index, record)
	{
		record.set('enabled', false);
		this.model.set(record.get('settings_base') + '/enable', false);
		this.model.requiresReload = true;
	}
});

Ext.reg('zarafa.settingspluginswidget', Zarafa.settings.ui.SettingsPluginsWidget);
