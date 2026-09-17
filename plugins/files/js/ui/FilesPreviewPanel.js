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

		Ext.applyIf(config, {
			xtype   : 'filesplugin.filespreviewpanel',
			layout  : 'fit',
			stateful: true,
			cls     : 'grommunio-files-previewpanel',
			width   : 300,
			height  : 300
		});

		// Only carry a toolbar when something asked for one; an empty one is
		// a 33px band above the preview.
		if (config.tbar && !Ext.isEmpty(config.tbar.items)) {
			config.tbar = Ext.applyIf(config.tbar, { xtype: 'grommunio.toolbar', height: 33 });
		} else {
			delete config.tbar;
		}

		Grommunio.plugins.files.ui.FilesPreviewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.filespreviewpanel', Grommunio.plugins.files.ui.FilesPreviewPanel);

