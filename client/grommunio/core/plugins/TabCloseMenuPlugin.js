/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.plugins');

/**
 * @class Grommunio.core.plugins.TabCloseMenuPlugin
 * @extends Ext.ux.TabCloseMenu
 * @ptype grommunio.tabclosemenuplugin
 *
 * Extended so that the context menu would call the tab's close() method instead of directly destroying it
 * This class is intended to be used with {@link Grommunio.core.ui.MainContentTabPanel}
 * TODO: handle closing multiple tabs better
 */
Grommunio.core.plugins.TabCloseMenuPlugin = Ext.extend(Ext.ux.TabCloseMenu, {
	/**
	 * Overridden to add menu items from an insertion point
	 * @override
	 * @private
	 */
	createMenu: function(){
		if(!this.menu){
			var items = [{
				itemId: 'close',
				text: this.closeTabText,
				scope: this,
				handler: this.onClose
			}];
			if(this.showCloseAll){
				items.push('-');
			}
			items.push({
				itemId: 'closeothers',
				text: this.closeOtherTabsText,
				scope: this,
				handler: this.onCloseOthers
			});
			if(this.showCloseAll){
				items.push({
					itemId: 'closeall',
					text: this.closeAllTabsText,
					scope: this,
					handler: this.onCloseAll
				});
			}
			var lazyItems = container.populateInsertionPoint('main.content.tabpanel.tabclosemenu');
			this.menu = new Ext.menu.Menu({
				items: items.concat(lazyItems)
			});
		}
		return this.menu;
	},

	/**
	 * Overridden, because the original function calls remove() directly
	 * item.close() is better because it fires an event that notifies other components that the tab wants to close
	 * @override
	 * @private
	 */
	onClose: function(){
		this.active.close();
	},

	/**
	 * Overridden, because the original function calls remove() directly
	 * item.close() is better because it fires an event that notifies other components that the tab wants to close
	 * @param {Boolean} excludeActive Flag for whether to close all tabs but preserve the currently active one
	 * @override
	 * @private
	 */
	doClose: function(excludeActive){
		this.tabs.items.each(function(item){
			if(item.closable){
				if(!excludeActive || item != this.active){
					item.close();
				}
			}
		}, this);
	}
});

Ext.preg('grommunio.tabclosemenuplugin', Grommunio.core.plugins.TabCloseMenuPlugin);
