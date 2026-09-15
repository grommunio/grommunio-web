/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.ui');

/**
 * @class Grommunio.core.ui.MainTab
 * @extends Ext.Toolbar.Item
 * @xtype grommunio.maintab
 *
 * Is used to render the tabs in the {@link Grommunio.core.ui.MainTabBar MainTabBar}. It will relate to
 * a context and based on what is the active context according to the
 * {@link Grommunio.core.Container Container} it will mark itself as active.
 */
Grommunio.core.ui.MainTab = Ext.extend( Ext.Button, {
	/**
	 * @cfg {String} context Holds the name of the {@link Grommunio.core.Context Context} that this tab is related to.
	 */
	context: null,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.maintab',
			cls: 'grommunio-maintab',
			buttonActiveCls: 'grommunio-maintabbar-maintab-active',
			handler: this.selectContext
		});

		Grommunio.core.ui.MainTab.superclass.constructor.call(this, config);

		this.mon(container, 'contextswitch', this.onContextSwitch, this);
		this.on('render', this.onRenderButton, this);
	},

	/**
	 * When switching to another context the state of the tab is re-evaluated.
	 * @private
	 */
	onContextSwitch: function(parameters, oldContext, newContext)
	{
		this.setContextActivityState(newContext);
	},

	/**
	 * When the tab is rendered the correct state is set.
	 * @private
	 */
	onRenderButton: function()
	{
		this.setContextActivityState(container.getCurrentContext());
	},

	/**
	 * Set the state of the tab based on the what the currently active context is. It will add the
	 * {@link #buttonActiveCls} as CSS class for the tab that is related to the active context. It
	 * will be removed if the related context is not active.
	 * @param {Grommunio.core.Context} currentContext The current context
	 * @private
	 */
	setContextActivityState: function(currentContext)
	{
		if(this.context == currentContext.getName()){
			this.addClass(this.buttonActiveCls);
			if (this.el) {
				this.el.set({ 'aria-current': 'page' });
			}
		} else {
			this.removeClass(this.buttonActiveCls);
			if (this.el) {
				this.el.dom.removeAttribute('aria-current');
			}
		}
	},


	/**
	 * Selects the context that this tab is related to set by the {@link #context} property. It will
	 * grab the {@link Grommunio.core.ContextModel ContextModel} and retrieve the default folder if the
	 * ContextModel exists. The default folder is opened for that context. The navigation panel is
	 * also just showing the folders related to that context.
	 * @private
	 */
	selectContext: function()
	{
		var context = container.getContextByName(this.context);

		if(context) {
			if(context === container.getCurrentContext()) {
				// if we are loading same context then don't do anything
				return;
			}

			var contextModel = context.getModel();
			var contextFolder;
			if (contextModel) {
				// Try to determine the folders, if previously
				// no folders were selected, we should select
				// the default folder.
				contextFolder = contextModel.getFolders();
				if (Ext.isEmpty(contextFolder)) {
					contextFolder = contextModel.getDefaultFolder();
				}
			}

			container.switchContext(context, contextFolder);
		}
	}
});

Ext.reg('grommunio.maintab', Grommunio.core.ui.MainTab);
