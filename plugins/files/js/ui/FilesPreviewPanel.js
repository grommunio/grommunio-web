/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui');

/**
 * @class Grommunio.plugins.files.ui.FilesPreviewPanel
 * @extends Ext.Panel
 * @xtype filesplugin.filespreviewpanel
 *
 * The preview panel container for the files preview.
 */
Grommunio.plugins.files.ui.FilesPreviewPanel = Ext.extend(Ext.Panel, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		var toolbar = Ext.applyIf(config.tbar || {}, {
			xtype : 'grommunio.toolbar',
			height: 33,
			hidden: false,
			items : []
		});

		Ext.applyIf(config, {
			xtype   : 'filesplugin.filespreviewpanel',
			layout  : 'fit',
			stateful: true,
			cls     : 'grommunio-files-previewpanel',
			width   : 300,
			height  : 300,
			tbar    : toolbar
		});

		Grommunio.plugins.files.ui.FilesPreviewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.filespreviewpanel', Grommunio.plugins.files.ui.FilesPreviewPanel);

