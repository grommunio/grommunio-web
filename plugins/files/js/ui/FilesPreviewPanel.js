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
			// Without these the panel never saves the size the user dragged it to.
			stateEvents: ['resize', 'collapse', 'expand'],
			minWidth: 200,
			minHeight: 200,
			cls     : 'grommunio-files-previewpanel',
			// An even split until the user drags the separator somewhere else.
			splitShare: 0.5,
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
	},

	/**
	 * Applies the state which was saved for this panel. A stored size takes
	 * precedence over the {@link #splitShare even split} we start out with.
	 * @param {Object} state The state to apply
	 */
	applyState: function (state)
	{
		if (state && (Ext.isNumber(state.width) || Ext.isNumber(state.height))) {
			delete this.splitShare;
		}

		Grommunio.plugins.files.ui.FilesPreviewPanel.superclass.applyState.apply(this, arguments);
	}
});

Ext.reg('filesplugin.filespreviewpanel', Grommunio.plugins.files.ui.FilesPreviewPanel);

