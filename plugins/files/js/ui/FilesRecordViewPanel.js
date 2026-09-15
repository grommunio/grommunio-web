/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui');

Grommunio.plugins.files.ui.FilesRecordViewPanel = Ext.extend(Ext.Panel, {

	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'filesplugin.filesrecordviewpanel',
			border: false,
			cls   : 'grommunio-filesviewpanel',
			layout: 'grommunio.collapsible',
			items : [{
				xtype: 'filesplugin.filesrecorddetailspanel'
			}]
		});

		Grommunio.plugins.files.ui.FilesRecordViewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.filesrecordviewpanel', Grommunio.plugins.files.ui.FilesRecordViewPanel);
