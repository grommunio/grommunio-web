/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.plugins');

/**
 * @class Grommunio.core.plugins.MenuItemTooltipPlugin
 * @extends Object
 * @ptype grommunio.menuitemtooltipplugin
 *
 * This plugin is use to set the tooltip on {@link Ext.menu.Item menuitem}
 * of {@link Ext.splitButton SplitButton}.
 */
Grommunio.core.plugins.MenuItemTooltipPlugin = Ext.extend(Grommunio.core.plugins.ComponentTooltipPlugin,{

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};
		Ext.apply(this, config);

		Grommunio.core.plugins.MenuItemTooltipPlugin.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the {@link Ext.Component Component} to which this plugin has been hooked.
	 * @param {Ext.menu.Item} field The field on which the plugin is installed.
	 */
	init: function(field)
	{
		Grommunio.core.plugins.MenuItemTooltipPlugin.superclass.init.apply(this, arguments);
		// Add event listener for the 'activate' event, if we are move the cursor on menu item then the
		// tooltip is display for particular menu item.
		this.field.on('activate', this.applyTooltip, this);
	},

	/**
	 * Used to apply the tooltip on {@link Ext.menu.Item menuitem} of {@link Ext.SplitBtton SplitBtton}
	 * @param {Ext.menu.Item} itemMenu The menu item of {@link Ext.SplitButton splitbutton}
	 */
	applyTooltip: function(itemMenu)
	{
		if(Ext.isDefined(itemMenu.tooltip)){
			Ext.QuickTips.unregister(itemMenu.getEl());
			if(Ext.isObject(itemMenu.tooltip)){
				Ext.QuickTips.register(Ext.apply({
					target: itemMenu.getEl().id
				}, itemMenu.tooltip));
			} else {
				itemMenu.getEl().dom.qtip = itemMenu.tooltip;
			}
		}
	}
});

Ext.preg('grommunio.menuitemtooltipplugin', Grommunio.core.plugins.MenuItemTooltipPlugin);
