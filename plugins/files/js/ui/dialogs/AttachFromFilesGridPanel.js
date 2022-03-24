Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.AttachFromFilesGridPanel
 * @extends Ext.grid.GridPanel
 * @xtype filesplugin.attachfromfilesgridpanel
 *
 * This dialog panel will provide facility to user to select the
 * files by checking checkbox from {@link Ext.grid.GridPanel GridPanel}.
 */
Zarafa.plugins.files.ui.dialogs.AttachFromFilesGridPanel = Ext.extend(Ext.grid.GridPanel, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		var model = new Ext.grid.CheckboxSelectionModel({
			checkOnly : true,
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_all_day">&nbsp;<span class="title">' + _('All Day') + '</span></p>',
			width    : 24
		});

		Ext.applyIf(config, {
			xtype : 'filesplugin.attachfromfilesgridpanel',
			style: {
				paddingLeft: '9px'
			},
			columns: [model,{
				id       : 'type',
				dataIndex: 'type',
				header   : '<p class="icon_index">&nbsp;</p>',
				headerCls: 'zarafa-icon-column icon',
				renderer : Zarafa.plugins.files.data.Utils.Renderer.typeRenderer,
				width    : 24,
				fixed    : true,
				tooltip  : dgettext('plugin_files', 'Sort by: Type')
			},{
				header   : dgettext('plugin_files', 'Filename'),
				dataIndex: 'filename',
				width    : 160,
				tooltip  : dgettext('plugin_files', 'Sort by: Filename')
			},{
				header   : dgettext('plugin_files', 'Size'),
				dataIndex: 'message_size',
				width    : 80,
				renderer : Zarafa.plugins.files.data.Utils.Format.fileSizeList,
				tooltip  : dgettext('plugin_files', 'Sort by: Size')
			}],
			selModel: model,
			loadMask : {
				msg : _('Loading files') + '...'
			},
			store:{
				xtype: 'filesplugin.filesrecordstore'
			},
			viewConfig : {
				forceFit : true
			}
		});

		Zarafa.plugins.files.ui.dialogs.AttachFromFilesGridPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.attachfromfilesgridpanel', Zarafa.plugins.files.ui.dialogs.AttachFromFilesGridPanel);
