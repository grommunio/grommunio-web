/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.ComponentBox
 * @singleton
 *
 * The global component box which holds all aliases to important components.
 */
Grommunio.plugins.files.data.ComponentBox = Ext.extend(Object, {

	/**
	 * Get the files context.
	 *
	 * @return {Grommunio.plugins.files.FilesContext}
	 */
	getContext: function () {
		return container.getContextByName("filescontext");
	},

	/**
	 * Get the main panel.
	 *
	 * @return {Grommunio.core.ui.MainViewport}
	 */
	getMainPanel: function () {
		try {
			return container.getContentPanel();
		} catch (e) {
			return container.getTabPanel().get(0).getActiveItem();
		}
	},

	/**
	 * Get the preview panel.
	 *
	 * @return {Grommunio.plugins.files.ui.FilesPreviewPanel}
	 */
	getPreviewPanel: function () {
		return this.getMainPanel().filesPreview;
	},

	/**
	 * Get the tabpanel.
	 *
	 * @return {Grommunio.core.ui.ContextContainer}
	 */
	getTabPanel: function () {
		return container.getTabPanel();
	},

	/**
	 * Get the files viewpanel.
	 *
	 * @return {Grommunio.core.ui.SwitchViewContentContainer}
	 */
	getViewPanel: function () {
		return this.getMainPanel().viewPanel;
	},

	/**
	 * Get the files gridpanel or iconviewpanel.
	 *
	 * @return {Grommunio.plugins.files.ui.FilesRecordGridView} or {Grommunio.plugins.files.ui.FilesRecordIconView}
	 */
	getItemsView: function () {
		return this.getViewPanel().getActiveItem();
	}
});

Grommunio.plugins.files.data.ComponentBox = new Grommunio.plugins.files.data.ComponentBox();