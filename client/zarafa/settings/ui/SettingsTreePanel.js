Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsTreePanel
 * @extends Zarafa.common.ui.EditorTreeGrid
 * @xtype zarafa.settingstreepanel
 *
 * A special {@link Ext.Panel panel} which contains a {@link Ext.ux.tree.TreeGrid TreeGrid}
 * which represents the settings hierarchy.
 */
Zarafa.settings.ui.SettingsTreePanel = Ext.extend(Zarafa.common.ui.EditorTreeGrid, {
	/**
	 * @cfg {Object} editors Object containing the editors which must be use for editing
	 * the Setting Value property. The keys used in this object are the 'typeof' results
	 * of the value type.
	 */
	editors : undefined,

	/**
	 * @cfg {Zarafa.settings.SettingsModel} model The model which should be displayed
	 * in the grid. This can be configured later using {@link #bindModel}.
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.editortreegrid',
			ref: 'treeGrid',
			border: false,
			rootVisible: true,
			enableHdMenu: false,
			enableSort: true,
			forceFit: true,
			loader: new Zarafa.settings.data.SettingsTreeLoader({
				model : config.model,
				autoExpandLevel : 4,
				autoExpandFilter : /^\/*(zarafa.*)?$/
			}),
			root: new Zarafa.settings.ui.SettingsTreeNode({
				text: _('Settings'),
				id: '/',
				expanded: false
			}),
			editors : {
				'boolean' : { xtype: 'checkbox' },
				'number' : { xtype: 'zarafa.spinnerfield', plugins : [ 'zarafa.numberspinner' ] },
				'string' : { xtype: 'textfield' }
			},
			columns: [{
				id: 'setting',
				header: _('Setting'),
				dataIndex: 'text',
				tpl: '{text:htmlEncodeUndef}'
			},{
				id: 'value',
				header: _('Value'),
				dataIndex: 'value',
				tpl: '{value:htmlEncodeUndef}',
				width: 250,
				editable : true
			}]
		});

		Zarafa.settings.ui.SettingsTreePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Called by Extjs to initialize all event listeners.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.settings.ui.SettingsTreePanel.superclass.initEvents.call(this);

		this.on('afteredit', this.onAfterEdit, this);
		this.on('contextmenu', this.onContextMenu, this);

		if (this.model) {
			this.bindModel(this.model, true);
		}
	},

	/**
	 * Initialize a new {@link Zarafa.settings.SettingsModel Settings Model}.
	 * @param {Zarafa.settings.SettingsModel} model The model to load
	 * @param {Boolean} initialize (optional) True if this function is called
	 * during initialization
	 */
	bindModel : function(model, initialize)
	{
		if (initialize || this.model !== model) {
			if (this.model) {
				this.mun(this.model, 'set', this.onSettingsChange, this);
				this.mun(this.model, 'remove', this.onSettingsRemove, this);

				this.root.collapse();
			}

			this.model = model;

			if (this.model) {
				this.loader.bindModel(this.model);
				this.mon(this.model, {
					set : this.onSettingsChange,
					remove : this.onSettingsRemove,
					scope: this
				});

				this.root.expand();
			}
		} else {
			this.root.reload();
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.settings.SettingsModel settingsModel}
	 * has fired the {@link Zarafa.settings.SettingsModel#set} event to indicate that one or
	 * more settings have been changed. This will look up the corresponding nodes and
	 * changes the value accordingly.
	 * @param {Zarafa.settings.SettingsModel} model The model which fired the event
	 * @param {Array} settings The array of settings which has been changed
	 * @private
	 */
	onSettingsChange : function(model, settings)
	{
		if (!Array.isArray(settings)) {
			settings = [ settings ];
		}

		for (var i = 0, len = settings.length; i < len; i++) {
			var setting = settings[i];
			var node = this.getNodeById(setting.path);

			if (node) {
				// The node is visible for the user, update the value
				if (node.attributes['value'] !== setting.value) {
					if (this.rendered) {
						node.setValue(setting.value);
					}
				}
			} else {
				// THe node is not visible for the user, lets see if the
				// parent is, and has already been loaded by the user,
				// but is either collapsed, or this is a new setting, which
				// requires the parent to be reloaded.
				var index = setting.path.lastIndexOf('/');
				var path = setting.path.substring(0, index) || '/';
				var p = this.getNodeById(path);
				if (p && p.isLoaded()) {
					p.reload();
				}
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.settings.SettingsModel settingsModel}
	 * has fired the {@link Zarafa.settings.SettingsModel#remove} event to indicate that one or
	 * more settings have been removed. This will look up the corresponding nodes and
	 * delete them from the tree.
	 * @param {Zarafa.settings.SettingsModel} model The model which fired the event
	 * @param {Array} settings The array of settings which has been deleted
	 * @private
	 */
	onSettingsRemove : function(model, settings)
	{
		if (!Array.isArray(settings)) {
			settings = [ settings ];
		}

		for (var i = 0, len = settings.length; i < len; i++) {
			var path = settings[i];
			var node = this.getNodeById(path);
			if (node) {
				node.remove(true);
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link #afteredit} event has been fired.
	 * This will {@link Zarafa.settings.SettingsModel#set update} the setting in the
	 * {@link Zarafa.settings.SettingsModel}.
	 * @param {Zarafa.common.ui.EditorTreeGrid} grid The grid which fired the event
	 * @param {Ext.tree.TreeNode} node The node which was being edited
	 * @param {Number} column The column which has been edited
	 * @param {Mixed} value The value which was applied to the node
	 * @private
	 */
	onAfterEdit : function(grid, node, column, value)
	{
		this.model.set(node.id, value);
	},

	/**
	 * Event handler which is fired when the {@link #contextmenu} event has been fired.
	 * This will open the contextmenu for this node.
	 * @param {Ext.tree.TreeNode} node The node on which the contextmenu was requested
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onContextMenu : function(node, event)
	{
		node.select();
		Zarafa.core.data.UIFactory.openDefaultContextMenu(node, { position : event.getXY(), settingsModel : this.model });
	},

	/**
	 * Obtain the {@link Ext.form.Field} which should be used for editing the cell
	 * indicated by the given node and column. This will check which property is being
	 * edited and will look up the most appropriate editor for the value.
	 * @param {Ext.tree.TreeNode} node The node for which the required editor is looked up
	 * @param {Number} column The column index for which the editor is looked up
	 * @return {Ext.form.Field} The editor used to edit the given cell
	 */
	getEditor : function(node, column)
	{
		var field = this.getColumn(column).dataIndex;
		var value = node.attributes[field];
		var type = typeof value;

		if (Ext.isDefined(this.editors[type])) {
			return Ext.create(this.editors[type]);
		} else {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg : String.format(_('The setting \'{0}\' can not be edited'), Ext.util.Format.htmlEncode(node.text)),
				icon: Ext.MessageBox.WARNING,
				buttons: Ext.MessageBox.OK
			});
		}
	},

	/**
	 * Called when this component is being destroyed. This will automatically destroy
	 * all {@link #editors} as well.
	 * @private
	 */
	onDestroy : function()
	{
		Zarafa.settings.ui.SettingsTreePanel.superclass.onDestroy.call(this);

		for (var key in this.editors) {
			var editor = this.editors[key];
			if (Ext.isFunction(editor.destroy)) {
				editor.destroy();
			}
		}
	}
});

Ext.reg('zarafa.settingstreepanel', Zarafa.settings.ui.SettingsTreePanel);
