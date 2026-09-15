/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.plugins');

/**
 * @class Grommunio.core.plugins.ContentTabLayerPlugin
 * @extends Grommunio.core.plugins.ContentLayerPlugin
 * @ptype grommunio.contenttablayerplugin
 *
 * Implementation of the {@link Grommunio.core.plugins.ContentLayerPlugin ConentLayerPlugin}
 * which supports placing the {@link Grommunio.core.ui.ContentPanel Content Panel} inside a Tab
 */
Grommunio.core.plugins.ContentTabLayerPlugin = Ext.extend(Grommunio.core.plugins.ContentLayerPlugin, {
	/**
	 * This will bring focus to the Container by bringing it to the attention
	 * of the user by {@link Grommunio.core.ui.ContextContainer#setActiveTab activating the tab}
	 *
	 * @protected
	 */
	focus: function()
	{
		container.getTabPanel().setActiveTab(this.field);

		// Also move keyboard focus into the panel so its keymap works immediately
		// (e.g. Ctrl+Alt+W to close) without requiring a click.
		if (Ext.isFunction(this.field.focus)) {
			if (this.field.rendered) {
				this.field.focus();
			}
			else {
				this.field.on('afterrender', this.field.focus, this.field, { single: true });
			}
		}
	}
});

Ext.preg('grommunio.contenttablayerplugin', Grommunio.core.plugins.ContentTabLayerPlugin);
