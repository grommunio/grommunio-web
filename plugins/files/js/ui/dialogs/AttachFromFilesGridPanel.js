/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui.dialogs');

/**
 * @class Grommunio.plugins.files.ui.dialogs.AttachFromFilesGridPanel
 * @extends Ext.grid.GridPanel
 * @xtype filesplugin.attachfromfilesgridpanel
 *
 * This dialog panel will provide facility to user to select the
 * files by checking checkbox from {@link Ext.grid.GridPanel GridPanel}.
 */
Grommunio.plugins.files.ui.dialogs.AttachFromFilesGridPanel = Ext.extend(Ext.grid.GridPanel, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		var model = new Ext.grid.CheckboxSelectionModel({
			checkOnly : true,
			headerCls: 'grommunio-icon-column',
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
				header   : '<p class="icon_index">&nbsp;<span class="title">' + _('Icon') + '</span></p>',
				headerCls: 'grommunio-icon-column icon',
				renderer : Grommunio.plugins.files.data.Utils.Renderer.typeRenderer,
				width    : 24,
				fixed    : true,
				tooltip  : _('Sort by: Type')
			},{
				header   : _('Filename'),
				dataIndex: 'filename',
				width    : 160,
				tooltip  : _('Sort by: Filename')
			},{
				header   : _('Size'),
				dataIndex: 'message_size',
				width    : 80,
				renderer : Grommunio.plugins.files.data.Utils.Format.fileSizeList,
				tooltip  : _('Sort by: Size')
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

		Grommunio.plugins.files.ui.dialogs.AttachFromFilesGridPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.attachfromfilesgridpanel', Grommunio.plugins.files.ui.dialogs.AttachFromFilesGridPanel);
