/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.backend.Default.ui');

/**
 * @class Grommunio.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype filesplugin.default.filesshareusereditcontentpanel
 *
 * This content panel contains the sharing edit panel.
 */
Grommunio.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel =
	Ext.extend(Grommunio.core.ui.ContentPanel, {
		/**
		 * The load mask for this content panel
		 * @property
		 * @type Ext.LoadMask
		 */
		loadMask: undefined,

		/**
		 * @constructor
		 * @param config
		 */
		constructor: function (config) {
			Ext.applyIf(config, {
				layout: 'fit',
				title: _('Share Details'),
				closeOnSave: true,
				model: true,
				autoSave: false,
				width: 550,
				height: 445,
				items: {
					xtype: 'filesplugin.default.filesshareusereditpanel',
					record: config.record,
					store: config.store,
					recordId: config.recordId,
				},
			});
			Grommunio.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel.superclass.constructor.call(
				this,
				config,
			);
		},
	});

Ext.reg(
	'filesplugin.default.filesshareusereditcontentpanel',
	Grommunio.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel,
);
