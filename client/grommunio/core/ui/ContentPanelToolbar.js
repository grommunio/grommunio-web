/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/ui/Toolbar.js
 */
Ext.namespace("Grommunio.core.ui");

/**
 * @class Grommunio.core.ui.ContentPanelToolbar
 * @extends Grommunio.core.ui.Toolbar
 * @xtype grommunio.contentpaneltoolbar
 */
Grommunio.core.ui.ContentPanelToolbar = Ext.extend(Grommunio.core.ui.Toolbar, {
	/**
	 * @cfg {String} insertionPointBase The base string for Insertion points in
	 * this panel. (i.e. context.mail.showmailcontentpanel). This base name is
	 * used for accessing the insertion points which are defined for the content panel
	 * toolbar. Used insertion points are:
	 *	[insertionPointBase].toolbar.actions
	 *	[insertionPointBase].toolbar.options
	 */
	insertionPointBase: undefined,
	/**
	 * @cfg {Array} actionItems The array of {@link Ext.Component} elements which should be added to the actions {@link Ext.Button buttons} of the
	 * {@link Grommunio.core.ui.Toolbar}. These elements can be extended by the main.dialog.[dialog].toolbar.actions insertion point.
	 */
	actionItems: [],
	/**
	 * @cfg {Array} actionItems The array of {@link Ext.Component} elements which should be added to the options {@link Ext.Button buttons} of the
	 * {@link Grommunio.core.ui.Toolbar}. These elements can be extended by the main.dialog.[dialog].toolbar.options insertion point.
	 */
	optionItems: [],
	/**
	 * @cfg {Array} rightAlignedItems The array of {@link Ext.Component} elements which should be added to the options {@link Ext.Button buttons} of the
	 * {@link Grommunio.core.ui.Toolbar}. These elements can be extended by the main.dialog.[dialog].toolbar.options.right insertion point.
	 */
	rightAlignedItems: [],
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		Ext.apply(this, config, {
			// Override from Ext.Component
			xtype: 'grommunio.contentpaneltoolbar',
			cls: 'grommunio-dialogtoolbar'
		});

		// Declare events.
		this.addEvents(
			/**
			 * @event window_before_pop
			 * Fires before a window is popped in or out of the browser window.
			 * @param {Ext.data.Record} record The record which is currently used in the window
			 */
			'window_before_pop'
		);

		Grommunio.core.ui.ContentPanelToolbar.superclass.constructor.call(this, config);

		this.initButtonGroups();
	},

	/**
	 * Add default button groups to toolbar.
	 * @private
	 */
	initButtonGroups: function()
	{
		var namespace = this.insertionPointBase + '.toolbar';

		// Initialize the items list with all buttons which were registered through insertion points.
		this.addItems(this.actionItems, namespace + '.actions');
		this.addItems(this.optionItems, namespace + '.options');

		// It will render all rightAlignedItems to the Right side in toolbar
		if(!Ext.isEmpty(this.rightAlignedItems)) {
			this.rightAlignedItems = ["->"].concat(this.rightAlignedItems);
			this.addItems(this.rightAlignedItems, namespace + '.options.right');
		}
	}
});

Ext.reg('grommunio.contentpaneltoolbar', Grommunio.core.ui.ContentPanelToolbar);
